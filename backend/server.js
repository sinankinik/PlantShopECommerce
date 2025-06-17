// backend/server.js

const express = require('express');
const app = express();
const dotenv = require('dotenv');
const morgan = require('morgan'); // API isteklerini loglamak için
const path = require('path'); // Statik dosyalar için path modülü
const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./errors/AppError'); // Custom AppError'ı import edin

// Rota importları
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); // Eğer review rotaları eklendiyse
const cartRoutes = require('./routes/cartRoutes');     // Eğer sepet rotaları eklendiyse
const couponRoutes = require('./routes/couponRoutes'); // Eğer kupon rotaları eklendiyse

// Ortam değişkenlerini yükle
dotenv.config({ path: './config/config.env' });

// Geliştirme ortamında HTTP isteklerini logla
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parser - Gelen JSON verilerini işle
app.use(express.json());
// URL-encoded verileri işlemek için (form verileri, Multer ile iyi çalışır)
app.use(express.urlencoded({ extended: true }));

// Statik dosyaları (yüklenen resimler gibi) sunmak için middleware
// 'uploads' klasöründeki dosyalara '/uploads' URL'si üzerinden erişilebilir
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotaları tanımla
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes); // Eğer eklediyseniz uncomment edin
app.use('/api/cart', cartRoutes);     // Eğer eklediyseniz uncomment edin
app.use('/api/coupons', couponRoutes); // Eğer eklediyseniz uncomment edin


// Tanımlanmamış rotaları yakala ve 404 hatası döndür
app.all('*', (req, res, next) => {
    next(new AppError(`Bu sunucuda ${req.originalUrl} adresi bulunamadı!`, 404));
});

// Global hata yakalama middleware'i
app.use(globalErrorHandler);

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server ${process.env.NODE_ENV} modunda ${PORT} portunda çalışıyor...`);
});

