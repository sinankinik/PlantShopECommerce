// backend/utils/payment/PaymentError.js

const { AppError } = require('../../errors/AppError'); // Ana AppError sınıfını import ediyoruz

/**
 * Ödeme işlemlerine özel hatalar için kullanılan özel hata sınıfı.
 * Genel AppError sınıfından türetilmiştir.
 */
class PaymentError extends AppError {
    constructor(message, statusCode = 500, isOperational = true, rawError = null) {
        super(message, statusCode, isOperational);
        this.name = 'PaymentError';
        this.rawError = rawError; // Harici ödeme sağlayıcısından gelen ham hata objesi
    }
}

module.exports = PaymentError;