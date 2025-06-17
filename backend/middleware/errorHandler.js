// backend/middleware/errorHandler.js

const { AppError } = require('../errors/AppError'); // <-- BURADA DA DESTRUCTURING GEREKLİ

// Global hata yakalama middleware'i
module.exports = (err, req, res, next) => {
    // console.log(err.stack); // Detaylı hata izini görmek için

    let error = { ...err }; // Hata objesini kopyala
    error.message = err.message; // Mesajı koru

    // Operasyonel hataları ayır
    if (error.isOperational) {
        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message
        });
    }

    // Programlama veya bilinmeyen hatalar (detaylarını istemciye gösterme)
    console.error('ERROR 💥', err); // Geliştirme ortamında tam hatayı logla

    return res.status(500).json({
        status: 'error',
        message: 'Beklenmedik bir hata oluştu!'
    });
};