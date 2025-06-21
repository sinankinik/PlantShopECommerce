// backend/utils/cronJobs.js

const cron = require('node-cron');
const db = require('../config/db'); // Veritabanı bağlantısını import et
const sendEmail = require('../config/emailService'); // Mevcut emailService'inizi import et

// Bu fonksiyon, düşük stoklu ürünleri çeker
const getLowStockItemsForEmail = async () => {
    // LOW_STOCK_THRESHOLD değerini buraya da ekleyin, productController ile tutarlı olsun
    const LOW_STOCK_THRESHOLD = 5;

    const [lowStockProducts] = await db.query(
        'SELECT id, name, stock_quantity FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC',
        [LOW_STOCK_THRESHOLD]
    );

    const [lowStockVariants] = await db.query(
        `SELECT
            pv.id AS variant_id,
            pv.name AS variant_name,
            pv.stock_quantity AS variant_stock_quantity,
            p.name AS product_name
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.id
         WHERE pv.stock_quantity <= ?
         ORDER BY pv.stock_quantity ASC`,
        [LOW_STOCK_THRESHOLD]
    );

    return { lowStockProducts, lowStockVariants, threshold: LOW_STOCK_THRESHOLD };
};

// Cron job'ı başlatma fonksiyonu
exports.startCronJobs = () => {
    // Her gün saat 02:00'da çalışacak cron job
    // Cron string formatı: saniye dakika saat gün_ay gün_hafta
    // '0 2 * * *' -> Her gün, saat 02:00'da, 0 saniyede
    cron.schedule('0 2 * * *', async () => {
        console.log(`[${new Date().toLocaleString()}] Cron Job: Düşük stoklu ürün kontrolü başlatıldı.`);
        try {
            const { lowStockProducts, lowStockVariants, threshold } = await getLowStockItemsForEmail();

            if (lowStockProducts.length === 0 && lowStockVariants.length === 0) {
                console.log('Cron Job: Düşük stoklu ürün bulunamadı. E-posta gönderilmedi.');
                return;
            }

            // Düşük stoklu ürünlerin listesini HTML formatında hazırla
            let emailContent = `<h1>Düşük Stok Uyarısı - ${new Date().toLocaleDateString('tr-TR')}</h1>`;
            emailContent += `<p>Aşağıdaki ürünlerin stok miktarı ${threshold} veya altına düşmüştür. Lütfen en kısa sürede stok takviyesi yapınız.</p>`;

            if (lowStockProducts.length > 0) {
                emailContent += '<h2>Ana Ürünler:</h2><ul>';
                lowStockProducts.forEach(p => {
                    emailContent += `<li><strong>${p.name}</strong> (ID: ${p.id}) - Mevcut Stok: ${p.stock_quantity}</li>`;
                });
                emailContent += '</ul>';
            }

            if (lowStockVariants.length > 0) {
                emailContent += '<h2>Varyantlar:</h2><ul>';
                lowStockVariants.forEach(v => {
                    emailContent += `<li><strong>${v.product_name}</strong> - Varyant: ${v.variant_name} (ID: ${v.variant_id}) - Mevcut Stok: ${v.variant_stock_quantity}</li>`;
                });
                emailContent += '</ul>';
            }

            const adminEmail = process.env.ADMIN_EMAIL_FOR_ALERTS; // .env'den çekilen admin e-postası

            if (!adminEmail) {
                console.error('Hata: ADMIN_EMAIL_FOR_ALERTS .env dosyasında tanımlanmamış!');
                return;
            }

            await sendEmail({
                email: adminEmail,
                subject: 'Önemli: Düşük Stok Uyarısı!',
                html: emailContent,
                text: 'Düşük stok uyarısı için HTML e-postanızı görüntüleyin.' // Bazı e-posta istemcileri için yedek
            });

            console.log(`[${new Date().toLocaleString()}] Cron Job: Düşük stok uyarısı e-postası '${adminEmail}' adresine gönderildi.`);

        } catch (error) {
            console.error(`[${new Date().toLocaleString()}] Cron Job Hatası: Düşük stok kontrolü veya e-posta gönderme sırasında bir hata oluştu:`, error);
        }
    }, {
        scheduled: true,
        timezone: "Europe/Istanbul" // Zaman diliminizi ayarlayın
    });

    console.log(`[${new Date().toLocaleString()}] Cron Job: Düşük stok kontrolü başarıyla zamanlandı.`);
};