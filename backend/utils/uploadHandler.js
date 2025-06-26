// utils/uploadHandler.js

const multer = require('multer');
const path = require('path');
const sharp = require('sharp'); // Sharp kütüphanesini import et
const fs = require('fs'); // Dosya sistemi işlemleri için
const { AppError } = require('../errors/AppError'); // Hata sınıfınızı doğru yoldan import edin

// Geçici Depolama Ayarları (Sharp ile işlem yapmadan önce dosyayı RAM'de veya geçici bir yerde tutmak için)
const multerStorage = multer.memoryStorage();

// Dosya Filtresi (Sadece Belirli Dosya Tiplerine İzin Ver)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Sadece resim dosyaları yüklenebilir!', 400), false);
    }
};

// Multer Yükleyiciyi Oluşturma
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimum 5MB dosya boyutu
    }
});

exports.uploadSingleProductImage = upload.single('image');
exports.uploadProductImages = upload.array('images', 5);

/**
 * Yüklenen tekil ürün resmini işler (boyutlandırma ve kaydetme).
 */
exports.resizeAndSaveProductImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }


    // Dosya adını oluştur (benzersiz ve .jpeg uzantısıyla)
    const baseFilename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    req.file.filename = `${baseFilename}.jpeg`; // JPEG olarak kaydedeceğiz

    // Yükleme dizinini backend/public/uploads/products olarak düzeltiyoruz
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products'); // <-- BURASI DÜZELTİLDİ
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    try {
        await sharp(req.file.buffer)
            .resize(1200, 800, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .toFormat('jpeg') // Burası JPEG formatına dönüştürmeli
            .jpeg({ quality: 90 }) // JPEG kalitesi ayarı
            .toFile(path.join(uploadDir, req.file.filename));

        // Resmin kaydedildiği yolu req.file.path olarak güncelle (controller'da kullanılacak)
        req.file.path = `/uploads/products/${req.file.filename}`; 
        
        next();
    } catch (error) {
        console.error('[Sharp Middleware] Resim işlenirken veya kaydedilirken hata oluştu:', error);
        return next(new AppError('Resim işlenirken bir hata oluştu.', 500));
    }
};

/**
 * Yüklenen birden fazla ürün resmini işler (boyutlandırma ve kaydetme).
 */
exports.resizeAndSaveProductImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    req.body.images = []; // Kaydedilen resim yollarını tutmak için bir dizi oluştur

    // Yükleme dizinini backend/public/uploads/products olarak düzeltiyoruz
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products'); // <-- BURASI DÜZELTİLDİ

    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    await Promise.all(req.files.map(async (file) => {
        const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpeg`; // Her resim için benzersiz ad
        
        try {
            await sharp(file.buffer)
                .resize(1200, 800, {
                    fit: sharp.fit.inside,
                    withoutEnlargement: true
                })
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(path.join(uploadDir, filename));

            req.body.images.push(`/uploads/products/${filename}`);
        } catch (error) {
            console.error(`[Sharp Middleware] Resim işlenirken hata oluştu (${file.originalname}):`, error);
        }
    }));

    next();
};