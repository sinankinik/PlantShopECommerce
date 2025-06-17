// backend/controllers/authController.js

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db = require('../config/db'); // Veritabanı bağlantısı
const bcrypt = require('bcryptjs'); // Şifre karşılaştırma ve hashleme için
const crypto = require('crypto'); // Token oluşturma için
const { AppError, BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } = require('../errors/AppError');

// E-posta gönderme yardımcı fonksiyonunu import edin
// Yol, sizin dosya yapınıza göre doğru olmalı. Eğer 'emailService.js' 'backend/config' altında ise bu doğru yoldur.
const sendEmail = require('../config/emailService');

// JWT Token oluşturma ve çerez olarak gönderme yardımcı fonksiyonu
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    // JWT'yi HTTP-only çerez olarak gönder
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // Gün cinsinden
        httpOnly: true, // Client-side JavaScript'ten erişilemez
        secure: process.env.NODE_ENV === 'production', // Sadece HTTPS üzerinde gönder
        sameSite: 'Lax', // CSRF koruması
    });

    // Hassas bilgileri yanıt objesinden kaldır
    user.password = undefined; // Şifreyi gönderme

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

// MySQL'in DATETIME formatına uygun tarih stringi oluşturan yardımcı fonksiyon
const formatMysqlDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


// Yeni kullanıcı kaydı
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, passwordConfirm, first_name, last_name, phone_number, address, role } = req.body;

        // Şifreleri hashle
        const hashedPassword = await bcrypt.hash(password, 12);

        // Kullanıcıyı veritabanına ekle
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, first_name, last_name, phone_number, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, first_name || null, last_name || null, phone_number || null, address || null, role || 'user']
        );

        // Yeni kullanıcının ID'sini al
        const newUserId = result.insertId;

        // JWT oluştur ve yanıt olarak gönder
        const [rows] = await db.query('SELECT id, username, email, first_name, last_name, phone_number, address, role, created_at, updated_at, is_active, email_verified FROM users WHERE id = ?', [newUserId]);
        const newUser = rows[0];

        createSendToken(newUser, 201, res);

        // Opsiyonel: E-posta doğrulama token'ı gönderme (eğer entegre edilecekse)
        // const verificationToken = crypto.randomBytes(32).toString('hex');
        // const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        // const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat geçerli
        // await db.query('UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?', [hashedVerificationToken, formatMysqlDateTime(verificationExpires), newUserId]);
        // const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verifyEmail/${verificationToken}`;
        // try {
        //     await sendEmail({
        //         email: newUser.email,
        //         subject: 'E-posta Adresinizi Doğrulayın',
        //         text: `E-posta adresinizi doğrulamak için şu adrese tıklayın: ${verificationURL}`
        //     });
        // } catch (emailError) {
        //     console.error('E-posta doğrulama maili gönderilemedi:', emailError);
        // }

    } catch (error) {
        // MySQL duplicate entry error (örneğin aynı email veya username)
        if (error.code === 'ER_DUP_ENTRY') {
            const errorMessage = error.sqlMessage.includes('email') ? 'Bu e-posta adresi zaten kullanılıyor.' : 'Bu kullanıcı adı zaten kullanılıyor.';
            return next(new BadRequestError(errorMessage));
        }
        next(error); // Diğer hatalar için global hata işleyiciye gönder
    }
};

// Kullanıcı girişi
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    // 1) E-posta ve şifrenin var olup olmadığını kontrol et
    if (!email || !password) {
        return next(new BadRequestError('Lütfen e-posta ve şifrenizi girin!'));
    }

    // 2) Kullanıcıyı veritabanında ara ve şifreyi seç (şifre normalde seçilmez)
    const [rows] = await db.query('SELECT id, username, email, password, role, is_active, email_verified FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // 3) Kullanıcı var mı ve şifre doğru mu kontrol et
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new UnauthorizedError('Yanlış e-posta veya şifre.'));
    }

    // 4) Hesap aktif mi kontrol et
    if (!user.is_active) {
        return next(new ForbiddenError('Hesabınız devre dışı bırakılmıştır. Lütfen yöneticiyle iletişime geçin.'));
    }

    // 5) E-posta doğrulanmış mı kontrol et (isteğe bağlı)
    // if (!user.email_verified) {
    //     return next(new UnauthorizedError('Lütfen e-posta adresinizi doğrulayın.'));
    // }

    // Başarılı giriş: JWT oluştur ve gönder
    createSendToken(user, 200, res);
};

// Şifremi unuttum
exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    // 1) Kullanıcının e-postasını bul
    const [rows] = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
        // Güvenlik nedeniyle, kullanıcının var olup olmadığını ifşa etmeyin
        return next(new NotFoundError('Bu e-posta adresine sahip bir kullanıcı bulunamadı.'));
    }

    // 2) Sıfırlama token'ı oluştur (random string)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token'ı hashle ve veritabanına kaydetmek için hazırla
    // Veritabanına kaydederken token'ın kendisi yerine hash'ini kullanmak güvenlik içindir.
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token'ın geçerlilik süresi (örneğin 10 dakika sonra)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika sonrası
    const passwordResetExpires = formatMysqlDateTime(expiryDate); // MySQL DATETIME formatına çevir

    try {
        // 3) Token'ı ve geçerlilik süresini veritabanına kaydet
        // DİKKAT: Sütun adları MySQL tablonuzdakiyle tam eşleşmeli!
        const [updateResult] = await db.query(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [hashedResetToken, passwordResetExpires, user.id]
        );

        // 4) Kullanıcıya şifre sıfırlama e-postası gönder
        const resetURL = `${req.protocol}://${req.get('host')}/api/auth/resetPassword/${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Şifre sıfırlama talebiniz (Sadece 10 dakika geçerlidir)',
                text: `Şifrenizi sıfırlamak için şu adrese gidin: ${resetURL}\n\nBu bağlantı 10 dakika içinde sona erecektir.`,
                // html: `<p>Şifrenizi sıfırlamak için <a href="${resetURL}">buraya tıklayın</a>. Bu bağlantı 10 dakika içinde sona erecektir.</p>`
            });
            res.status(200).json({ status: 'success', message: 'Şifre sıfırlama bağlantısı e-postanıza gönderildi!' });
        } catch (emailError) {
            console.error('E-posta gönderilemedi:', emailError);
            // E-posta gönderilirken hata olursa, token'ı veritabanından temizle
            await db.query('UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?', [user.id]);
            return next(new AppError('E-posta gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 500));
        }

    } catch (error) {
        console.error('Şifremi unuttum hatası:', error);
        next(new AppError('Şifre sıfırlama işlemi sırasında bir hata oluştu.', 500));
    }
};

// Şifre sıfırlama
exports.resetPassword = async (req, res, next) => {
    // 1) URL'den gelen token'ı hashle
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // 2) Hashlenmiş token'ı ve geçerlilik süresini kontrol et
    const [rows] = await db.query(
        'SELECT id, username FROM users WHERE reset_password_token = ? AND reset_password_expires > ?',
        [hashedToken, formatMysqlDateTime(new Date())] // Geçerli tarih formatı ile karşılaştır
    );
    const user = rows[0];

    if (!user) {
        return next(new BadRequestError('Token geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.'));
    }

    // 3) Yeni şifreyi güncelle
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
    await db.query(
        'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
        [hashedPassword, user.id]
    );

    // 4) Kullanıcıya otomatik giriş yap
    createSendToken(user, 200, res);
};


// E-posta Doğrulama
exports.verifyEmail = async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const [rows] = await db.query(
        'SELECT id, username FROM users WHERE email_verification_token = ? AND email_verification_expires > ?',
        [hashedToken, formatMysqlDateTime(new Date())]
    );
    const user = rows[0];

    if (!user) {
        return next(new BadRequestError('Doğrulama token\'ı geçersiz veya süresi dolmuş. Lütfen tekrar kayıt olun.'));
    }

    await db.query(
        'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?',
        [user.id]
    );

    res.status(200).json({
        status: 'success',
        message: 'E-posta adresiniz başarıyla doğrulandı!',
    });
};


// Oturum kapatma
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000), // Anında sona erdir
        httpOnly: true,
    });
    res.status(200).json({ status: 'success', message: 'Başarıyla çıkış yapıldı.' });
};


// Oturum açmış kullanıcının kendi profilini getirme
exports.getMe = async (req, res, next) => {
    // req.user, protect middleware'i tarafından ayarlanır
    if (!req.user || !req.user.id) {
        return next(new UnauthorizedError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.'));
    }
    // Veritabanından kullanıcıyı tekrar çekmek yerine req.user'ı kullanabiliriz
    // Ama tam profil bilgisi için bazen tekrar çekmek istenebilir
    const [rows] = await db.query('SELECT id, username, email, first_name, last_name, phone_number, address, role, created_at, updated_at, is_active, email_verified FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    if (!user) {
        return next(new NotFoundError('Kullanıcı bulunamadı.'));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
};

// Oturum açmış kullanıcının kendi profilini güncelleme
exports.updateMyProfile = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new UnauthorizedError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.'));
    }

    // Sadece belirli alanların güncellenmesine izin ver (güvenlik)
    const { username, email, first_name, last_name, phone_number, address } = req.body;
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (first_name) updateFields.first_name = first_name;
    if (last_name) updateFields.last_name = last_name;
    if (phone_number) updateFields.phone_number = phone_number;
    if (address) updateFields.address = address;

    if (Object.keys(updateFields).length === 0) {
        return next(new BadRequestError('Güncellenecek hiçbir alan sağlanmadı.'));
    }

    const setClauses = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateFields);

    try {
        await db.query(
            `UPDATE users SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, req.user.id]
        );

        const [rows] = await db.query('SELECT id, username, email, first_name, last_name, phone_number, address, role, created_at, updated_at, is_active, email_verified FROM users WHERE id = ?', [req.user.id]);
        const updatedUser = rows[0];

        res.status(200).json({
            status: 'success',
            message: 'Profiliniz başarıyla güncellendi.',
            data: {
                user: updatedUser,
            },
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const errorMessage = error.sqlMessage.includes('email') ? 'Bu e-posta adresi zaten kullanılıyor.' : 'Bu kullanıcı adı zaten kullanılıyor.';
            return next(new BadRequestError(errorMessage));
        }
        next(error);
    }
};

// Oturum açmış kullanıcının şifresini değiştirme
exports.updateMyPassword = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new UnauthorizedError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.'));
    }

    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    // 1) Mevcut şifreyi veritabanından al ve doğrula
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return next(new UnauthorizedError('Mevcut şifreniz yanlış.'));
    }

    // 2) Yeni şifreyi hashle ve veritabanına kaydet
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    // 3) JWT'yi yeniden oluştur ve gönder (şifre değiştiği için eski token'ı geçersiz kıl)
    // Bu, kullanıcının tekrar giriş yapmasını gerektirmeden oturumunu güvence altına alır.
    createSendToken(req.user, 200, res); // req.user zaten güncel ID ve role sahip olmalı

    res.status(200).json({
        status: 'success',
        message: 'Şifreniz başarıyla güncellendi.',
    });
};


// Oturum açmış kullanıcının kendi hesabını silme (pasif hale getirme)
exports.deleteMyAccount = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new UnauthorizedError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.'));
    }

    // Hesabı doğrudan silmek yerine 'is_active' durumunu 'false' yapma
    await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [req.user.id]);

    res.status(204).json({
        // 204 No Content: İşlem başarılı, ancak yanıt gövdesinde içerik yok
        status: 'success',
        data: null,
    });
};