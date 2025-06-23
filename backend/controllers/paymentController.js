// backend/controllers/paymentController.js

const db = require('../config/db'); // Veritabanı bağlantısı
const paymentService = require('../utils/payment/PaymentService'); // Ödeme Servisimizi import et
const { AppError, BadRequestError, NotFoundError } = require('../errors/AppError');
const PaymentError = require('../utils/payment/PaymentError'); // Özel ödeme hata sınıfımız
const { decreaseStock, increaseStock } = require('../utils/stockHelper');
/**
 * Ödeme başlatma endpoint'i.
 * İstemciden gelen sipariş bilgileriyle bir ödeme işlemi başlatır.
 * @param {object} req - İstek nesnesi
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.createPayment = async (req, res, next) => {
    // Ödeme bilgilerini request body'den al
    const { orderId, amount, currency } = req.body;
    const userId = req.user.id; // protect middleware'inden gelen kullanıcı ID'si

    if (!orderId || !amount || !currency || amount <= 0) {
        return next(new BadRequestError('Sipariş ID, miktar ve para birimi zorunludur ve miktar sıfırdan büyük olmalıdır.'));
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Siparişin varlığını ve durumunu kontrol et (sadece 'pending' siparişler ödenebilir)
        const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = "pending" FOR UPDATE', [orderId, userId]);
        const order = orderRows[0];

        if (!order) {
            await connection.rollback();
            return next(new NotFoundError('Ödeme yapılacak bekleyen sipariş bulunamadı veya sipariş size ait değil.'));
        }

        // Ödeme sağlayıcısının beklediği miktarı kontrol edin.
        // Eğer veritabanınızdaki 'amount' değeri kuruş/cent cinsinden değilse (örn: 100.00 TL),
        // bunu ödeme sağlayıcısının beklediği en küçük birime dönüştürmelisiniz (örn: 10000 kuruş).
        // Şu anki varsayım: 'amount' zaten en küçük birimde geliyor veya bu controller'da dönüştürülecek.
        const amountInSmallestUnit = Math.round(order.total_amount * 100); // Örneğin, 100.00 TL için 10000 kuruş

        // 2. Ödeme servisi ile ödeme işlemini başlat
        const paymentResult = await paymentService.createPayment({
            orderId: order.id,
            amount: amountInSmallestUnit,
            currency: currency.toLowerCase(), // Stripe küçük harf para birimi bekler
            userId: userId,
            description: `Sipariş #${order.id} için ödeme`
        });

        // 3. Siparişin durumunu güncelle ve ödeme bilgilerini kaydet
        // Sipariş durumu 'processing' olarak güncellenebilir veya 'requires_action' durumuna göre ayarlanabilir.
        // Basitlik adına, şimdilik doğrudan 'processing' yapıyoruz.
        await connection.query(
            'UPDATE orders SET status = ?, payment_intent_id = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['processing', paymentResult.paymentIntentId, paymentResult.status, orderId]
        );

        await connection.commit();

        res.status(200).json({
            status: 'success',
            message: 'Ödeme başlatıldı.',
            data: {
                payment: paymentResult, // clientSecret'i de içerir
                orderId: order.id,
                orderStatus: 'processing'
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Ödeme başlatılırken hata:', error);
        // PaymentError'ı doğrudan fırlat, diğer AppError'lar için next(error) kullan
        next(error instanceof AppError ? error : new AppError('Ödeme başlatılırken bir hata oluştu.', 500, true, error));
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Ödeme durumunu sorgulama endpoint'i.
 * @param {object} req - İstek nesnesi
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.getPaymentStatus = async (req, res, next) => {
    const { paymentIntentId } = req.params; // URL'den paymentIntentId'yi al

    if (!paymentIntentId) {
        return next(new BadRequestError('Ödeme durumu sorgulamak için Payment Intent ID gereklidir.'));
    }

    try {
        const statusResult = await paymentService.getPaymentStatus(paymentIntentId);

        // İsteğe bağlı: Veritabanındaki sipariş durumunu Stripe'tan gelen güncel durumla senkronize et
        // Burayı, sadece önemli durum değişikliklerinde (örn. succeeded, failed, canceled) tetikleyebilirsiniz.
        if (statusResult.status === 'succeeded' || statusResult.status === 'canceled' || statusResult.status === 'failed') {
             // Sadece admin yetkisiyle veya bu işlemi transaction içinde güvenli yapın
             // Basitlik adına burada direkt güncelliyoruz, ama gerçekte daha karmaşık bir mantık olabilir.
            const newOrderStatus = statusResult.status === 'succeeded' ? 'completed' : 'failed';
            await db.query('UPDATE orders SET payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_intent_id = ?',
                [statusResult.status, newOrderStatus, paymentIntentId]);
        }


        res.status(200).json({
            status: 'success',
            message: 'Ödeme durumu başarıyla sorgulandı.',
            data: {
                paymentStatus: statusResult
            }
        });

    } catch (error) {
        console.error('Ödeme durumu sorgulanırken hata:', error);
        next(error instanceof AppError ? error : new AppError('Ödeme durumu sorgulanırken bir hata oluştu.', 500, true, error));
    }
};

/**
 * Ödeme iade etme endpoint'i.
 * @param {object} req - İstek nesnesi
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.refundPayment = async (req, res, next) => {
    const { orderId } = req.body; // Sipariş ID'si
    const { amount } = req.body; // İade edilecek miktar (opsiyonel)
    const userId = req.user.id; // protect middleware'inden gelen kullanıcı ID'si

    if (!orderId) {
        return next(new BadRequestError('İade edilecek sipariş ID\'si gereklidir.'));
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Siparişin varlığını ve ödeme intent ID'sini kontrol et
        // Sadece adminlerin veya sipariş sahibinin iade isteyebilmesi gerekir
        // ve siparişin zaten iade edilmemiş/iptal edilmemiş olması gerekir.
        const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE', [orderId, userId]);
        const order = orderRows[0];

        if (!order) {
            await connection.rollback();
            return next(new NotFoundError('İade edilecek sipariş bulunamadı veya sipariş size ait değil.'));
        }

        if (!order.payment_intent_id) {
            await connection.rollback();
            return next(new BadRequestError('Bu sipariş için bir ödeme işlemi bulunamadı.'));
        }

        if (order.status === 'refunded' || order.status === 'cancelled') {
            await connection.rollback();
            return next(new BadRequestError('Bu sipariş zaten iade edilmiş veya iptal edilmiş.'));
        }

        // İade edilecek miktarı kontrol et
        let refundAmountInSmallestUnit = null;
        if (amount !== undefined && amount !== null) {
            if (amount <= 0 || amount > order.total_amount) {
                await connection.rollback();
                return next(new BadRequestError('İade edilecek miktar geçersiz.'));
            }
            refundAmountInSmallestUnit = Math.round(amount * 100);
        } else {
             // Tam iade durumunda, total_amount'ı kullanın
             refundAmountInSmallestUnit = Math.round(order.total_amount * 100);
        }


        // 2. Ödeme servisi ile iade işlemini başlat
        const refundResult = await paymentService.refundPayment(order.payment_intent_id, refundAmountInSmallestUnit);

        // 3. Siparişin durumunu ve ödeme durumunu güncelle
        let newOrderStatus = 'refunded'; // Varsayılan olarak tam iade
        if (refundResult.status === 'succeeded') {
            // Tam iade
            await connection.query(
                'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newOrderStatus, refundResult.status, orderId]
            );

            // Stokları artır (sadece tam iade durumunda)
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
                await db.increaseStock(connection, itemsToIncreaseStock); // stockHelper'daki fonksiyonu kullanın
            }

        } else if (refundResult.status === 'pending') {
             newOrderStatus = 'pending_refund';
             await connection.query(
                'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newOrderStatus, refundResult.status, orderId]
            );
        } else { // failed, canceled
            newOrderStatus = 'refund_failed';
             await connection.query(
                'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newOrderStatus, refundResult.status, orderId]
            );
        }


        await connection.commit();

        res.status(200).json({
            status: 'success',
            message: `Sipariş başarıyla iade edildi. İade durumu: ${refundResult.status}`,
            data: {
                refund: refundResult,
                orderId: order.id,
                newOrderStatus: newOrderStatus
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Ödeme iade edilirken hata:', error);
        next(error instanceof AppError ? error : new AppError('Ödeme iade edilirken bir hata oluştu.', 500, true, error));
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * İstemci tarafı ödeme sağlayıcısı yapılandırmasını döndürür.
 * Bu genellikle önyüz uygulamasının ödeme formunu başlatmak için kullanılır (örn: Stripe Public Key).
 * @param {object} req - İstek nesnesi
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.getPaymentClientConfig = async (req, res, next) => {
    try {
        const clientConfig = paymentService.getClientConfig();
        res.status(200).json({
            status: 'success',
            data: {
                clientConfig
            }
        });
    } catch (error) {
        console.error('İstemci ödeme yapılandırması alınırken hata:', error);
        next(error instanceof AppError ? error : new AppError('Ödeme yapılandırması alınırken bir hata oluştu.', 500, true, error));
    }
};