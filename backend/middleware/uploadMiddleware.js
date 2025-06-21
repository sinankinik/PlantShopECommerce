// backend/middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const { AppError } = require('../errors/AppError');

const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // __dirname: /backend/middleware
        // Hedef klasör: /backend/public/uploads/products
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'products'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `product-<span class="math-inline">\{uniqueSuffix\}</span>{ext}`);
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
const uploadProductImageMulter = multer({
    storage: productStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimum 5MB dosya boyutu (örnek)
    }
});

// Middleware olarak kullanılabilecek upload fonksiyonları
// Tekil ürün resmi yüklemesi için
exports.uploadProductImage = uploadProductImageMulter.single('image'); // 'image' form alanının adı olacak

// Birden fazla ürün resmi yüklemesi için (örneğin galeri için)
exports.uploadProductImages = uploadProductImageMulter.array('images', 5); // 'images' form alanının adı, max 5 dosya