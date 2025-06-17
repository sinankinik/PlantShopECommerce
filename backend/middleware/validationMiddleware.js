// backend/middleware/validationMiddleware.js

const { body, validationResult, param } = require('express-validator');
const { BadRequestError } = require('../errors/AppError'); // AppError'ın yolu doğru olduğundan emin olun

// Genel validasyon hatalarını yakalayan middleware
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next(); // Validasyon hatası yoksa bir sonraki middleware'e geç
    }

    // Hataları daha okunabilir bir formata dönüştürme
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    // BadRequestError ile hata döndürme
    return next(new BadRequestError('Validasyon hatası: ' + JSON.stringify(extractedErrors)));
};

// --- ÜRÜN VALIDASYONLARI ---

// Ürün oluşturma validasyonu
exports.productCreateValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Ürün adı zorunludur.')
        .isLength({ min: 3, max: 255 })
        .withMessage('Ürün adı 3 ile 255 karakter arasında olmalıdır.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Ürün açıklaması en fazla 1000 karakter olmalıdır.'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Fiyat sıfırdan büyük veya eşit bir sayı olmalıdır.'),
    body('stock_quantity')
        .isInt({ min: 0 })
        .withMessage('Stok miktarı sıfırdan büyük veya eşit bir tam sayı olmalıdır.'),
    body('image_url')
        .optional()
        .isURL()
        .withMessage('Geçerli bir resim URL\'si giriniz.'),
    body('category_id')
        .isInt({ min: 1 })
        .withMessage('Geçerli bir kategori ID\'si giriniz.'),
];

// Ürün güncelleme validasyonu (opsiyonel alanlar)
exports.productUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Ürün adı 3 ile 255 karakter arasında olmalıdır.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Ürün açıklaması en fazla 1000 karakter olmalıdır.'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Fiyat sıfırdan büyük veya eşit bir sayı olmalıdır.'),
    body('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stok miktarı sıfırdan büyük veya eşit bir tam sayı olmalıdır.'),
    body('image_url')
        .optional()
        .isURL()
        .withMessage('Geçerli bir resim URL\'si giriniz.'),
    body('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Geçerli bir kategori ID\'si giriniz.'),
];

// --- ÜRÜN VARYANTLARI VALIDASYONLARI ---

// Ürün varyantı oluşturma validasyonu
exports.createProductVariantValidation = [
    body('color')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Renk en az 1, en fazla 50 karakter olmalıdır.'),
    body('size')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Beden en az 1, en fazla 50 karakter olmalıdır.'),
    body('material')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Malzeme en az 1, en fazla 50 karakter olmalıdır.'),
    body('sku')
        .trim()
        .notEmpty()
        .withMessage('SKU zorunludur.')
        .isLength({ min: 3, max: 100 })
        .withMessage('SKU 3 ile 100 karakter arasında olmalıdır.'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Varyant fiyatı sıfırdan büyük veya eşit bir sayı olmalıdır.'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Varyant stok miktarı sıfırdan büyük veya eşit bir tam sayı olmalıdır.'),
    body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Geçerli bir varyant resim URL\'si giriniz.'),
];

// Ürün varyantı güncelleme validasyonu (opsiyonel alanlar)
exports.updateProductVariantValidation = [
    body('color')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Renk en az 1, en fazla 50 karakter olmalıdır.'),
    body('size')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Beden en az 1, en fazla 50 karakter olmalıdır.'),
    body('material')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Malzeme en az 1, en fazla 50 karakter olmalıdır.'),
    body('sku')
        .optional() // Güncellenmeyebilir
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('SKU 3 ile 100 karakter arasında olmalıdır.'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Varyant fiyatı sıfırdan büyük veya eşit bir sayı olmalıdır.'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Varyant stok miktarı sıfırdan büyük veya eşit bir tam sayı olmalıdır.'),
    body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Geçerli bir varyant resim URL\'si giriniz.'),
];

// --- KATEGORİ VALIDASYONLARI ---

// Kategori oluşturma validasyonu
exports.categoryCreateValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Kategori adı zorunludur.')
        .isLength({ min: 2, max: 100 })
        .withMessage('Kategori adı 2 ile 100 karakter arasında olmalıdır.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Açıklama en fazla 500 karakter olmalıdır.')
];

// Kategori güncelleme validasyonu
exports.categoryUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Kategori adı 2 ile 100 karakter arasında olmalıdır.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Açıklama en fazla 500 karakter olmalıdır.')
];

// Kategori ID'si parametre validasyonu
exports.categoryIdParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Geçersiz kategori ID\'si. ID bir sayı olmalı ve 1\'den küçük olmamalıdır.')
];

// --- KULLANICI (AUTH) VALIDASYONLARI ---

// Kullanıcı kayıt validasyonu
exports.userRegisterValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Kullanıcı adı zorunludur.')
        .isLength({ min: 3, max: 50 })
        .withMessage('Kullanıcı adı 3 ile 50 karakter arasında olmalıdır.'),
    body('email')
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz.'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Şifre en az 8 karakter olmalıdır.')
        .matches(/\d/)
        .withMessage('Şifre en az bir rakam içermelidir.')
        .matches(/[a-z]/)
        .withMessage('Şifre en az bir küçük harf içermelidir.')
        .matches(/[A-Z]/)
        .withMessage('Şifre en az bir büyük harf içermelidir.')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Şifre en az bir özel karakter içermelidir.'),
    body('passwordConfirm')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Şifreler eşleşmiyor.');
            }
            return true;
        }),
    body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('İsim en az 2, en fazla 50 karakter olmalıdır.'),
    body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Soyisim en az 2, en fazla 50 karakter olmalıdır.'),
    body('phone_number')
        .optional()
        .trim()
        .isMobilePhone('any') // Herhangi bir ülkenin telefon formatı
        .withMessage('Geçerli bir telefon numarası giriniz.'),
];

// Kullanıcı giriş validasyonu
exports.userLoginValidation = [
    body('email')
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz.'),
    body('password')
        .notEmpty()
        .withMessage('Şifre boş olamaz.'),
];

// Şifremi unuttum validasyonu
exports.forgotPasswordValidation = [
    body('email')
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz.'),
];

// Şifre sıfırlama validasyonu
exports.resetPasswordValidation = [
    param('token')
        .notEmpty()
        .withMessage('Sıfırlama token\'ı zorunludur.'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Yeni şifre en az 8 karakter olmalıdır.')
        .matches(/\d/)
        .withMessage('Yeni şifre en az bir rakam içermelidir.')
        .matches(/[a-z]/)
        .withMessage('Yeni şifre en az bir küçük harf içermelidir.')
        .matches(/[A-Z]/)
        .withMessage('Yeni şifre en az bir büyük harf içermelidir.')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Yeni şifre en az bir özel karakter içermelidir.'),
    body('newPasswordConfirm')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Yeni şifreler eşleşmiyor.');
            }
            return true;
        }),
];

// E-posta doğrulama validasyonu
exports.verifyEmailValidation = [
    param('token')
        .notEmpty()
        .withMessage('Doğrulama token\'ı zorunludur.'),
];

// --- KULLANICI PROFİL GÜNCELLEME (AUTH Controller'daki) VALIDASYONLARI ---

// Kullanıcının kendi profil bilgilerini güncelleme validasyonu (opsiyonel)
exports.userProfileUpdateValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Kullanıcı adı en az 3, en fazla 50 karakter olmalıdır.'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz.'),
    body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('İsim en az 2, en fazla 50 karakter olmalıdır.'),
    body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Soyisim en az 2, en fazla 50 karakter olmalıdır.'),
    body('phone_number')
        .optional()
        .trim()
        .isMobilePhone('any')
        .withMessage('Geçerli bir telefon numarası giriniz.'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Adres en az 5, en fazla 255 karakter olmalıdır.'),
];

// Kullanıcının kendi şifresini değiştirme validasyonu
exports.userChangePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mevcut şifreniz zorunludur.'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Yeni şifre en az 8 karakter olmalıdır.')
        .matches(/\d/)
        .withMessage('Yeni şifre en az bir rakam içermelidir.')
        .matches(/[a-z]/)
        .withMessage('Yeni şifre en az bir küçük harf içermelidir.')
        .matches(/[A-Z]/)
        .withMessage('Yeni şifre en az bir büyük harf içermelidir.')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Yeni şifre en az bir özel karakter içermelidir.'),
    body('newPasswordConfirm')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Yeni şifreler eşleşmiyor.');
            }
            return true;
        }),
];

// --- KULLANICI YÖNETİMİ (USER Controller'daki) VALIDASYONLARI ---

// Admin tarafından kullanıcı güncelleme validasyonu (opsiyonel alanlar)
exports.userUpdateByAdminValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Kullanıcı adı en az 3, en fazla 50 karakter olmalıdır.'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi giriniz.'),
    body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('İsim en az 2, en fazla 50 karakter olmalıdır.'),
    body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Soyisim en az 2, en fazla 50 karakter olmalıdır.'),
    body('phone_number')
        .optional()
        .trim()
        .isMobilePhone('any')
        .withMessage('Geçerli bir telefon numarası giriniz.'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Adres en az 5, en fazla 255 karakter olmalıdır.'),
    body('role')
        .optional()
        .isIn(['user', 'admin', 'seller']) // Uygulamanızdaki rollere göre düzenleyin
        .withMessage('Geçersiz kullanıcı rolü. Geçerli roller: user, admin, seller.'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active değeri doğru veya yanlış olmalıdır.'),
];

// --- SİPARİŞ VALIDASYONLARI (Yeni Eklendi) ---

exports.orderCreateValidation = [
    body('user_id')
        .isInt({ min: 1 })
        .withMessage('Kullanıcı ID\'si geçerli bir sayı olmalıdır.'),
    body('total_amount')
        .isFloat({ min: 0 })
        .withMessage('Toplam tutar sıfırdan büyük veya eşit bir sayı olmalıdır.'),
    body('shipping_address')
        .trim()
        .notEmpty()
        .withMessage('Gönderim adresi zorunludur.')
        .isLength({ min: 10, max: 255 })
        .withMessage('Gönderim adresi 10 ile 255 karakter arasında olmalıdır.'),
    body('order_items')
        .isArray({ min: 1 })
        .withMessage('Sipariş kalemleri zorunludur ve en az bir tane olmalıdır.'),
    body('order_items.*.product_id') // İç içe objelerin validasyonu
        .isInt({ min: 1 })
        .withMessage('Sipariş kalemindeki ürün ID\'si geçerli bir sayı olmalıdır.'),
    body('order_items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Sipariş kalemindeki ürün miktarı geçerli bir sayı olmalıdır.'),
    body('order_items.*.price')
        .isFloat({ min: 0 })
        .withMessage('Sipariş kalemindeki ürün fiyatı sıfırdan büyük veya eşit bir sayı olmalıdır.'),
];

// Sipariş güncelleme validasyonu (admin veya yetkili kullanıcılar için)
exports.orderUpdateValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Geçersiz sipariş ID\'si. ID bir sayı olmalı.'),
    body('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']) // Uygulamanızdaki durumları güncelleyin
        .withMessage('Geçersiz sipariş durumu.'),
    body('total_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Toplam tutar sıfırdan büyük veya eşit bir sayı olmalıdır.'),
    body('shipping_address')
        .optional()
        .trim()
        .isLength({ min: 10, max: 255 })
        .withMessage('Gönderim adresi 10 ile 255 karakter arasında olmalıdır.'),
    // Diğer alanlar da duruma göre eklenebilir
];

// Sipariş ID'si parametre validasyonu (GET, DELETE gibi işlemler için)
exports.orderIdParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Geçersiz sipariş ID\'si. ID bir sayı olmalı ve 1\'den küçük olmamalıdır.')
];