// backend/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // authMiddleware'in yolu doğru olduğundan emin olun

// Tüm raporlama rotaları için kimlik doğrulama ve admin yetkisi zorunluluğu
router.use(protect);
router.use(restrictTo('admin'));

// Genel satış raporunu getir (tarih aralığına göre)
// GET /api/reports/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/sales', reportController.getOverallSalesReport);

// En çok satan ürünleri getir (limit'e göre)
// GET /api/reports/top-selling-products?limit=5
router.get('/top-selling-products', reportController.getTopSellingProducts);

// Kullanıcı istatistiklerini getir (yeni kayıtlar için tarih aralığı eklenebilir)
// GET /api/reports/user-statistics
// GET /api/reports/user-statistics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/user-statistics', reportController.getUserStatistics);

module.exports = router;