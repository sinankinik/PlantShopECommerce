// backend/controllers/orderController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError, ForbiddenError } = require('../errors/AppError'); // Hata sınıflarınızın yolu doğru mu?

// Sipariş oluşturma
exports.createOrder = async (req, res, next) => {
    // protect middleware'inden gelen kullanıcı bilgisini kullanmak daha güvenli
    const user_id = req.user.id;
    const { total_amount, shipping_address, order_items } = req.body;

    let connection; // Transaction için bağlantı değişkeni

    try {
        connection = await db.getConnection(); // Bağlantıyı al
        await connection.beginTransaction(); // Transaction başlat

        // 1. Sipariş kaydını oluştur
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
            [user_id, total_amount, shipping_address, 'pending'] // Varsayılan durum: 'pending'
        );
        const orderId = orderResult.insertId;

        // 2. Sipariş ürünlerini (order_items) kaydet
        for (const item of order_items) {
            const { product_id, quantity, price } = item;

            // Ürün stok kontrolü
            const [productRows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [product_id]);
            const product = productRows[0];
            if (!product || product.stock_quantity < quantity) {
                throw new BadRequestError(`Ürün (ID: ${product_id}) stokta yeterli miktarda bulunmuyor veya mevcut değil.`);
            }

            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, product_id, quantity, price]
            );

            // Stok güncelleme
            await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, product_id]);
        }

        await connection.commit(); // Transaction'ı onayla

        res.status(201).json({
            status: 'success',
            message: 'Sipariş başarıyla oluşturuldu.',
            data: { orderId }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback(); // Hata durumunda transaction'ı geri al
        }
        console.error('Sipariş oluşturulurken hata:', err);
        // Hata bir AppError ise doğrudan ilet, değilse yeni bir AppError oluştur
        next(err instanceof AppError ? err : new AppError('Sipariş oluşturulurken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release(); // Bağlantıyı havuza geri bırak
        }
    }
};

// Tüm siparişleri getir
exports.getAllOrders = async (req, res, next) => {
    try {
        // Adminler tüm siparişleri, kullanıcılar sadece kendi siparişlerini görebilir.
        let query = 'SELECT o.id, o.user_id, o.total_amount, o.status, o.shipping_address, o.created_at, o.updated_at, u.username as user_username, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id';
        let params = [];

        if (req.user.role !== 'admin') {
            query += ' WHERE o.user_id = ?';
            params.push(req.user.id);
        }

        // Filtreleme, sıralama, sayfalama (isteğe bağlı)
        // Eğer APIFeatures kullanıyorsanız, buraya entegre edebilirsiniz.
        // const features = new APIFeatures(query, req.query).filter().sort().paginate();
        // const [orders] = await db.query(features.query, features.params);

        const [orders] = await db.query(query, params);

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders }
        });
    } catch (err) {
        console.error('Siparişler getirilirken hata:', err);
        next(new AppError('Siparişler getirilirken bir hata oluştu.', 500));
    }
};

// Belirli bir siparişi ID ile getir
exports.getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const [rows] = await db.query(
            'SELECT o.id, o.user_id, o.total_amount, o.status, o.shipping_address, o.created_at, o.updated_at, u.username as user_username, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
            [orderId]
        );
        const order = rows[0];

        if (!order) {
            return next(new NotFoundError('Sipariş bulunamadı.'));
        }

        // Eğer kullanıcı admin değilse ve sipariş kendi siparişi değilse yetkisiz erişim
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return next(new ForbiddenError('Bu siparişi görüntülemeye yetkiniz yok.'));
        }

        // Siparişin ürünlerini de getir
        const [items] = await db.query(
            'SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price, p.name as product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
            [orderId]
        );
        order.items = items;

        res.status(200).json({
            status: 'success',
            data: { order }
        });
    } catch (err) {
        console.error('Sipariş getirilirken hata:', err);
        next(new AppError('Sipariş getirilirken bir hata oluştu.', 500));
    }
};

// Sipariş durumu veya diğer bilgileri güncelleme (Genellikle admin veya satıcı için)
exports.updateOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status, total_amount, shipping_address } = req.body;

        const [existingOrder] = await db.query('SELECT id, user_id FROM orders WHERE id = ?', [orderId]);
        if (!existingOrder[0]) {
            return next(new NotFoundError('Güncellenecek sipariş bulunamadı.'));
        }

        // Yetkilendirme kontrolü: Sadece adminler veya kendi siparişini güncelleyen kullanıcılar (belli durumlar için)
        // Burada sadece adminlerin güncellemesini sağlamak en güvenlisidir.
        if (req.user.role !== 'admin') {
            return next(new ForbiddenError('Siparişleri güncelleme yetkiniz yok.'));
        }

        const updates = [];
        const params = [];

        if (status !== undefined) {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
            if (!validStatuses.includes(status)) {
                return next(new BadRequestError('Geçersiz sipariş durumu.'));
            }
            updates.push('status = ?');
            params.push(status);
        }
        if (total_amount !== undefined) {
            updates.push('total_amount = ?');
            params.push(total_amount);
        }
        if (shipping_address !== undefined) {
            updates.push('shipping_address = ?');
            params.push(shipping_address);
        }

        if (updates.length === 0) {
            return next(new BadRequestError('Güncellenecek en az bir alan sağlamalısınız.'));
        }

        params.push(orderId); // WHERE koşulu için ID

        const [result] = await db.query(`UPDATE orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

        res.status(200).json({
            status: 'success',
            message: 'Sipariş başarıyla güncellendi.',
            data: { orderId }
        });
    } catch (err) {
        console.error('Sipariş güncellenirken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş güncellenirken bir hata oluştu.', 500));
    }
};


// Sipariş silme (Genellikle admin için, dikkatli kullanılmalı)
exports.deleteOrder = async (req, res, next) => {
    let connection;
    try {
        const orderId = req.params.id;

        // Yetkilendirme kontrolü: Sadece adminler silebilir
        if (req.user.role !== 'admin') {
            return next(new ForbiddenError('Siparişleri silme yetkiniz yok.'));
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Önce sipariş kalemlerini sil
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

        // Sonra siparişi sil
        const [result] = await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Transaction'ı geri al
            return next(new NotFoundError('Silinecek sipariş bulunamadı.'));
        }

        await connection.commit(); // Transaction'ı onayla

        res.status(204).json({
            status: 'success',
            data: null,
            message: 'Sipariş başarıyla silindi.'
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Sipariş silinirken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş silinirken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release(); // Bağlantıyı havuza geri bırak
        }
    }
};