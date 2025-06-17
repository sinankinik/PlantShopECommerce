const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Ortam değişkenlerini yükle
// Eğer .env dosyası 'backend' klasörünün kökünde ise:
dotenv.config(); // path belirtmeye gerek yok, bulunduğumuz dizinden yukarı çıkarak .env arar

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Portu da ortam değişkeninden al veya varsayılan 3306 kullan
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Veritabanı bağlantısını test et
pool.getConnection()
    .then(connection => {
        console.log('MySQL veritabanına başarıyla bağlanıldı!');
        connection.release(); // Bağlantıyı havuza geri bırak
    })
    .catch(err => {
        console.error('MySQL veritabanı bağlantı hatası:', err.message);
        // Hata durumunda uygulamanın devam etmemesi için süreci sonlandır
        process.exit(1);
    });

module.exports = pool;