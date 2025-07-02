// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path'); // Node.js'in 'path' modülünü import edin (dosya yolları için)

const db = require('./config/db'); // MySQL bağlantısı
const redisClient = require('./config/redis'); // Redis istemcisini import et

// --- Rota Dosyalarını Import Edin ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const webhookController = require('./controllers/webhookController'); // Webhook controller'ı import edin

// Eksik olan rota dosyalarını buraya ekliyoruz:
const cartRoutes = require('./routes/cartRoutes'); // Sepet rotaları
const categoryRoutes = require('./routes/categoryRoutes'); // Kategori rotaları
const couponRoutes = require('./routes/couponRoutes'); // Kupon rotaları
const notificationRoutes = require('./routes/notificationRoutes'); // Bildirim rotaları
const promotionRoutes = require('./routes/promotionRoutes'); // Promosyon rotaları
const reviewRoutes = require('./routes/reviewRoutes'); // Yorum rotaları
const userRoutes = require('./routes/userRoutes'); // Kullanıcı rotaları (Admin için)


// AppError ve diğer özel hata sınıflarını buradan import edin
const { AppError, UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } = require('./errors/AppError');
const cronJobs = require('./utils/cronJobs'); // Cron job'ları import et

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

// Redis bağlantısını başlat (Zaten import edildiğinde bağlanır, ancak bağlantı loglarını görmek için ping çağırılabilir.)
// redisClient.ping((err, result) => {
//     if (err) {
//         console.error('Redis bağlantı kontrolü başarısız:', err);
//     } else {
//         console.log('Redis bağlantısı aktif:', result);
//     }
// });


// Middleware'ler
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL'inizi buraya girin veya env'den alın
    credentials: true, // Çerezlerin gönderilmesine izin ver
}));

// *** ÖNEMLİ: Stripe Webhook Rotası için özel body parser, diğer body parser'lardan önce gelmeli ***
// Bu middleware SADECE webhook rotası için uygulanmalı, aksi takdirde diğer POST/PUT isteklerinde sorun yaşanabilir.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Diğer tüm rotalar için standart JSON body parser
app.use(express.json()); // JSON body parser
app.use(cookieParser()); // Cookie parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser


// Public klasörünü statik dosyalar için sun
// NOT: Resimleriniz /backend/public/uploads/products içine kaydedildiğinden,
// bu tek bir satır, tüm public klasörü içindeki her şeyi (dolayısıyla uploads klasörünü de) sunar.
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Geliştirme modunda HTTP isteklerini logla
}

// --- Rotalar ---
// Kimlik doğrulama rotalarını ekle
app.use('/api/auth', authRoutes);

// Kullanıcı rotalarını ekle (Admin için)
app.use('/api/users', userRoutes);

// Ürün rotalarını ekle
app.use('/api/products', productRoutes);

// Kategori rotalarını ekle
app.use('/api/categories', categoryRoutes);

// Sipariş rotalarını ekle
app.use('/api/orders', orderRoutes);

// Sepet rotalarını ekle
app.use('/api/cart', cartRoutes);

// Yorum rotalarını ekle
app.use('/api/reviews', reviewRoutes); // <-- BU SATIRIN OLDUĞUNDAN EMİN OLUN!

// Kupon rotalarını ekle
app.use('/api/coupons', couponRoutes);

// Promosyon rotalarını ekle
app.use('/api/promotions', promotionRoutes);

// Bildirim rotalarını ekle
app.use('/api/notifications', notificationRoutes);

// Ödeme rotalarını ekle
app.use('/api/payments', paymentRoutes);

// Rapor rotalarını ekle
app.use('/api/reports', reportRoutes);

// Cron job'ları başlat (API rotaları tanımlandıktan sonra, hata işleyiciden önce)
cronJobs.startCronJobs();

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
