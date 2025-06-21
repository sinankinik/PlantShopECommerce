// backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController'); // orderController'ın doğru import edildiğinden emin olun
const { protect, restrictTo } = require('../middleware/authMiddleware'); // authMiddleware'in yolu doğru olduğundan emin olun
const {
    orderCreateValidation,
    orderUpdateValidation,
    orderStatusUpdateValidation, // Eğer bu validasyon kuralı `validationMiddleware.js` içinde tanımlıysa kalsın
    orderIdParamValidation,
    validate
} = require('../middleware/validationMiddleware'); // validationMiddleware'in yolu doğru olduğundan emin olun

// Yeni sipariş oluştur (oturum açmış kullanıcılar için)
router.post(
    '/',
    protect, // Kullanıcının oturum açmış olması gerekir
    orderCreateValidation, // İstek gövdesini doğrula (items, shippingAddress gibi)
    validate, // Doğrulama hatalarını işle
    orderController.createOrder // Bu fonksiyonun orderController.js içinde exports.createOrder olarak tanımlandığından emin olun
);

// Kullanıcının kendi siparişlerini getir (sadece oturum açmış kullanıcı)
// Bu rotayı diğer 'getAllOrders' rotasından önce tanımlayın ki çakışmasın.
router.get('/my-orders', protect, orderController.getUserOrders); // Bu fonksiyonun orderController.js içinde exports.getUserOrders olarak tanımlandığından emin olun


// Tüm siparişleri getir (adminler tüm siparişleri, diğer kullanıcılar hata alır veya bu rotayı görmez)
// 'getAllOrders' fonksiyonu içeride kullanıcının admin olup olmadığını kontrol ediyor.
router.get('/', protect, orderController.getAllOrders); // Bu fonksiyonun orderController.js içinde exports.getAllOrders olarak tanımlandığından emin olun

// Belirli bir siparişi ID ile getir (kullanıcı kendi siparişini, admin tümünü)
router.get(
    '/:id',
    protect, // Hem admin hem de kullanıcı erişebilir (yetkilendirme controller içinde)
    orderIdParamValidation,
    validate,
    orderController.getOrderById // Bu fonksiyonun orderController.js içinde exports.getOrderById olarak tanımlandığından emin olun
);

router.patch(
    '/:id/status', // /api/orders/:id/status
    protect,
    restrictTo('admin'), // Sadece adminler bu rotayı kullanabilir
    orderIdParamValidation, // ID parametre validasyonu
    orderStatusUpdateValidation, // Sipariş durumu için özel validasyon (eğer var/oluşturulacaksa)
    validate,
    orderController.updateOrderStatus // Buradaki ismin orderController.js'deki exports ile tam eşleştiğinden emin olun.
);

// Genel sipariş bilgisi güncelle (adminler için, status hariç diğer alanlar için olabilir)
// Mevcut updateOrder fonksiyonunuz status, total_amount, shipping_address güncelliyordu.
router.patch(
    '/:id',
    protect,
    restrictTo('admin'), // Sadece adminler bu rotayı kullanabilir
    orderIdParamValidation,
    orderUpdateValidation, // İstek gövdesi validasyonu (status, total_amount, shipping_address)
    validate,
    orderController.updateOrder // <-- Buradaki ismin orderController.js'deki exports ile tam eşleştiğinden emin olun.
);


// Sipariş sil (sadece adminler için)
router.delete(
    '/:id',
    protect,
    restrictTo('admin'), // Sadece adminler bu rotayı kullanabilir
    orderIdParamValidation, // ID parametre validasyonu
    validate, // Doğrulama hatalarını işle
    orderController.deleteOrder // Bu fonksiyonun orderController.js içinde exports.deleteOrder olarak tanımlandığından emin olun
);

module.exports = router;