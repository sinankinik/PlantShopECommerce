// backend/routes/promotionRoutes.js

const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Admin yetkilendirmesi için

// Tüm promosyon rotaları için 'protect' ve 'restrictTo('admin')' uygulayacağız
// Bu, sadece yöneticilerin promosyonları yönetebileceği anlamına gelir.
router.use(protect);
// Admin paneline geçtiğimizde 'restrictTo('admin')' middleware'ini buraya ekleyeceğiz.
// router.use(protect, restrictTo('admin')); // Şimdilik sadece protect ile kalsın

router.route('/')
    .post(promotionController.createPromotion) // Promosyon oluştur
    .get(promotionController.getAllPromotions); // Tüm promosyonları listele

router.route('/:promotionId')
    .get(promotionController.getPromotionById) // Belirli bir promosyonu getir
    .patch(promotionController.updatePromotion) // Promosyonu güncelle
    .delete(promotionController.deletePromotion); // Promosyonu sil

module.exports = router;