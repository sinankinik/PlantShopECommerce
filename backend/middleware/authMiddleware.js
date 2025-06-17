// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db = require('../config/db'); // Veritabanı bağlantısı için gerekebilir
// Hata sınıflarını obje parçalama (destructuring) ile doğru şekilde içeri aktarın
const { AppError, UnauthorizedError, ForbiddenError } = require('../errors/AppError');


// Koruma (Authentication) Middleware'i
exports.protect = async (req, res, next) => {
    // 1) Token'ın varlığını kontrol et
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) { // Çerezden token okuma
        token = req.cookies.jwt;
    }

    if (!token) {
        // Hata burada oluşuyor: `AppError` constructor olarak bulunamıyor.
        return next(new AppError('Bu işlemi yapmak için oturum açmanız gerekmektedir.', 401)); // Satır 16
    }

    try {
        // 2) Token'ı doğrula
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Token'daki kullanıcı ID'sine göre kullanıcıyı veritabanında bul
        const [rows] = await db.query('SELECT id, username, email, role, is_active FROM users WHERE id = ?', [decoded.id]);
        const currentUser = rows[0];

        if (!currentUser) {
            return next(new UnauthorizedError('Bu token\'a ait kullanıcı artık mevcut değil.'));
        }

        // 4) Kullanıcı aktif mi kontrol et (isteğe bağlı)
        if (!currentUser.is_active) {
            return next(new ForbiddenError('Hesabınız devre dışı bırakılmıştır.'));
        }

        // 5) Kullanıcıyı req objesine ekle (böylece sonraki middleware/router'lar erişebilir)
        req.user = currentUser;
        res.locals.user = currentUser; // EJS/Pug gibi template motorları için de erişilebilir yap

        next();

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError('Geçersiz token. Lütfen tekrar giriş yapın.'));
        }
        if (err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token süresi dolmuş. Lütfen tekrar giriş yapın.'));
        }
        // Diğer bilinmeyen hatalar için genel AppError
        next(new AppError('Kimlik doğrulama sırasında bir hata oluştu.', 500));
    }
};

// Rol yetkilendirme middleware'i
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user, protect middleware'i tarafından ayarlanmış olmalı
        if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
            return next(new ForbiddenError('Bu işlemi yapma yetkiniz bulunmamaktadır.'));
        }
        next();
    };
};