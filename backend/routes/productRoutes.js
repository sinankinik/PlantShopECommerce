// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validationMiddleware = require('../middleware/validationMiddleware'); // Tüm validasyonları buradan alıyoruz
const { protect, restrictTo } = require('../middleware/authMiddleware');
// uploadMiddleware artık Multer'ın kendisini ve Sharp ile işleme fonksiyonlarını içeriyor
const uploadMiddleware = require('../utils/uploadHandler'); // uploadHandler.js dosyasını import ediyoruz


// Public routes (herkes erişebilir)
router.get('/', productController.getAllProducts);

// Yeni: Düşük stoklu ürünleri getir (admin yetkisi gerektirir)
// Bu rota, '/:id' rotasından ÖNCE gelmelidir ki doğru eşleşsin.
router.get('/low-stock', protect, restrictTo('admin'), productController.getLowStockProducts);

router.get('/:id', productController.getProductById);

// Protected routes (admin yetkisi gerektirenler)
router.use(protect); // protect middleware'i tüm admin rotaları için genel olarak uygulanır

// Ürün oluşturma rotası (resim yükleme ve boyutlandırma ile)
router.post(
    '/',
    restrictTo('admin'),
    uploadMiddleware.uploadSingleProductImage, // Multer ile resmi belleğe yükle
    uploadMiddleware.resizeAndSaveProductImage, // Sharp ile resmi boyutlandır ve kaydet
    validationMiddleware.productCreateValidation,
    validationMiddleware.validate,
    productController.createProduct // Controller artık req.file.path'i kullanacak
);

router.patch(
    '/:id',
    restrictTo('admin'),
    validationMiddleware.productUpdateValidation,
    validationMiddleware.validate,
    productController.updateProduct
);

router.delete('/:id', restrictTo('admin'), productController.deleteProduct);

// Resim yükleme rotası (Mevcut bir ürünün resmini güncellemek için)
router.patch(
    '/:id/upload-image', // Ürüne özel tekil resim yükleme rotası
    restrictTo('admin'), // Sadece adminlerin ürün resmi yükleyebilmesi için
    uploadMiddleware.uploadSingleProductImage, // Multer middleware'i (req.file objesini oluşturur)
    uploadMiddleware.resizeAndSaveProductImage, // Sharp middleware'i (resmi boyutlandırır ve kaydeder)
    productController.uploadProductImage // Yüklenen resmi veritabanına kaydetme (image_url güncelleme)
);

/*
// Birden fazla resim yüklemek isterseniz (galeri için)
router.post(
    '/:id/upload-images',
    restrictTo('admin'),
    uploadMiddleware.uploadProductImages, // Multer middleware'i (array için)
    uploadMiddleware.resizeAndSaveProductImages, // Sharp middleware'i (resimleri boyutlandırır ve kaydeder)
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