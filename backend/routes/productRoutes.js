// backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validationMiddleware = require('../middleware/validationMiddleware'); // Tüm validasyonları buradan alıyoruz
const { protect, restrictTo } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware'); // Resim yükleme middleware'i

// Public routes (herkes erişebilir)
router.get('/', productController.getAllProducts);

// Yeni: Düşük stoklu ürünleri getir (admin yetkisi gerektirir)
// Bu rota, '/:id' rotasından ÖNCE gelmelidir ki doğru eşleşsin.
// Aynı zamanda 'protect' ve 'restrictTo('admin')' middleware'lerini doğrudan uyguluyoruz.
router.get('/low-stock', protect, restrictTo('admin'), productController.getLowStockProducts);


router.get('/:id', productController.getProductById); // Bu rota şimdi '/low-stock'tan sonra geldiği için doğru çalışacaktır.

// Protected routes (admin yetkisi gerektirenler)
// Aşağıdaki 'router.use(protect)' satırı zaten bu noktadan sonraki tüm rotalar için geçerliydi.
// Ancak yukarıdaki '/low-stock' rotasını bu bloğun dışına taşıdığımız için,
// o rota için 'protect' ve 'restrictTo('admin')' i ayrı ayrı belirtmemiz gerekti.
// Mevcut yapınızı korumak adına aşağıdaki 'router.use(protect)' kalabilir,
// ancak '/low-stock' için ekstra olarak belirtilmesi önemlidir.

// Eğer tüm aşağıdaki rotalar zaten protect ve restrictTo('admin') altında olması gerekiyorsa,
// bu router.use() satırı mantıklıdır.
router.use(protect); // protect middleware'i tüm admin rotaları için genel olarak uygulanır

router.post(
    '/',
    restrictTo('admin'),
    validationMiddleware.productCreateValidation,
    validationMiddleware.validate,
    productController.createProduct // createProduct içinde artık multer çağrısı yok
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
router.patch( // Genellikle bir kaynağı güncellemek için PATCH kullanılır.
    '/:id/upload-image', // Ürüne özel tekil resim yükleme rotası (productId burada id olarak alınır)
    restrictTo('admin'), // Sadece adminlerin ürün resmi yükleyebilmesi için
    uploadMiddleware.uploadProductImage, // Multer middleware'i (req.file objesini oluşturur)
    productController.uploadProductImage // Yüklenen resmi veritabanına kaydetme (image_url güncelleme)
);

/*
// Birden fazla resim yüklemek isterseniz (galeri için)
router.post(
    '/:id/upload-images',
    restrictTo('admin'),
    uploadMiddleware.uploadProductImages, // Multer middleware'i (array için)
    productController*.uploadProductImages // Resim bilgilerini veritabanına kaydetme (galeri tablosu)
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
