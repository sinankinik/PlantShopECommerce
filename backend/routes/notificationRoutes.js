// backend/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Tüm bildirim rotaları için 'protect' ve 'restrictTo('admin')' uygulayacağız
router.use(protect, restrictTo('admin')); // Sadece adminler bildirim gönderebilir

router.post('/marketing-email', notificationController.sendMarketingEmail);

module.exports = router;