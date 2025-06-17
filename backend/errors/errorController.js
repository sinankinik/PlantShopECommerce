// backend/errors/errorController.js

const AppError = require('./AppError'); // AppError sınıfını import ediyoruz

// Geliştirme ortamında hata cevabı
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

// Üretim ortamında hata cevabı
const sendErrorProd = (err, res) => {
    // Sadece AppError'dan türeyen (bilinen) hataları göster
    if (err instanceof AppError || err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Loglama (geliştiriciye)
        console.error('❌ BİLİNMEYEN HATA:', err);

        // Kullanıcıya jenerik mesaj gönder
        res.status(500).json({
            status: 'error',
            message: 'Bir şeyler ters gitti!'
        });
    }
};

// Ana hata işleyici middleware
module.exports = (err, req, res, next) => {
    // Default değerler
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Ortama göre hata cevabı
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Hata objesini klonla ama tüm property'leri al (özellikle message)
        const error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.statusCode = err.statusCode;
        error.status = err.status;

        sendErrorProd(error, res);
    }
};
