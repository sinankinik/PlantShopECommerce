// utils/appError.js (veya config/appError.js)

class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Error sınıfının constructor'ını çağır
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 4xx hataları 'fail', 5xx hataları 'error'
        this.isOperational = true; // Programlama hatalarından (bug) ayırt etmek için

        // Bu, hata yakalama sırasında stack trace'in doğru şekilde alınmasını sağlar
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Kaynak bulunamadı.') {
        super(message, 404);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Geçersiz istek. Lütfen verilerinizi kontrol edin.') {
        super(message, 400);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Bu işleme yetkiniz yok.') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Bu kaynağa erişim izniniz yok.') {
        super(message, 403);
    }
}

module.exports = {
    AppError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError
};