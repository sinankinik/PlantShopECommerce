// middleware/rateLimitMiddleware.js

const rateLimit = require('express-rate-limit');

// Genel API istekleri için Rate Limiter
// Her IP adresinden 15 dakika içinde en fazla 100 istek.
// Bu ayar, uygulamanızdaki çoğu endpoint için uygundur.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // Aynı IP adresinden 15 dakika içinde maksimum 100 istek
    message: 'Çok fazla istek gönderdiniz, lütfen bir süre sonra tekrar deneyin.',
    headers: true, // X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset başlıklarını gönder
    standardHeaders: true, // RFC-7231 ve RFC-6584 uyumlu başlıklar ekler
    legacyHeaders: false, // X-RateLimit-* başlıklarını devre dışı bırakır
});

// Kayıt ve Giriş için daha katı Rate Limiter (Brute-force koruması)
// Her IP adresinden 5 dakika içinde en fazla 10 istek.
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 dakika
    max: 10, // Aynı IP adresinden 5 dakika içinde maksimum 10 istek
    message: 'Bu IP adresinden çok fazla kayıt/giriş denemesi yapıldı, lütfen 5 dakika sonra tekrar deneyin.',
    headers: true,
    standardHeaders: true,
    legacyHeaders: false,
});

// Parola Sıfırlama Talebi için daha da katı Rate Limiter
// Her IP adresinden 15 dakika içinde en fazla 5 istek.
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // Aynı IP adresinden 15 dakika içinde maksimum 5 istek
    message: 'Çok fazla şifre sıfırlama talebi gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.',
    headers: true,
    standardHeaders: true,
    legacyHeaders: false,
});


module.exports = {
    apiLimiter,
    authLimiter,
    passwordResetLimiter
};