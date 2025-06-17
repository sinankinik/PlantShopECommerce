// backend/controllers/notificationController.js

const db = require('../config/db');
const AppError = require('../errors/AppError');
const sendEmail = require('../config/emailService');

exports.sendMarketingEmail = async (req, res, next) => {
    const { subject, messageHtml, messageText, targetUsers } = req.body;


    if (!subject || !messageHtml || !messageText) {
        return next(new AppError('E-posta başlığı, HTML içeriği ve düz metin içeriği zorunludur.', 400));
    }

    let usersToNotify = [];
    try {
        if (targetUsers === 'all') {
            const [allUsers] = await db.query('SELECT email, username FROM users WHERE email_verified = TRUE');
            usersToNotify = allUsers;
        } else if (Array.isArray(targetUsers) && targetUsers.length > 0) {
            const placeholders = targetUsers.map(() => '?').join(',');
            const [selectedUsers] = await db.query(`SELECT email, username FROM users WHERE id IN (${placeholders}) AND email_verified = TRUE`, targetUsers);
            usersToNotify = selectedUsers;
        } else {
            return next(new AppError('Geçersiz hedef kullanıcı seçimi. "all" veya kullanıcı ID\'lerinin dizisi olmalı.', 400));
        }

        if (usersToNotify.length === 0) {
            return next(new AppError('Bildirim gönderilecek uygun kullanıcı bulunamadı.', 404));
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const user of usersToNotify) {
            try {
                const personalizedHtml = messageHtml.replace('{username}', user.username || 'değerli müşterimiz');
                const personalizedText = messageText.replace('{username}', user.username || 'değerli müşterimiz');

                await sendEmail({
                    email: user.email,
                    subject: subject,
                    html: personalizedHtml,
                    text: personalizedText
                });
                sentCount++;
            } catch (emailErr) {
                console.error(`Kullanıcı ${user.email} adresine e-posta gönderimi başarısız oldu:`, emailErr);
                failedCount++;
            }
        }

        res.status(200).json({
            status: 'success',
            message: `${sentCount} adet e-posta başarıyla gönderildi. ${failedCount} adet e-posta gönderimi başarısız oldu.`,
            data: { sentCount, failedCount }
        });

    } catch (err) {
        // BURADA HATA YAKALANIYOR! 'err' değişkenini loglamalıyız.
        console.error('Pazarlama e-postası gönderilirken genel bir hata oluştu:', err);
        return next(new AppError('Pazarlama e-postası gönderilirken bir hata oluştu.', 500));
    }
};