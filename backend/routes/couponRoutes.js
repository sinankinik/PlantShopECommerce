// backend/routes/couponRoutes.js

const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Admin yetkilendirmesi için restrictTo'yu da import ettik

// Kupon oluşturma (şimdilik sadece 'protect' ile korunsun, admin paneline geçtiğimizde 'restrictTo('admin')' ekleyeceğiz)
router.post('/', protect, couponController.createCoupon);

// Kupon uygulama (herkes kullanabilir, sadece giriş yapmış olması yeterli)
router.post('/apply', protect, couponController.applyCoupon);

// Kupon güncelleme (admin yetkisi gerektirecek)
router.patch('/:couponId', protect, couponController.updateCoupon);

// Kupon silme (admin yetkisi gerektirecek)
router.delete('/:couponId', protect, couponController.deleteCoupon);

// Tüm kuponları listeleme (admin yetkisi gerektirecek)
router.get('/', protect, couponController.getAllCoupons);

module.exports = router;