// backend/routes/categoryRoutes.js

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // authMiddleware'in yolu doğru olduğundan emin olun
const {
    categoryCreateValidation,
    categoryUpdateValidation,
    categoryIdParamValidation,
    validate
} = require('../middleware/validationMiddleware'); // validationMiddleware'in yolu doğru olduğundan emin olun

// Public rotalar: Tüm kategorileri getir, Belirli bir kategoriyi ID ile getir
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryIdParamValidation, validate, categoryController.getCategoryById); // ID parametre validasyonu eklendi

// Protected rotalar (Admin yetkisi gerektirir)
router.use(protect, restrictTo('admin'));

router.post('/', categoryCreateValidation, validate, categoryController.createCategory);
router.patch('/:id', categoryIdParamValidation, categoryUpdateValidation, validate, categoryController.updateCategory); // ID validasyonu eklendi
router.delete('/:id', categoryIdParamValidation, validate, categoryController.deleteCategory); // ID validasyonu eklendi

module.exports = router;