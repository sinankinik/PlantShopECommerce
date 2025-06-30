// backend/routes/authRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const validationMiddleware = require('../middleware/validationMiddleware'); // Validasyon middleware'ini import edin

const router = express.Router();

// Kullanıcı kayıt rotası
router.post(
    '/register',
    validationMiddleware.userRegisterValidation, // Kayıt validasyonu
    validationMiddleware.validate,
    authController.register
);

// Kullanıcı giriş rotası
router.post(
    '/login',
    validationMiddleware.userLoginValidation, // Giriş validasyonu
    validationMiddleware.validate,
    authController.login
);

// Kullanıcı çıkış rotası
router.post('/logout', authController.logout); // <-- Bu rota, 404 hatasını çözmek için kritik

// Şifremi unuttum rotası
router.post(
    '/forgot-password',
    validationMiddleware.forgotPasswordValidation, // Şifremi unuttum validasyonu
    validationMiddleware.validate,
    authController.forgotPassword
);

// Şifre sıfırlama rotası (token ile)
router.patch(
    '/reset-password/:token',
    validationMiddleware.resetPasswordValidation, // Şifre sıfırlama validasyonu
    validationMiddleware.validate,
    authController.resetPassword
);

// E-posta doğrulama rotası (token ile)
router.get(
    '/verify-email/:token',
    validationMiddleware.verifyEmailValidation, // E-posta doğrulama validasyonu
    validationMiddleware.validate,
    authController.verifyEmail
);

module.exports = router;
