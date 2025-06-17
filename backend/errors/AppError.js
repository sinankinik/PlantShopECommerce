// backend/errors/AppError.js

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Bu hatanın öngörülebilir olduğunu belirtir

        // Stack izini temizlemek için (opsiyonel ama iyi bir pratik)
        Error.captureStackTrace(this, this.constructor);
    }
}

// Birden fazla hata sınıfını dışa aktarıyoruz
module.exports = {
    AppError, // Ana AppError sınıfı
    NotFoundError: class NotFoundError extends AppError {
        constructor(message = 'Bu kaynak bulunamadı.', statusCode = 404) {
            super(message, statusCode);
            this.name = 'NotFoundError';
        }
    },
    BadRequestError: class BadRequestError extends AppError {
        constructor(message = 'Geçersiz istek.', statusCode = 400) {
            super(message, statusCode);
            this.name = 'BadRequestError';
        }
    },
    ForbiddenError: class ForbiddenError extends AppError {
        constructor(message = 'Bu eylemi gerçekleştirmek için yetkiniz yok.', statusCode = 403) {
            super(message, statusCode);
            this.name = 'ForbiddenError';
        }
    },
    UnauthorizedError: class UnauthorizedError extends AppError {
        constructor(message = 'Bu kaynağa erişmek için kimlik doğrulaması gerekiyor.', statusCode = 401) {
            super(message, statusCode);
            this.name = 'UnauthorizedError';
        }
    }
};