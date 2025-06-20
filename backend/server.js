// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // CORS middleware'i
const db = require('./config/db'); // MySQL bağlantısı
const authRoutes = require('./routes/authRoutes'); // Kimlik doğrulama rotaları

// AppError ve diğer özel hata sınıflarını buradan import edin
// errors/AppError.js dosyanızda AppError dahil tüm hata sınıfları obje olarak export edildiği için bu şekilde import etmeliyiz.
const { AppError, UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } = require('./errors/AppError');


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
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Geliştirme modunda HTTP isteklerini logla
}

// Routes
// Kimlik doğrulama rotalarını ekle
app.use('/api/auth', authRoutes);

// Diğer rotalarınız buraya eklenebilir
// app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes);


// Tanımlanmamış rotaları yakalamak için middleware
app.all('*', (req, res, next) => {
    // Burada AppError'ı doğrudan kullanabilirsiniz çünkü yukarıda import ettik
    next(new AppError(`Bu sunucuda ${req.originalUrl} adresi bulunamadı!`, 404));
});

// Global hata işleyici middleware'i
// Bu fonksiyonun ayrı bir dosyadan import edilmesi ve burada kullanılması en iyi uygulamadır.
// Örneğin: const globalErrorHandler = require('./controllers/errorController');
// app.use(globalErrorHandler);
// Şu anki durumunuz için basit bir örnek olarak burada bırakıyorum, ancak
// büyük projelerde hata işleyicinizi ayrı bir dosyaya taşımanız şiddetle önerilir.
app.use((err, req, res, next) => {
    // Eğer hata zaten bir AppError değilse, onu bir AppError objesine dönüştür.
    // Bu, tanımsız veya operasyonel olmayan hataların da AppError formatında işlenmesini sağlar.
    // Eğer hata AppError.js'teki sınıflardan biriyse (isOperational: true),
    // doğrudan o hatayı kullan, aksi takdirde yeni bir AppError oluştur.
    if (!err.isOperational) {
        // Bu bir programlama hatası (örneğin undefined bir şey okuma) veya bilinmeyen bir hata olabilir.
        // Bu tür hataları loglayıp genel bir hata mesajı döndürürüz.
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
    // Sunucuyu graceful bir şekilde kapat (açık istekleri tamamlamasına izin ver)
    server.close(() => {
        process.exit(1); // Uygulamayı kapat
    });
});

// İşlenmeyen istisnalar için hata yakalama (Senkron kodlardaki hatalar)
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Uygulama kapatılıyor...');
    console.error(err.name, err.message);
    process.exit(1); // Uygulamayı kapat
});