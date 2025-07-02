// backend/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // restrictTo'yu import edin

// Bir ürüne yorum ekleme veya mevcut yorumu güncelleme (Kullanıcı rotası)
router.post('/products/:productId', protect, reviewController.createOrUpdateReview);

// Bir ürüne ait tüm yorumları ve ortalama derecelendirmeyi getir (Herkese açık)
router.get('/products/:productId', reviewController.getProductReviews);

// --- YENİ EKLENEN KOD ---
// Tüm yorumları getir (Admin paneli için)
router.get('/', protect, restrictTo('admin'), reviewController.getAllReviews); // Sadece adminler tüm yorumları görebilir

// Yorumu silme (Kullanıcı kendi yorumunu silebilir, Admin herhangi bir yorumu silebilir)
// Bu rota, 'protect' middleware'i ile genel kullanıcı ve admin için çalışır.
// Controller içinde role kontrolü yapılır.
router.delete('/:reviewId', protect, reviewController.deleteReview); 

// Admin'in yorum durumunu güncellemesi için isteğe bağlı rota (Eğer isterseniz bu rotayı aktif edebilirsiniz)
// router.patch('/:reviewId/status', protect, restrictTo('admin'), reviewController.updateReviewStatus);

module.exports = router;
