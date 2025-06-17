// backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // authMiddleware'in yolu doğru olduğundan emin olun
const {
    orderCreateValidation,
    orderUpdateValidation,
    orderIdParamValidation,
    validate
} = require('../middleware/validationMiddleware'); // validationMiddleware'in yolu doğru olduğundan emin olun

// Tüm siparişleri getir (kullanıcı kendi siparişlerini, admin tümünü)
router.get('/', protect, orderController.getAllOrders);

// Belirli bir siparişi ID ile getir (kullanıcı kendi siparişini, admin tümünü)
router.get('/:id', protect, orderIdParamValidation, validate, orderController.getOrderById);

// Yeni sipariş oluştur (oturum açmış kullanıcılar için)
router.post(
    '/',
    protect, // Kullanıcının oturum açmış olması gerekir
    orderCreateValidation, // İstek gövdesini doğrula
    validate, // Doğrulama hatalarını işle
    orderController.createOrder // Sipariş oluşturma işleyicisi
);

// Sipariş güncelle (sadece adminler için)
router.patch(
    '/:id',
    protect,
    restrictTo('admin'), // Sadece adminler bu rotayı kullanabilir
    orderIdParamValidation, // ID parametre validasyonu
    orderUpdateValidation, // İstek gövdesi validasyonu
    validate, // Doğrulama hatalarını işle
    orderController.updateOrder
);

// Sipariş sil (sadece adminler için)
router.delete(
    '/:id',
    protect,
    restrictTo('admin'), // Sadece adminler bu rotayı kullanabilir
    orderIdParamValidation, // ID parametre validasyonu
    validate, // Doğrulama hatalarını işle
    orderController.deleteOrder
);

module.exports = router;