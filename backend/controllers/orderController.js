// backend/controllers/orderController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError, ForbiddenError } = require('../errors/AppError');
const { decreaseStock, increaseStock } = require('../utils/stockHelper'); // Stok yardımcılarını import et

// Sipariş oluşturma
exports.createOrder = async (req, res, next) => {
    const user_id = req.user.id;
    const { shipping_address, order_items } = req.body;

    let connection; // connection'ı try bloğu dışında tanımlıyoruz ki finally bloğunda erişebilelim

    try {
        connection = await db.getConnection(); // Veritabanı bağlantısını al
        await connection.beginTransaction(); // İşlemi başlat

        let calculatedTotalAmount = 0;
        const itemsToDecreaseStock = []; // Stok azaltma için kullanılacak ürün listesi

        // Sipariş kalemlerini döngüye alarak stok kontrolü ve fiyat hesaplama
        for (const item of order_items) {
            const { product_id, variant_id, quantity } = item;

            if (quantity <= 0) {
                throw new BadRequestError(`Ürün (ID: ${product_id}) için miktar sıfırdan büyük olmalı.`);
            }

            let currentStock = 0;
            let currentPrice = 0;
            let productName = '';
            let productCheckResult;

            // Varyantlı ürün ise varyant stoğunu ve fiyatını kontrol et
            if (variant_id) {
                [productCheckResult] = await connection.query(
                    'SELECT pv.stock_quantity, pv.price, p.name FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ? AND pv.product_id = ? FOR UPDATE', // Satırı kilitliyoruz
                    [variant_id, product_id]
                );
                if (productCheckResult.length === 0) {
                    throw new NotFoundError(`Ürün varyantı (ID: ${variant_id}) bulunamadı.`);
                }
                currentStock = productCheckResult[0].stock_quantity;
                currentPrice = productCheckResult[0].price;
                productName = productCheckResult[0].name;

            } else {
                // Ana ürün ise ana ürün stoğunu ve fiyatını kontrol et
                [productCheckResult] = await connection.query(
                    'SELECT stock_quantity, price, name FROM products WHERE id = ? FOR UPDATE', // Satırı kilitliyoruz
                    [product_id]
                );
                if (productCheckResult.length === 0) {
                    throw new NotFoundError(`Ürün (ID: ${product_id}) bulunamadı.`);
                }
                currentStock = productCheckResult[0].stock_quantity;
                currentPrice = productCheckResult[0].price;
                productName = productCheckResult[0].name;
            }

            // Yetersiz stok kontrolü
            if (currentStock < quantity) {
                throw new BadRequestError(`Ürün '${productName}' (ID: ${product_id}${variant_id ? ', Varyant ID: ' + variant_id : ''}) stokta yeterli miktarda bulunmuyor. Mevcut: ${currentStock}, İstendi: ${quantity}.`);
            }

            calculatedTotalAmount += currentPrice * quantity; // Toplam tutarı hesapla

            // Sipariş kalemi için o anki fiyat ve ürün adını kaydet
            item.price = currentPrice;
            item.product_name = productName;

            itemsToDecreaseStock.push({
                productId: product_id,
                variantId: variant_id,
                quantity: quantity
            });
        }

        // Sipariş kaydını orders tablosuna ekle
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
            [user_id, calculatedTotalAmount, shipping_address, 'pending']
        );
        const orderId = orderResult.insertId;

        // Sipariş kalemlerini order_items tablosuna ekle
        for (const item of order_items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price_at_order) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.variant_id || null, item.quantity, item.price]
            );
        }

        // Stokları azaltma işlemini çağırıyoruz, aynı bağlantıyı iletiyoruz
        await decreaseStock(connection, itemsToDecreaseStock);

        await connection.commit(); // Tüm işlemler başarılıysa işlemi onayla

        res.status(201).json({
            status: 'success',
            message: 'Sipariş başarıyla oluşturuldu ve stoklar güncellendi.',
            data: { orderId, totalAmount: calculatedTotalAmount }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback(); // Hata oluşursa işlemi geri al
        }
        console.error('Sipariş oluşturulurken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş oluşturulurken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release(); // Bağlantıyı havuza geri bırak
        }
    }
};

// Tüm siparişleri getir (Adminler tüm siparişleri, kullanıcılar kendi siparişlerini)
exports.getAllOrders = async (req, res, next) => {
    try {
        let query = 'SELECT o.id, o.user_id, o.total_amount, o.status, o.shipping_address, o.created_at, o.updated_at, u.username as user_username, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id';
        let params = [];

        if (req.user.role !== 'admin') {
            query += ' WHERE o.user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY o.created_at DESC';

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

// Belirli bir siparişi ID ile getir (Admin veya kendi siparişi)
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

        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return next(new ForbiddenError('Bu siparişi görüntülemeye yetkiniz yok.'));
        }

        const [items] = await db.query(
            'SELECT oi.id, oi.order_id, oi.product_id, oi.product_variant_id, oi.quantity, oi.price_at_order AS price, ' +
            'p.name as product_name, p.image_url as product_image_url, ' +
            'pv.name as variant_name, pv.image_url as variant_image_url, pv.attributes as variant_attributes ' +
            'FROM order_items oi ' +
            'JOIN products p ON oi.product_id = p.id ' +
            'LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id ' +
            'WHERE oi.order_id = ?',
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

// Kullanıcının kendi siparişlerini listeleme
exports.getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [orders] = await db.query(
            'SELECT o.id, o.total_amount, o.status, o.shipping_address, o.created_at FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC',
            [userId]
        );

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders }
        });
    } catch (err) {
        console.error('Kullanıcının siparişleri getirilirken hata:', err);
        next(new AppError('Kullanıcının siparişleri getirilirken bir hata oluştu.', 500));
    }
};


// Sipariş durumu güncelleme (Admin yetkisi gerektirir)
exports.updateOrderStatus = async (req, res, next) => {
    let connection;
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return next(new BadRequestError('Güncellenecek sipariş durumu gereklidir.'));
        }

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return next(new BadRequestError('Geçersiz sipariş durumu. Geçerli durumlar: ' + validStatuses.join(', ')));
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Güncellenecek siparişi kilitliyoruz
        const [existingOrders] = await connection.query('SELECT status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        if (existingOrders.length === 0) {
            throw new NotFoundError('Güncellenecek sipariş bulunamadı.');
        }

        const currentStatus = existingOrders[0].status;

        // Eğer sipariş iptal veya iade ediliyorsa stokları geri artır
        if ((currentStatus !== 'cancelled' && status === 'cancelled') ||
            (currentStatus !== 'refunded' && status === 'refunded')) {

            const [orderItems] = await connection.query(
                'SELECT product_id, product_variant_id, quantity FROM order_items WHERE order_id = ?',
                [orderId]
            );

            const itemsToIncreaseStock = orderItems.map(item => ({
                productId: item.product_id,
                variantId: item.product_variant_id,
                quantity: item.quantity
            }));

            if (itemsToIncreaseStock.length > 0) {
                await increaseStock(connection, itemsToIncreaseStock); // BURADAKİ DEĞİŞİKLİK
            }
        }

        // Sipariş durumunu güncelle
        const [result] = await connection.query(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            throw new AppError('Sipariş güncellenemedi, bir hata oluştu.', 500);
        }

        await connection.commit(); // İşlemi onayla

        res.status(200).json({
            status: 'success',
            message: `Sipariş durumu başarıyla '${status}' olarak güncellendi.`,
            data: { orderId, newStatus: status }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback(); // Hata durumunda geri al
        }
        console.error('Sipariş durumu güncellenirken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş durumu güncellenirken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release(); // Bağlantıyı havuza geri bırak
        }
    }
};

// Sipariş genel güncelleme (Admin yetkisi gerektirir)
exports.updateOrder = async (req, res, next) => {
    let connection;
    try {
        const orderId = req.params.id;
        const { status, total_amount, shipping_address } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Mevcut siparişi kontrol et ve kilit (FOR UPDATE)
        const [existingOrderRows] = await connection.query('SELECT id, user_id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        const existingOrder = existingOrderRows[0];
        if (!existingOrder) {
            throw new NotFoundError('Güncellenecek sipariş bulunamadı.');
        }

        // Yetkilendirme kontrolü
        if (req.user.role !== 'admin') {
            throw new ForbiddenError('Siparişleri güncelleme yetkiniz yok.');
        }

        const updates = [];
        const params = [];

        // Durum güncellemesi varsa
        if (status !== undefined) {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
            if (!validStatuses.includes(status)) {
                throw new BadRequestError('Geçersiz sipariş durumu.');
            }
            updates.push('status = ?');
            params.push(status);

            // Stok artırma mantığı (iptal/iade durumunda)
            if ((existingOrder.status !== 'cancelled' && status === 'cancelled') ||
                (existingOrder.status !== 'refunded' && status === 'refunded')) {
                const [orderItems] = await connection.query(
                    'SELECT product_id, product_variant_id, quantity FROM order_items WHERE order_id = ?',
                    [orderId]
                );
                const itemsToIncreaseStock = orderItems.map(item => ({
                    productId: item.product_id,
                    variantId: item.product_variant_id,
                    quantity: item.quantity
                }));
                if (itemsToIncreaseStock.length > 0) {
                    await increaseStock(connection, itemsToIncreaseStock); // BURADAKİ DEĞİŞİKLİK
                }
            }
        }

        // total_amount güncellemesi
        if (total_amount !== undefined) {
            updates.push('total_amount = ?');
            params.push(total_amount);
        }

        // shipping_address güncellemesi
        if (shipping_address !== undefined) {
            updates.push('shipping_address = ?');
            params.push(shipping_address);
        }

        if (updates.length === 0) {
            throw new BadRequestError('Güncellenecek en az bir alan sağlamalısınız.');
        }

        params.push(orderId); // WHERE koşulu için ID

        const [result] = await connection.query(`UPDATE orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

        if (result.affectedRows === 0) {
            throw new AppError('Sipariş güncellenemedi, bir hata oluştu.', 500);
        }

        await connection.commit(); // Transaction'ı onayla

        res.status(200).json({
            status: 'success',
            message: 'Sipariş başarıyla güncellendi.',
            data: { orderId }
        });
    } catch (err) {
        if (connection) {
            await connection.rollback(); // Hata durumunda transaction'ı geri al
        }
        console.error('Sipariş güncellenirken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş güncellenirken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release(); // Bağlantıyı havuza geri bırak
        }
    }
};


// Sipariş silme (Sadece admin için, dikkatli kullanılmalı)
exports.deleteOrder = async (req, res, next) => {
    let connection;
    try {
        const orderId = req.params.id;

        if (req.user.role !== 'admin') {
            return next(new ForbiddenError('Siparişleri silme yetkiniz yok.'));
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // NOT: Sipariş silindiğinde stoklar otomatik olarak geri eklenmez.
        // Eğer silinen bir siparişin ürünlerinin stoğa geri eklenmesi isteniyorsa,
        // bu mantık buraya `increaseStock` çağrısıyla eklenmelidir.
        // Ancak çoğu e-ticaret sisteminde "silme" yerine "iptal etme" tercih edilir.

        // Önce sipariş kalemlerini sil
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

        // Sonra siparişi sil
        const [result] = await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return next(new NotFoundError('Silinecek sipariş bulunamadı.'));
        }

        await connection.commit();

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
            connection.release();
        }
    }
};