// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validationMiddleware = require('../middleware/validationMiddleware');
// authMiddleware'den sadece 'protect' fonksiyonunu içeri aktarıyoruz
const { protect } = require('../middleware/authMiddleware');

// --- PUBLIC ROTLAR (Kimlik Doğrulama GEREKMEZ) ---
// Bu rotalara herhangi bir kullanıcı, hatta oturum açmamış kullanıcılar bile erişebilir.

// Kullanıcı Kaydı (Register)
router.post(
    '/register',
    validationMiddleware.userRegisterValidation,
    validationMiddleware.validate,
    authController.register
);

// Kullanıcı Girişi (Login)
router.post(
    '/login',
    validationMiddleware.userLoginValidation,
    validationMiddleware.validate,
    authController.login
);

// Şifremi Unuttum (Forgot Password)
// Bu rota, kullanıcının oturum açamaması durumunda şifresini sıfırlaması için kullanılır, bu yüzden public olmalı.
router.post(
    '/forgotPassword',
    validationMiddleware.forgotPasswordValidation,
    validationMiddleware.validate,
    authController.forgotPassword
);

// Şifre Sıfırlama (Reset Password)
// Bu rota da şifremi unuttum akışının bir parçasıdır ve public olmalıdır.
router.patch(
    '/resetPassword/:token',
    validationMiddleware.resetPasswordValidation,
    validationMiddleware.validate,
    authController.resetPassword
);

// E-posta Doğrulama (Verify Email)
// E-posta doğrulaması için de kullanıcının zaten oturum açmış olması gerekmez.
router.get(
    '/verifyEmail/:token',
    validationMiddleware.verifyEmailValidation,
    validationMiddleware.validate,
    authController.verifyEmail
);

// Çıkış Yapma (Logout)
// Çıkış işlemi genellikle herkese açık olabilir, çünkü sadece sunucu tarafındaki JWT çerezini temizler.
router.post('/logout', authController.logout);


// ----------------------------------------------------


// --- KORUMALI ROTLAR (Kimlik Doğrulama GEREKİR) ---
// 'router.use(protect);' satırı, bu noktadan sonra tanımlanan TÜM rotalara 'protect' middleware'ini uygular.
// Yani, bu rotalara erişmek için geçerli bir JWT'ye sahip bir kullanıcının oturum açmış olması gerekir.
router.use(protect);

// Kendi profil bilgilerini görüntüleme
router.get('/me', authController.getMe);

// Kendi profil bilgilerini güncelleme
router.patch(
    '/updateMyProfile',
    validationMiddleware.userProfileUpdateValidation,
    validationMiddleware.validate,
    authController.updateMyProfile
);

// Şifremi değiştirme
router.patch(
    '/updateMyPassword',
    validationMiddleware.userChangePasswordValidation,
    validationMiddleware.validate,
    authController.updateMyPassword
);

// Kendi hesabını silme (Öncelikle onay alınması tavsiye edilir)
router.delete('/deleteMyAccount', authController.deleteMyAccount);

module.exports = router;