// backend/controllers/orderController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError, ForbiddenError } = require('../errors/AppError');
const { decreaseStock, increaseStock } = require('../utils/stockHelper');
const APIFeatures = require('../utils/apiFeatures');

// Sipariş oluşturma
exports.createOrder = async (req, res, next) => {
    const user_id = req.user.id; // protect middleware'den gelen kullanıcı ID'si
    const { shipping_address, payment_method, order_items } = req.body; // payment_method eklendi

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let calculatedTotalAmount = 0;
        const itemsToDecreaseStock = [];
        const orderItemsForDb = []; // Veritabanına kaydedilecek kalemler

        for (const item of order_items) {
            const { product_id, product_variant_id, quantity } = item; // product_variant_id olarak güncellendi

            if (quantity <= 0) {
                throw new BadRequestError(`Ürün (ID: ${product_id}) için miktar sıfırdan büyük olmalı.`);
            }

            let currentStock = 0;
            let currentPrice = 0;
            let productName = '';
            let productImageUrl = ''; // Ürün görseli
            let variantName = null;
            let productCheckResult;

            // Ürün veya varyantın güncel fiyatını ve stok durumunu al
            if (product_variant_id) {
                [productCheckResult] = await connection.query(
                    `SELECT pv.stock_quantity, pv.price AS variant_price, p.name AS product_name, p.image_url AS product_image_url, pv.color, pv.size, p.price AS product_base_price
                     FROM product_variants pv 
                     JOIN products p ON pv.product_id = p.id 
                     WHERE pv.id = ? AND pv.product_id = ? FOR UPDATE`,
                    [product_variant_id, product_id]
                );
                if (productCheckResult.length === 0) {
                    throw new NotFoundError(`Ürün varyantı (ID: ${product_variant_id}) bulunamadı.`);
                }
                currentStock = productCheckResult[0].stock_quantity;
                currentPrice = productCheckResult[0].variant_price || productCheckResult[0].product_base_price; // Varyantın kendi fiyatı yoksa ürün fiyatını kullan
                productName = productCheckResult[0].product_name;
                productImageUrl = productCheckResult[0].product_image_url;
                variantName = `${productCheckResult[0].color ? productCheckResult[0].color + ' ' : ''}${productCheckResult[0].size ? productCheckResult[0].size : ''}`.trim();

            } else {
                [productCheckResult] = await connection.query(
                    'SELECT stock_quantity, price, name, image_url FROM products WHERE id = ? FOR UPDATE',
                    [product_id]
                );
                if (productCheckResult.length === 0) {
                    throw new NotFoundError(`Ürün (ID: ${product_id}) bulunamadı.`);
                }
                currentStock = productCheckResult[0].stock_quantity;
                currentPrice = productCheckResult[0].price;
                productName = productCheckResult[0].name;
                productImageUrl = productCheckResult[0].image_url;
            }

            if (currentStock < quantity) {
                throw new BadRequestError(`Ürün '${productName}' (ID: ${product_id}${product_variant_id ? ', Varyant ID: ' + product_variant_id : ''}) stokta yeterli miktarda bulunmuyor. Mevcut: ${currentStock}, İstendi: ${quantity}.`);
            }

            calculatedTotalAmount += currentPrice * quantity;

            // order_items tablosuna kaydedilecek bilgileri hazırla
            orderItemsForDb.push({
                product_id: product_id,
                product_variant_id: product_variant_id || null,
                quantity: quantity,
                price_at_order: currentPrice, // Düzeltme: 'price' yerine 'price_at_order' kullanıldı
                product_name: productName,
                product_image_url: productImageUrl,
                variant_name: variantName
            });

            itemsToDecreaseStock.push({
                productId: product_id,
                variantId: product_variant_id, // stockHelper için variantId olarak kalabilir
                quantity: quantity
            });
        }

        // 1. Siparişi oluştur
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, calculatedTotalAmount, shipping_address, payment_method, 'pending'] // payment_method eklendi
        );
        const orderId = orderResult.insertId;

        // 2. Sipariş kalemlerini ekle
        for (const item of orderItemsForDb) {
            await connection.query(
                // Düzeltme: 'price' yerine 'price_at_order' kullanıldı
                'INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price_at_order) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.product_variant_id, item.quantity, item.price_at_order]
            );
        }

        // 3. Stokları güncelle
        await decreaseStock(connection, itemsToDecreaseStock);

        await connection.commit(); // İşlemi onayla

        // Oluşturulan siparişin detaylarını geri döndür (frontend'in beklediği formatta)
        const formattedOrder = {
            id: orderId,
            user_id: user_id,
            total_amount: parseFloat(calculatedTotalAmount.toFixed(2)),
            shipping_address: shipping_address,
            payment_method: payment_method,
            status: 'pending',
            order_date: new Date().toISOString(), // Anlık zamanı ISO formatında gönder
            items: orderItemsForDb.map(item => ({
                id: null, // order_items tablosundan ID'yi çekmiyoruz, bu yüzden null
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                product_name: item.product_name,
                product_image_url: item.product_image_url,
                quantity: item.quantity,
                price: parseFloat(item.price_at_order), // Sipariş anındaki fiyat
                variant_name: item.variant_name
            }))
        };

        res.status(201).json({
            status: 'success',
            message: 'Sipariş başarıyla oluşturuldu ve stoklar güncellendi.',
            data: { order: formattedOrder }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Sipariş oluşturulurken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş oluşturulurken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Tüm siparişleri getir (Adminler tüm siparişleri, kullanıcılar kendi siparişlerini)
exports.getAllOrders = async (req, res, next) => {
    try {
        const baseQuery = `
            SELECT 
                o.id, 
                o.user_id, 
                o.total_amount, 
                o.status, 
                o.shipping_address, 
                o.order_date, 
                o.updated_at, 
                u.username as user_username, 
                u.email as user_email 
            FROM orders o 
            JOIN users u ON o.user_id = u.id
        `;

        const features = new APIFeatures(baseQuery, req.query)
            .filter()
            .search(['u.username', 'u.email', 'o.shipping_address'])
            .sort('o.order_date') // Düzeltme: 'created_at' yerine 'o.order_date' kullanıldı
            .paginate();

        const [orders] = await db.query(features.query, features.params);

        const countBaseQuery = `
            SELECT COUNT(o.id) as total 
            FROM orders o 
            JOIN users u ON o.user_id = u.id
        `;
        const countFeatures = new APIFeatures(countBaseQuery, req.query)
            .filter()
            .search(['u.username', 'u.email', 'o.shipping_address']);

        const [totalCountResult] = await db.query(countFeatures.query, countFeatures.params);
        const totalOrders = totalCountResult[0].total;

        // Her siparişin kalemlerini de çek ve formatla
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await db.query(
                `SELECT oi.id, oi.product_id, oi.product_variant_id, oi.quantity, oi.price_at_order AS price, 
                        p.name as product_name, p.image_url as product_image_url,
                        pv.color as variant_color, pv.size as variant_size
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            return {
                ...order,
                total_amount: parseFloat(order.total_amount),
                items: items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_variant_id: item.product_variant_id,
                    product_name: item.product_name,
                    product_image_url: item.product_image_url,
                    quantity: item.quantity,
                    price: parseFloat(item.price), 
                    variant_name: item.product_variant_id ? 
                                  `${item.variant_color ? item.variant_color + ' ' : ''}${item.variant_size ? item.variant_size : ''}`.trim() : null
                }))
            };
        }));

        res.status(200).json({
            status: 'success',
            results: ordersWithItems.length,
            total: totalOrders,
            data: { orders: ordersWithItems }
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
        const userId = req.user.id;
        const userRole = req.user.role;

        const [orderRows] = await db.query(
            'SELECT o.id, o.user_id, o.total_amount, o.status, o.shipping_address, o.payment_method, o.order_date, o.updated_at, u.username as user_username, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
            [orderId]
        );
        const order = orderRows[0];

        if (!order) {
            return next(new NotFoundError('Sipariş bulunamadı.'));
        }

        if (order.user_id !== userId && userRole !== 'admin') {
            return next(new ForbiddenError('Bu siparişi görüntülemeye yetkiniz yok.'));
        }

        // Sipariş kalemlerini de çek ve formatla
        const [items] = await db.query(
            `SELECT oi.id, oi.product_id, oi.product_variant_id, oi.quantity, oi.price_at_order AS price, 
                    p.name as product_name, p.image_url as product_image_url,
                    pv.color as variant_color, pv.size as variant_size
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const formattedOrder = {
            ...order,
            total_amount: parseFloat(order.total_amount),
            items: items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                product_name: item.product_name,
                product_image_url: item.product_image_url,
                quantity: item.quantity,
                price: parseFloat(item.price),
                variant_name: item.product_variant_id ? 
                                  `${item.variant_color ? item.variant_color + ' ' : ''}${item.variant_size ? item.variant_size : ''}`.trim() : null
            }))
        };

        res.status(200).json({
            status: 'success',
            data: { order: formattedOrder }
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
        const baseQuery = `
            SELECT 
                o.id, 
                o.total_amount, 
                o.status, 
                o.shipping_address, 
                o.payment_method,
                o.order_date, 
                o.updated_at
            FROM orders o 
            WHERE o.user_id = ?
        `;
        
        const features = new APIFeatures(baseQuery, req.query)
            .filter()
            .search(['o.shipping_address', 'o.status'])
            .sort('o.order_date') // Düzeltme: 'created_at' yerine 'o.order_date' kullanıldı
            .paginate();
        
        features.params.unshift(userId); 

        const [orders] = await db.query(features.query, features.params);

        const countBaseQuery = `
            SELECT COUNT(o.id) as total 
            FROM orders o 
            WHERE o.user_id = ?
        `;
        const countFeatures = new APIFeatures(countBaseQuery, req.query)
            .filter()
            .search(['o.shipping_address', 'o.status']);
        
        countFeatures.params.unshift(userId); 

        const [totalCountResult] = await db.query(countFeatures.query, countFeatures.params);
        const totalOrders = totalCountResult[0].total;

        // Her siparişin kalemlerini de çek ve formatla
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await db.query(
                `SELECT oi.id, oi.product_id, oi.product_variant_id, oi.quantity, oi.price_at_order AS price, 
                        p.name as product_name, p.image_url as product_image_url,
                        pv.color as variant_color, pv.size as variant_size
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            return {
                ...order,
                total_amount: parseFloat(order.total_amount),
                items: items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_variant_id: item.product_variant_id,
                    product_name: item.product_name,
                    product_image_url: item.product_image_url,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    variant_name: item.product_variant_id ? 
                                  `${item.variant_color ? item.variant_color + ' ' : ''}${item.variant_size ? item.variant_size : ''}`.trim() : null
                }))
            };
        }));

        res.status(200).json({
            status: 'success',
            results: ordersWithItems.length,
            total: totalOrders,
            data: { orders: ordersWithItems }
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
                await increaseStock(connection, itemsToIncreaseStock);
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

        await connection.commit();

        res.status(200).json({
            status: 'success',
            message: `Sipariş durumu başarıyla '${status}' olarak güncellendi.`,
            data: { orderId, newStatus: status }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Sipariş durumu güncellenirken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş durumu güncellenirken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Sipariş genel güncelleme (Admin yetkisi gerektirir)
exports.updateOrder = async (req, res, next) => {
    let connection;
    try {
        const orderId = req.params.id;
        const { status, total_amount, shipping_address, payment_method } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existingOrderRows] = await connection.query('SELECT id, user_id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        const existingOrder = existingOrderRows[0];
        if (!existingOrder) {
            throw new NotFoundError('Güncellenecek sipariş bulunamadı.');
        }

        if (req.user.role !== 'admin') {
            return next(new ForbiddenError('Siparişleri güncelleme yetkiniz yok.'));
        }

        const updates = [];
        const params = [];

        if (status !== undefined) {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
            if (!validStatuses.includes(status)) {
                throw new BadRequestError('Geçersiz sipariş durumu.');
            }
            updates.push('status = ?');
            params.push(status);

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
                    await increaseStock(connection, itemsToIncreaseStock);
                }
            }
        }

        if (total_amount !== undefined) {
            updates.push('total_amount = ?');
            params.push(total_amount);
        }

        if (shipping_address !== undefined) {
            updates.push('shipping_address = ?');
            params.push(shipping_address);
        }

        if (payment_method !== undefined) {
            updates.push('payment_method = ?');
            params.push(payment_method);
        }

        if (updates.length === 0) {
            throw new BadRequestError('Güncellenecek en az bir alan sağlamalısınız.');
        }

        params.push(orderId);

        const [result] = await connection.query(`UPDATE orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

        if (result.affectedRows === 0) {
            throw new AppError('Sipariş güncellenemedi, bir hata oluştu.', 500);
        }

        await connection.commit();

        res.status(200).json({
            status: 'success',
            message: 'Sipariş başarıyla güncellendi.',
            data: { orderId }
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Sipariş güncellenirken hata:', err);
        next(err instanceof AppError ? err : new AppError('Sipariş güncellenirken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release();
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

        // Stok geri ekleme mantığı burada yoktur, çünkü bu tamamen silme işlemidir.
        // Eğer silinen bir siparişin ürünlerinin stoğa geri eklenmesi isteniyorsa,
        // bu mantık buraya increaseStock çağrısıyla eklenmelidir.
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