// backend/config/emailService.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // secure değeri string 'true' olarak geliyorsa boolean true'ya çevir
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Gmail kullanıyorsanız ve uygulama şifresiyle sorun yaşıyorsanız,
    // aşağıdaki gibi 'service' kullanmayı deneyebilirsiniz:
    // service: 'gmail',
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASS, // Bu bir uygulama şifresi olmalı!
    // },
});

// Fonksiyon tanımını objeyi kabul edecek şekilde değiştirin
const sendEmail = async (options) => { // 'options' objesini parametre olarak alıyoruz
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: options.email, // options objesindeki 'email' alanını kullan
            subject: options.subject, // options objesindeki 'subject' alanını kullan
            html: options.html, // options objesindeki 'html' alanını kullan
            text: options.text // options objesindeki 'text' alanını kullan (varsa)
        };

        await transporter.sendMail(mailOptions);
        console.log(`E-posta '${options.subject}' konusuyala '${options.email}' adresine başarıyla gönderildi.`); // Başarılı log
    } catch (error) {
        console.error('E-posta gönderme başarısız oldu:', error); // Detaylı hata logu
        throw new Error('E-posta gönderme başarısız.');
    }
};

module.exports = sendEmail;