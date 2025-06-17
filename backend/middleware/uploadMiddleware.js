// backend/middleware/uploadMiddleware.js

const multer = require('multer');
const AppError = require('../errors/AppError'); // Custom AppError'ınızı import edin
const path = require('path');

// Disk depolama yapılandırması
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Yüklenen dosyaların kaydedileceği klasör
        // Bu klasörün mevcut olduğundan emin olun (manuel olarak oluşturulmalı)
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        // Dosya adı: product-<ürünId>-<timestamp>.<uzantı>
        // timestamp: Dosya çakışmalarını önlemek için
        // ext: Dosyanın orijinal uzantısı
        const ext = path.extname(file.originalname); // Orijinal uzantıyı alır (.jpg, .png vb.)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `product-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

// Dosya filtresi (sadece belirli türdeki dosyaların yüklenmesine izin ver)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true); // Dosya bir resim ise kabul et
    } else {
        // Dosya bir resim değilse, hata döndür
        cb(new AppError('Sadece resim dosyaları yüklenebilir!', 400), false);
    }
};

// Multer yapılandırması
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB dosya boyutu sınırı
    }
});

// Tekil resim yüklemek için middleware
exports.uploadProductImage = upload.single('image'); // 'image' frontend'den gönderilen input'un name attribute'u olmalı

// Birden fazla resim yüklemek için (ürün galerisi gibi) middleware
exports.uploadProductImages = upload.array('images', 5); // 'images' input'un name'i, max 5 resim