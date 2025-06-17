// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validationMiddleware = require('../middleware/validationMiddleware'); // Tüm validasyonları buradan alıyoruz
const { protect, restrictTo } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware'); // Resim yükleme middleware'i

// Public routes (herkes erişebilir)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (admin yetkisi gerektirenler)
// Bu middleware'i burada kullanarak, altındaki tüm rotaların kimlik doğrulaması gerektirmesini sağlıyoruz.
// Ancak varyant rotaları için protect ve restrictTo ayrı ayrı belirtilmiştir.
// Bu duruma göre ya genel .use(protect) kaldırılır, ya da varyant rotalarına protect eklenmez.
// Mevcut yapıda her ikisini de kullanmak, güvenlik katmanını vurgular.
router.use(protect);

router.post(
    '/',
    restrictTo('admin'),
    validationMiddleware.productCreateValidation,
    validationMiddleware.validate,
    productController.createProduct
);

router.patch(
    '/:id',
    restrictTo('admin'),
    validationMiddleware.productUpdateValidation,
    validationMiddleware.validate,
    productController.updateProduct
);

router.delete('/:id', restrictTo('admin'), productController.deleteProduct);

// Resim yükleme rotası (Admin yetkisi gerektirir)
router.post(
    '/:id/upload-image', // Ürüne özel tekil resim yükleme
    restrictTo('admin'), // Zaten router.use(protect) olduğu için protect eklemeye gerek yok
    uploadMiddleware.uploadProductImage, // Multer middleware'i
    productController.uploadProductImage // Resmi veritabanına kaydetme (image_url güncelleme)
);

/*
// Birden fazla resim yüklemek isterseniz (galeri için)
router.post(
    '/:id/upload-images',
    restrictTo('admin'),
    uploadMiddleware.uploadProductImages, // Multer middleware'i (array için)
    productController.uploadProductImages // Resim bilgilerini veritabanına kaydetme (galeri tablosu)
);
*/

// Ürün varyantları ile ilgili rotalar (admin yetkisi gerektirir)
router
    .route('/:productId/variants')
    .post(
        restrictTo('admin'),
        validationMiddleware.createProductVariantValidation,
        validationMiddleware.validate,
        productController.createProductVariant
    )
    .get(productController.getProductVariants); // Adminler ve kullanıcılar varyantları görebilir

router
    .route('/:productId/variants/:variantId')
    .get(productController.getProductVariantById) // Belirli bir varyantı ID ile görme
    .patch(
        restrictTo('admin'),
        validationMiddleware.updateProductVariantValidation,
        validationMiddleware.validate,
        productController.updateProductVariant
    )
    .delete(
        restrictTo('admin'),
        productController.deleteProductVariant
    );

module.exports = router;