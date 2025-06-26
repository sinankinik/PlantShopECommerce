// backend/config/redis.js

const Redis = require('ioredis');
const dotenv = require('dotenv');

// Ortam değişkenlerini yükle (process.env erişimi için)
// Eğer server.js dosyasında zaten yüklüyorsanız burada tekrar yüklemeye gerek kalmaz.
// Ancak bu dosyanın bağımsız çalışabilmesi için eklemek iyi bir pratik olabilir.
dotenv.config({ path: './config/config.env' });

// Redis bağlantı URL'si veya ayrı ayrı host/port bilgileri
// Genellikle REDIS_URL şeklinde bir ortam değişkeni kullanılır (örn: redis://localhost:6379)
// Veya ayrı ayrı REDIS_HOST ve REDIS_PORT tanımlayabilirsiniz.
const redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1', // Varsayılan Redis hostu
    port: process.env.REDIS_PORT || 6379,       // Varsayılan Redis portu
    password: process.env.REDIS_PASSWORD || undefined, // Eğer Redis'inizde parola varsa
    // Diğer seçenekler (isteğe bağlı):
    // maxRetriesPerRequest: null, // Bağlantı hatalarında yeniden deneme sayısını sınırlamak için
    // enableOfflineQueue: false, // Bağlantı yokken komutları kuyruğa almamak için
});

redisClient.on('connect', () => {
    console.log('Redis\'e başarıyla bağlanıldı!');
});

redisClient.on('error', (err) => {
    console.error('Redis bağlantı hatası:', err);
    // Hata durumunda uygulamayı kapatmak yerine, daha sağlam bir hata yönetimi düşünebilirsiniz.
    // Örneğin: process.exit(1);
});

module.exports = redisClient;