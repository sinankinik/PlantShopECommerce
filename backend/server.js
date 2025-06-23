// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // CORS middleware'i
const path = require('path'); // Node.js'in 'path' modülünü import edin (dosya yolları için)

const db = require('./config/db'); // MySQL bağlantısı
const authRoutes = require('./routes/authRoutes'); // Kimlik doğrulama rotaları
const productRoutes = require('./routes/productRoutes'); // Ürün rotalarını import edin
const orderRoutes = require('./routes/orderRoutes'); // Sipariş rotalarını import edin


// AppError ve diğer özel hata sınıflarını buradan import edin
const { AppError, UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } = require('./errors/AppError');
const cronJobs = require('./utils/cronJobs'); // <-- YENİ EKLEME: Cron job'ları import et
// Ödeme rotalarını da import etmeniz gerekecek, eğer daha önce eklemediyseniz:
const paymentRoutes = require('./routes/paymentRoutes'); // <-- YENİ EKLEME (Ödeme entegrasyonu için)


// Ortam değişkenlerini yükle (process.env erişimi için)
dotenv.config({ path: './config/config.env' });

// Express uygulamasını başlat
const app = express();

// MySQL veritabanına bağlan
db.getConnection()
    .then(() => console.log('MySQL veritabanına başarıyla bağlanıldı!'))
    .catch(err => {
        console.error('MySQL veritabanına bağlanırken hata oluştu:', err);
        process.exit(1); // Hata durumunda uygulamayı kapat
    });

// Middleware'ler
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL'inizi buraya girin veya env'den alın
    credentials: true, // Çerezlerin gönderilmesine izin ver
}));
app.use(express.json()); // JSON body parser
app.use(cookieParser()); // Cookie parser

// Public klasörünü statik dosyalar için sun
// 'backend' klasöründen direkt 'public' klasörüne gitmeliyiz.
// __dirname: C:\Users\Samsung\Desktop\DesignToCode\PlantShopECommerce\backend
// Hedef: C:\Users\Samsung\Desktop\DesignToCode\PlantShopECommerce\backend\public
app.use(express.static(path.join(__dirname, 'public'))); // <-- Bu satırın tam olarak bu şekilde olduğundan emin olun

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Geliştirme modunda HTTP isteklerini logla
}

// Routes
// Kimlik doğrulama rotalarını ekle
app.use('/api/auth', authRoutes);

// Ürün rotalarını ekle
app.use('/api/products', productRoutes);

// Sipariş rotalarını ekle
app.use('/api/orders', orderRoutes);

// Ödeme rotalarını ekle (eğer daha önce eklemediyseniz, şimdi ekleyin)
app.use('/api/payments', paymentRoutes); // <-- YENİ EKLEME (Ödeme entegrasyonu için)


// Diğer rotalarınız buraya eklenebilir
// app.use('/api/users', userRoutes);


// Cron job'ları başlat (API rotaları tanımlandıktan sonra, hata işleyiciden önce)
cronJobs.startCronJobs(); // <-- YENİ EKLEME: Cron job'ları başlat

// Tanımlanmamış rotaları yakalamak için middleware
app.all('*', (req, res, next) => {
    next(new AppError(`Bu sunucuda ${req.originalUrl} adresi bulunamadı!`, 404));
});

// Global hata işleyici middleware'i
app.use((err, req, res, next) => {
    if (!err.isOperational) {
        console.error('ERROR 💥', err); // Hatanın tam yığın izini logla
        err.statusCode = 500;
        err.status = 'error';
        err.message = 'Bir şeyler ters gitti!';
    }

    // Response gönder
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // Geliştirme modunda stack trace'i göster
        ...(process.env.NODE_ENV === 'development' && { error: err, stack: err.stack }),
    });
});


// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server ${process.env.NODE_ENV} modunda ${PORT} portunda çalışıyor...`);
});

// İşlenmeyen Promise reddetmeleri için hata yakalama
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Uygulama kapatılıyor...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// İşlenmeyen istisnalar için hata yakalama (Senkron kodlardaki hatalar)
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Uygulama kapatılıyor...');
    console.error(err.name, err.message);
    process.exit(1);
});
