// backend/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware'); // Kullanıcı kimlik doğrulama middleware'i

// Bir ürüne yorum ekleme veya mevcut yorumu güncelleme (POST veya PUT gibi düşünülebilir)
// Kullanıcı girişi gereklidir
router.post('/products/:productId', protect, reviewController.createOrUpdateReview);

// Bir ürüne ait tüm yorumları ve ortalama derecelendirmeyi getir (herkes erişebilir)
router.get('/products/:productId', reviewController.getProductReviews);

// Bir yorumu silme (sadece yorumu yapan kullanıcı silebilir)
router.delete('/:reviewId', protect, reviewController.deleteReview);

module.exports = router;