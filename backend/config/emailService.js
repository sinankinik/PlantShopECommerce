// backend/controllers/emailController.js
const sendEmail = require('../config/emailService'); // Doğru yolu ve import şeklini kullanıyoruz
const db = require('../config/db');
const { AppError, BadRequestError, NotFoundError } = require('../errors/AppError'); // NotFoundError'ı da ekledik

// Admin tarafından toplu e-posta gönderme
exports.sendBulkEmail = async (req, res, next) => {
    const { subject, message, recipientType, userIds } = req.body; // recipientType: 'all_users', 'newsletter_subscribers', 'selected_users'

    if (!subject || !message || !recipientType) {
        return next(new BadRequestError('Konu, mesaj ve alıcı tipi gereklidir.'));
    }

    let recipientEmails = [];

    try {
        if (recipientType === 'all_users') {
            const [users] = await db.query('SELECT email FROM users WHERE email IS NOT NULL');
            recipientEmails = users.map(user => user.email);
        } else if (recipientType === 'newsletter_subscribers') {
            // Haber bülteni abonelik tablonuz varsa buradan çekin
            // Örneğin: const [subscribers] = await db.query('SELECT email FROM newsletter_subscribers WHERE is_active = TRUE');
            // recipientEmails = subscribers.map(sub => sub.email);
            return next(new BadRequestError('Haber bülteni abonelik özelliği henüz uygulanmadı.')); // 400 yerine BadRequestError
        } else if (recipientType === 'selected_users' && Array.isArray(userIds) && userIds.length > 0) {
            const placeholders = userIds.map(() => '?').join(',');
            const [selectedUsers] = await db.query(`SELECT email FROM users WHERE id IN (${placeholders}) AND email IS NOT NULL`, userIds);
            recipientEmails = selectedUsers.map(user => user.email);
        } else {
            return next(new BadRequestError('Geçersiz alıcı tipi veya seçilen kullanıcılar belirtilmedi.'));
        }

        if (recipientEmails.length === 0) {
            return next(new NotFoundError('Hiçbir alıcı bulunamadı. E-posta gönderilemedi.')); // 404 yerine NotFoundError
        }

        // Tüm alıcılara tek bir e-posta gönder (Nodemailer'ın 'to' alanı virgülle ayrılmış birden fazla adres alabilir)
        await sendEmail({
            email: recipientEmails.join(','), // Sizin emailService'iniz 'email' anahtarını bekliyor
            subject: subject,
            html: `<p>${message}</p><br><p>Saygılarımızla,</p><p>E-Ticaret Ekibi</p>`,
            text: message, // Opsiyonel
        });

        res.status(200).json({
            status: 'success',
            message: `${recipientEmails.length} alıcıya e-posta başarıyla gönderildi.`
        });

    } catch (err) {
        console.error('Toplu e-posta gönderilirken hata oluştu:', err);
        // sendEmail'den gelen hatayı yakalayıp AppError olarak ilet
        return next(new AppError(`Toplu e-posta gönderilirken bir hata oluştu: ${err.message}`, 500));
    }
};
