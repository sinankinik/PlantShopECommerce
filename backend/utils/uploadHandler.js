// utils/uploadHandler.js

const multer = require('multer');
const path = require('path');
const { AppError } = require('../errors/AppError'); // Hata sınıfınızı doğru yoldan import edin

// 1. Depolama Ayarları (Disk Storage)
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Yüklenen dosyaların nereye kaydedileceğini belirtin
        // __dirname, mevcut dosyanın dizinini verir (src/utils).
        // path.join ile projenin kök dizinine göre hedef yolu oluşturuyoruz.
        cb(null, path.join(__dirname, '..', '..', 'public', 'uploads', 'products'));
    },
    filename: (req, file, cb) => {
        // Dosya adı nasıl olmalı? Çakışmaları önlemek için benzersiz bir isim verelim.
        // Örneğin: product-UUID-timestamp.ext
        const ext = path.extname(file.originalname); // Dosya uzantısı (.jpg, .png vb.)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

// 2. Dosya Filtresi (Sadece Belirli Dosya Tiplerine İzin Ver)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true); // Dosya bir resimse kabul et
    } else {
        // Bir resim değilse hata döndür
        cb(new AppError('Sadece resim dosyaları yüklenebilir!', 400), false);
    }
};

// 3. Multer Yükleyiciyi Oluşturma
const uploadProductImage = multer({
    storage: productStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimum 5MB dosya boyutu
    }
});

// Middleware olarak kullanılabilecek upload fonksiyonları
exports.uploadSingleProductImage = uploadProductImage.single('image'); // 'image' form alanının adı olacak
exports.uploadProductImages = uploadProductImage.array('images', 5); // 'images' form alanının adı, max 5 dosya

// Not: Eğer AppError sınıfınız farklı bir dizindeyse, yukarıdaki import yolunu ayarlamanız gerekebilir.
// Örneğin, eğer AppError '../errors/AppError' içinde değilse, kendi yolunuzu buraya yazın.