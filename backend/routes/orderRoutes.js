// backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // authMiddleware dosyanızın yolunu kontrol edin
const validationMiddleware = require('../middleware/validationMiddleware'); // Validasyon middleware'ini import edin

// Kullanıcıya özel rotalar (oturum açmış kullanıcılar)
router.use(protect); // Bu noktadan sonraki tüm rotalar için kimlik doğrulama gereklidir

// Kullanıcının kendi siparişlerini getir
router.get(
    '/my-orders', 
    orderController.getUserOrders
);

// Yeni sipariş oluştur
router.post(
    '/', 
    validationMiddleware.orderCreateValidation, // Sipariş oluşturma validasyonu eklendi
    validationMiddleware.validate,
    orderController.createOrder
);

// Belirli bir siparişi ID ile getir (kullanıcının kendi siparişi veya admin)
router.get(
    '/:id', 
    validationMiddleware.orderIdParamValidation, // Sipariş ID validasyonu eklendi
    validationMiddleware.validate,
    orderController.getOrderById
);

// Sadece Admin yetkisi gerektiren rotalar
router.use(restrictTo('admin')); // Bu noktadan sonraki tüm rotalar için admin yetkisi gereklidir

// Tüm siparişleri getir (sadece admin)
router.get(
    '/', 
    orderController.getAllOrders
);

// Sipariş durumu güncelleme (PATCH - Stok artışı bu fonksiyon içinde)
// Bu rota, /api/orders/:id/status şeklinde bir PATCH isteği bekler.
router.patch( 
    '/:id/status', 
    validationMiddleware.orderIdParamValidation, // Sipariş ID validasyonu eklendi
    validationMiddleware.orderStatusUpdateValidation, // Sipariş durumu güncelleme validasyonu eklendi
    validationMiddleware.validate,
    orderController.updateOrderStatus
);

// Sipariş bilgilerini genel olarak güncelleme (PATCH)
// Bu rota, /api/orders/:id şeklinde bir PATCH isteği bekler.
router.patch( 
    '/:id', 
    validationMiddleware.orderIdParamValidation, // Sipariş ID validasyonu eklendi
    validationMiddleware.orderUpdateValidation, // Sipariş güncelleme validasyonu eklendi
    validationMiddleware.validate,
    orderController.updateOrder
);

// Siparişi silme (DELETE - Stokları otomatik geri eklemez, tamamen siler)
router.delete(
    '/:id', 
    validationMiddleware.orderIdParamValidation, // Sipariş ID validasyonu eklendi
    validationMiddleware.validate,
    orderController.deleteOrder
);

module.exports = router;