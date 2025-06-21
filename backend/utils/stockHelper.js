// backend/utils/stockHelper.js

// db bağlantısını artık dışarıdan alacağız, bu satıra gerek kalmadı
// const db = require('../config/db');

const { AppError, BadRequestError } = require('../errors/AppError');

/**
 * Ürün stoklarını belirtilen miktarda azaltır.
 * Hem ana ürünler hem de varyantlar için çalışır.
 * @param {object} connection - Kullanılacak veritabanı bağlantısı (ana fonksiyondan alınan işlem bağlantısı).
 * @param {Array<Object>} items - Stokları azaltılacak ürün/varyant listesi. Her obje { productId, variantId (opsiyonel), quantity } içermeli.
 * @returns {Promise<void>}
 */
exports.decreaseStock = async (connection, items) => { // connection parametresini ekledik
    try {
        // await conn.beginTransaction(); // İşlemi ana fonksiyon yönetecek, burada başlatmıyoruz

        for (const item of items) {
            const { productId, variantId, quantity } = item;

            if (quantity <= 0) {
                // Eğer miktar 0 veya daha az ise AppError fırlatırız
                throw new BadRequestError(`Ürün ID ${productId}${variantId ? ', Varyant ID ' + variantId : ''} için miktar sıfırdan büyük olmalı.`);
            }

            if (variantId) {
                // Varyant stoğunu güncelle
                // Kilitleme (FOR UPDATE) aynı connection üzerinden yapılmalı
                const [variant] = await connection.query(
                    'SELECT stock_quantity FROM product_variants WHERE id = ? AND product_id = ? FOR UPDATE',
                    [variantId, productId]
                );

                if (variant.length === 0) {
                    throw new BadRequestError(`Ürün varyantı bulunamadı: ID ${variantId}`);
                }

                if (variant[0].stock_quantity < quantity) {
                    throw new BadRequestError(`Yetersiz varyant stoğu: ${variant[0].stock_quantity} mevcut, ${quantity} istendi.`);
                }

                await connection.query(
                    'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [quantity, variantId]
                );
            } else {
                // Ana ürün stoğunu güncelle (varyant yoksa)
                // Kilitleme (FOR UPDATE) aynı connection üzerinden yapılmalı
                const [product] = await connection.query(
                    'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
                    [productId]
                );

                if (product.length === 0) {
                    throw new BadRequestError(`Ürün bulunamadı: ID ${productId}`);
                }

                if (product[0].stock_quantity < quantity) {
                    throw new BadRequestError(`Yetersiz ürün stoğu: ${product[0].stock_quantity} mevcut, ${quantity} istendi.`);
                }

                await connection.query(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [quantity, productId]
                );
            }
        }
        // await connection.commit(); // İşlemi ana fonksiyon yönetecek, burada onayla/geri al yapmıyoruz
    } catch (error) {
        // await connection.rollback(); // Hata durumunda geri alma da ana fonksiyonda olacak
        console.error('Stok azaltma hatası:', error);
        // Hata türünü koruyarak veya yeni bir AppError oluşturarak yukarı fırlat
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.code === 'ER_DEADLOCK_DETECTED') {
             // Özellikle kilitlenmeyle ilgili hataları daha spesifik AppError'a dönüştürebilirsiniz
            throw new AppError('Veritabanı kilitlenme veya zaman aşımı hatası: Lütfen tekrar deneyin.', 500);
        }
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Stok azaltılırken bir hata oluştu.', 500);
    }
    // finally { connection.release(); } // Bağlantı da ana fonksiyonda serbest bırakılacak
};

/**
 * Ürün stoklarını belirtilen miktarda artırır.
 * Hem ana ürünler hem de varyantlar için çalışır.
 * @param {object} connection - Kullanılacak veritabanı bağlantısı (ana fonksiyondan alınan işlem bağlantısı).
 * @param {Array<Object>} items - Stokları artırılacak ürün/varyant listesi. Her obje { productId, variantId (opsiyonel), quantity } içermeli.
 * @returns {Promise<void>}
 */
exports.increaseStock = async (connection, items) => { // connection parametresini ekledik
    try {
        // await connection.beginTransaction(); // İşlemi ana fonksiyon yönetecek

        for (const item of items) {
            const { productId, variantId, quantity } = item;

            if (quantity <= 0) {
                // Eğer miktar 0 veya daha az ise AppError fırlatırız
                throw new BadRequestError(`Ürün ID ${productId}${variantId ? ', Varyant ID ' + variantId : ''} için miktar sıfırdan büyük olmalı.`);
            }

            if (variantId) {
                // Varyant stoğunu güncelle
                await connection.query(
                    'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ? AND product_id = ?',
                    [quantity, variantId, productId]
                );
            } else {
                // Ana ürün stoğunu güncelle (varyant yoksa)
                await connection.query(
                    'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                    [quantity, productId]
                );
            }
        }
        // await connection.commit(); // İşlemi ana fonksiyon yönetecek
    } catch (error) {
        // await connection.rollback(); // Hata durumunda geri alma da ana fonksiyonda olacak
        console.error('Stok artırma hatası:', error);
         if (error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.code === 'ER_DEADLOCK_DETECTED') {
            throw new AppError('Veritabanı kilitlenme veya zaman aşımı hatası: Lütfen tekrar deneyin.', 500);
        }
        throw new AppError('Stok artırılırken bir hata oluştu.', 500);
    }
    // finally { connection.release(); } // Bağlantı da ana fonksiyonda serbest bırakılacak
};