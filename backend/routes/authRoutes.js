// backend/routes/authRoutes.js (Güncellenmiş Kısım)

const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public rotalar (oturum açmayı gerektirmez)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);

// Şifre sıfırlama için hem GET (tarayıcıdan erişim) hem de PATCH (yeni şifreyi gönderme)
// Her iki rota da authMiddleware.protect'in dışında olmalı!
router.get('/resetPassword/:token', authController.resetPasswordTokenCheck); // <-- Yeni GET rotası (Opsiyonel, sadece token kontrolü için)
router.patch('/resetPassword/:token', authController.resetPassword); // Mevcut PATCH rotası

router.get('/verifyEmail/:token', authController.verifyEmail);


// Oturum açmayı gerektiren rotalar
// Buradan itibaren tüm rotalar authMiddleware.protect tarafından korunur
router.use(authMiddleware.protect);

router.get('/me', authController.getMe);
router.patch('/updateMyProfile', authController.updateMyProfile);
router.patch('/updateMyPassword', authController.updateMyPassword);
router.delete('/deleteMyAccount', authController.deleteMyAccount);


module.exports = router;