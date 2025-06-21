// backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // authMiddleware dosyanızın yolunu kontrol edin

// Herkese açık rotalar (eğer varsa, şu an için siparişlerde yok)
// router.get('/', orderController.getAllProducts); // Örnek

// Kullanıcıya özel rotalar (oturum açmış kullanıcılar)
router.use(protect); // Bu noktadan sonraki tüm rotalar için kimlik doğrulama gereklidir

// Kullanıcının kendi siparişlerini getir
router.get('/my-orders', orderController.getUserOrders);

// Yeni sipariş oluştur
router.post('/', orderController.createOrder);

// Belirli bir siparişi ID ile getir (kullanıcının kendi siparişi veya admin)
router.get('/:id', orderController.getOrderById);

// Sadece Admin yetkisi gerektiren rotalar
router.use(restrictTo('admin')); // Bu noktadan sonraki tüm rotalar için admin yetkisi gereklidir

// Tüm siparişleri getir (sadece admin)
router.get('/', orderController.getAllOrders);

// Sipariş durumu güncelleme (PUT - Stok artışı bu fonksiyon içinde)
// Bu rota, /api/orders/:id/status şeklinde bir PUT isteği bekler.
router.put('/:id/status', orderController.updateOrderStatus);

// Sipariş bilgilerini genel olarak güncelleme (PUT - Stok artışı bu fonksiyon içinde de olabilir)
// Bu rota, /api/orders/:id şeklinde bir PUT isteği bekler.
// Eğer updateOrderStatus özel bir rota olarak yeterliyse, bunu kullanmayabilirsiniz veya
// updateOrder'ı daha genel bir güncelleme için tutabilirsiniz.
router.put('/:id', orderController.updateOrder);


// Siparişi silme (DELETE - Stokları otomatik geri eklemez, tamamen siler)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;