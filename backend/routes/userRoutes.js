// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validationMiddleware = require('../middleware/validationMiddleware');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Tüm kullanıcı yönetimi rotaları için kimlik doğrulaması ve admin yetkisi zorunluluğu
router.use(protect);
router.use(restrictTo('admin'));

// Tüm kullanıcıları getir (Adminler için)
router.get(
    '/',
    userController.getAllUsers
);

// Belirli bir kullanıcıyı ID ile getir (Adminler için)
router.get(
    '/:id',
    userController.getUserById
);

// Yeni kullanıcı oluştur (Adminler için, genellikle register ile ayrılır)
// Ancak admin panelinden manuel kullanıcı eklemek için kullanılabilir
router.post(
    '/',
    validationMiddleware.userRegisterValidation, // Kayıt validasyonunu tekrar kullanabiliriz
    validationMiddleware.validate,
    userController.createUser
);

// Kullanıcıyı güncelle (Adminler için)
router.patch(
    '/:id',
    validationMiddleware.userUpdateByAdminValidation, // Yeni validasyon gerekecek
    validationMiddleware.validate,
    userController.updateUser
);

// Kullanıcıyı sil (Adminler için)
router.delete(
    '/:id',
    userController.deleteUser
);

module.exports = router;