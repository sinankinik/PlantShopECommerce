// backend/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Auth middleware'ı

// Tüm ödeme rotaları için kimlik doğrulama gereklidir (kullanıcı veya admin)
router.use(protect);

// Ödeme başlatma (bir sipariş için)
// Kullanıcılar kendi siparişleri için ödeme başlatabilir
router.post('/create-payment', paymentController.createPayment);

// Ödeme durumunu sorgulama
// Kullanıcılar kendi ödemelerinin durumunu sorgulayabilir, adminler herhangi bir ödemeyi
router.get('/status/:paymentIntentId', paymentController.getPaymentStatus);

// Ödeme sağlayıcısı istemci yapılandırmasını alma (örneğin Stripe Public Key)
// Önyüz uygulaması bu endpoint'i ödeme formunu başlatmak için çağırır
router.get('/client-config', paymentController.getPaymentClientConfig);

// Ödeme iade etme (GENELLİKLE SADECE ADMIN YETKİSİ GEREKTİRİR)
router.post('/refund', restrictTo('admin'), paymentController.refundPayment);

module.exports = router;