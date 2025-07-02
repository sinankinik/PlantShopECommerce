// backend/controllers/productController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError } = require('../errors/AppError');
const APIFeatures = require('../utils/apiFeatures'); // APIFeatures sınıfını import et
const redisClient = require('../config/redis'); // Redis istemcisini import et
// const fs = require('fs'); // Eğer hata durumunda yüklenen resimleri silmek isterseniz import edin

// Ürün oluşturma (resim yükleme ile)
exports.createProduct = async (req, res, next) => {
    // Multer ve Sharp middleware'ları zaten çalıştı.
    // req.file objesi artık işlenmiş dosya bilgilerini ve kaydedilen yolu içeriyor.
    try {
        const { name, description, price, stock_quantity, category_id, has_variants } = req.body;
        // imageUrl artık req.file.path'ten alınıyor.
        const imageUrl = req.file ? req.file.path : null; 

        if (!name || !price || !stock_quantity) {
            // Eğer resim yüklenmesi zorunluysa, buraya req.file kontrolü de eklenebilir.
            return next(new BadRequestError('Ürün adı, fiyatı ve stok miktarı zorunludur.'));
        }

        // has_variants değerini boolean'a ve sonra 0 veya 1'e dönüştür
        const hasVariantsBoolean = (has_variants === 'true' || has_variants === true || has_variants === 1);
        const hasVariantsForDb = hasVariantsBoolean ? 1 : 0; // MySQL TINYINT(1) için 1 veya 0

        const [result] = await db.query(
            'INSERT INTO products (name, description, price, stock_quantity, image_url, category_id, has_variants) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, stock_quantity, imageUrl, category_id || null, hasVariantsForDb]
        );

        const newProductId = result.insertId;

        res.status(201).json({
            status: 'success',
            message: 'Ürün başarıyla oluşturuldu ve resim yüklendi.',
            data: {
                product: {
                    id: newProductId,
                    name,
                    description,
                    price,
                    stock_quantity,
                    image_url: imageUrl,
                    category_id,
                    has_variants: hasVariantsBoolean // Yanıtta boolean olarak döndürebiliriz
                }
            }
        });

    } catch (error) {
        console.error('Ürün oluşturma hatası:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return next(new BadRequestError('Bu ürün adı zaten kullanılıyor olabilir.'));
        }
        next(error instanceof AppError ? error : new AppError('Ürün oluşturulurken bir hata oluştu.', 500));
    }
};

// Tüm ürünleri getir (filtreleme, arama, sıralama, sayfalama ile)
exports.getAllProducts = async (req, res, next) => {
    try {
        // Önbellek anahtarını oluştur
        const cacheKey = `products:${JSON.stringify(req.query)}`;

        // 1. Önbellekte var mı kontrol et
        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            return res.status(200).json({
                status: 'success',
                // JSON.parse ile string'i tekrar objeye dönüştür
                ...JSON.parse(cachedProducts), 
                fromCache: true // Yanıta önbellekten geldiğini belirt
            });
        }

        // 2. Önbellekte yoksa veritabanından çek
        const { page = 1, limit = 10, category: categoryId, search, sort } = req.query;

        let baseQuery = "SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.id";
        let countBaseQuery = "SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id";
        
        const queryParams = [];
        const countParams = [];
        const whereClauses = [];

        // Kategoriye göre filtreleme
        if (categoryId && categoryId !== '') {
            whereClauses.push('p.category_id = ?');
            queryParams.push(categoryId);
            countParams.push(categoryId);
        }

        // Arama terimine göre filtreleme
        if (search) {
            whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (whereClauses.length > 0) {
            baseQuery += ' WHERE ' + whereClauses.join(' AND ');
            countBaseQuery += ' WHERE ' + whereClauses.join(' AND ');
        }

        // APIFeatures'ı sadece sıralama ve sayfalama için kullanmak üzere geçici bir query objesi oluştur
        // req.query'den sadece 'sort', 'page', 'limit' gibi parametreleri içeren bir obje oluşturuyoruz.
        const featuresQuery = {
            sort: req.query.sort,
            page: req.query.page,
            limit: req.query.limit
        };

        const features = new APIFeatures(baseQuery, featuresQuery)
            .sort() // Sıralama uygula
            .paginate(); // Sayfalama uygula

        // APIFeatures'tan gelen son sorguyu ve parametreleri al
        const finalQuery = features.query;
        const finalQueryParams = [...queryParams, ...features.params]; // Kendi filtre parametrelerimizle birleştir

        // Toplam ürün sayısını al
        const [totalRows] = await db.query(countBaseQuery, countParams);
        const totalItems = totalRows[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));

        // Ürünleri al
        const [products] = await db.query(finalQuery, finalQueryParams);

        const responseData = {
            products: products, // Frontend'in beklediği 'products' anahtarı altında
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems: totalItems,
                totalPages: totalPages,
            }
        };

        // 3. Veritabanından çekilen veriyi önbelleğe kaydet (örn: 1 saat = 3600 saniye)
        await redisClient.setex(cacheKey, 3600, JSON.stringify(responseData));

        res.status(200).json({
            status: 'success',
            ...responseData,
            fromCache: false // Yanıta önbellekten gelmediğini belirt
        });
    } catch (err) {
        console.error('Ürünleri getirirken hata oluştu:', err);
        next(new AppError('Ürünleri getirirken bir hata oluştu.', 500));
    }
};

// Ürünü ID'ye göre getir
exports.getProductById = async (req, res, next) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.query('SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [productId]);
        const product = rows[0];

        if (!product) {
            return next(new NotFoundError('Ürün bulunamadı.'));
        }

        res.json({
            message: 'Ürün başarıyla getirildi.',
            product: product
        });

    } catch (err) {
        next(new AppError('Ürün getirilirken bir hata oluştu.', 500));
    }
};

// Ürünü güncelle
exports.updateProduct = async (req, res, next) => {
    const productId = req.params.id;
    const { name, description, price, stock_quantity, image_url, category_id, has_variants } = req.body; // has_variants'ı buraya da ekle

    try {
        const [existingProduct] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (existingProduct.length === 0) {
            return next(new NotFoundError('Güncellenecek ürün bulunamadı.'));
        }

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (price !== undefined) updateFields.price = price;
        if (stock_quantity !== undefined) updateFields.stock_quantity = stock_quantity;
        if (image_url !== undefined) updateFields.image_url = image_url;
        if (category_id !== undefined) updateFields.category_id = category_id;
        
        // has_variants için dönüşüm
        if (has_variants !== undefined) {
            const hasVariantsBoolean = (has_variants === 'true' || has_variants === true || has_variants === 1);
            updateFields.has_variants = hasVariantsBoolean ? 1 : 0;
        }

        const setClauses = Object.keys(updateFields).map(key => `${key} = ?`);
        const values = Object.values(updateFields);

        if (setClauses.length === 0) {
            return next(new BadRequestError('Güncellenecek herhangi bir bilgi sağlamadınız.'));
        }

        await db.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, [...values, productId]);

        res.json({ message: 'Ürün başarıyla güncellendi.' });

    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
            return next(new BadRequestError('Belirtilen kategori bulunamadı veya geçersiz.'));
        }
        console.error('Ürün güncellenirken hata (DETAYLI):', err); // Hata detayını logla
        next(new AppError('Ürün güncellenirken bir hata oluştu.', 500));
    }
};

// Ürünü sil
exports.deleteProduct = async (req, res, next) => {
    const productId = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);

        if (result.affectedRows === 0) {
            return next(new NotFoundError('Silinecek ürün bulunamadı.'));
        }

        res.json({ message: 'Ürün başarıyla silindi.' });

    } catch (err) {
        next(new AppError('Ürün silinirken bir hata oluştu.', 500));
    }
};

// --- Ürün Resim Yükleme Kontrolcüsü ---
exports.uploadProductImage = async (req, res, next) => {
    const productId = req.params.id;

    // req.file, Multer ve Sharp middleware'ları tarafından zaten işlenmiş olmalı.
    // req.file.path, kaydedilen resmin yolunu içerir.
    if (!req.file || !req.file.path) { // req.file.path'i de kontrol ediyoruz
        return next(new BadRequestError('Lütfen yüklenecek bir resim dosyası seçin.'));
    }

    const imageUrl = req.file.path; // Sharp tarafından işlenmiş ve kaydedilmiş yol

    try {
        const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            // Hata durumunda yüklenen resmi silmek isterseniz fs.unlink kullanabilirsiniz
            // fs.unlink(path.join(__dirname, '..', '..', 'public', imageUrl), (err) => { if (err) console.error("Resim silinirken hata:", err); });
            return next(new NotFoundError('Resim yüklenecek ürün bulunamadı.'));
        }

        await db.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, productId]);

        res.status(200).json({
            status: 'success',
            message: 'Ürün resmi başarıyla yüklendi ve güncellendi.',
            imageUrl: imageUrl
        });

    } catch (err) {
        console.error('Ürün resmi yüklenirken/güncellenirken hata:', err);
        // Hata durumunda yüklenen resmi silmek isterseniz fs.unlink kullanabilirsiniz
        // fs.unlink(path.join(__dirname, '..', '..', 'public', imageUrl), (err) => { if (err) console.error("Resim silinirken hata:", err); });
        return next(new AppError('Ürün resmi yüklenirken/güncellenirken bir hata oluştu.', 500));
    }
};


/*
// Eğer birden fazla resim yükleyecekseniz (galeri için)
exports.uploadProductImages = async (req, res, next) => {
    const productId = req.params.id;
    // req.body.images, Sharp middleware'ı tarafından işlenmiş ve kaydedilmiş yolları içerir.
    if (!req.body.images || req.body.images.length === 0) {
        return next(new BadRequestError('Lütfen yüklenecek resim dosyaları seçin.'));
    }

    const imageUrls = req.body.images; // Sharp tarafından işlenmiş ve kaydedilmiş yollar

    try {
        const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            // Hata durumunda yüklenen resimleri silmek isterseniz
            // imageUrls.forEach(url => fs.unlink(path.join(__dirname, '..', '..', 'public', url), (err) => { if (err) console.error("Resim silinirken hata:", err); }));
            return next(new NotFoundError('Resim yüklenecek ürün bulunamadı.'));
        }

        // Genellikle burada product_images adlı ayrı bir tabloya toplu kayıt yapılır.
        // Örneğin: INSERT INTO product_images (product_id, image_url) VALUES (?, ?), (?, ?);
        // Şu anki senaryoda sadece ana image_url'i güncelleyelim veya yüklenen URL'leri döndürelim.
        // Örneğin, sadece ilk resmi ürünün ana resmi olarak güncelleyebilirsiniz:
        // await db.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrls[0], productId]);

        res.status(200).json({
            status: 'success',
            message: 'Ürün resimleri başarıyla yüklendi.',
            imageUrls: imageUrls // Yüklenen tüm resimlerin URL'lerini döndürüyoruz
        });

    } catch (err) {
        console.error('Ürün resimleri yüklenirken hata:', err);
        // Hata durumunda yüklenen resimleri silmek isterseniz
        // imageUrls.forEach(url => fs.unlink(path.join(__dirname, '..', '..', 'public', url), (err) => { if (err) console.error("Resim silinirken hata:", err); }));
        return next(new AppError('Ürün resimleri yüklenirken bir hata oluştu.', 500));
    }
};
*/

/**
 * Düşük stoklu ürünleri ve varyantları getirir.
 * Sadece admin yetkisi gerektirir.
 * @param {object} req - İstek nesnesi
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.getLowStockProducts = async (req, res, next) => {
    try {
        // Düşük stok eşiği (bu değeri .env dosyanızdan alabilirsiniz veya sabit tutabilirsiniz)
        const LOW_STOCK_THRESHOLD = process.env.LOW_STOCK_THRESHOLD || 5;

        // Düşük stoklu ana ürünleri çek
        const [lowStockProducts] = await db.query(
            'SELECT id, name, stock_quantity FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC',
            [LOW_STOCK_THRESHOLD]
        );

        // Düşük stoklu ürün varyantlarını çek
        const [lowStockVariants] = await db.query(
            `SELECT
                pv.id AS variant_id,
                pv.sku,
                pv.color,
                pv.size,
                pv.material,
                pv.stock_quantity AS variant_stock_quantity,
                p.name AS product_name
               FROM product_variants pv
               JOIN products p ON pv.product_id = p.id
               WHERE pv.stock_quantity <= ?
               ORDER BY pv.stock_quantity ASC`,
            [LOW_STOCK_THRESHOLD]
        );

        // Hem ürün hem de varyant listesini döndür
        res.status(200).json({
            status: 'success',
            message: 'Düşük stoklu ürünler ve varyantlar başarıyla getirildi.',
            data: {
                lowStockProducts,
                lowStockVariants,
                threshold: LOW_STOCK_THRESHOLD
            }
        });

    } catch (err) {
        console.error('Düşük stoklu ürünleri getirirken hata oluştu:', err);
        next(new AppError('Düşük stoklu ürünler getirilirken bir hata oluştu.', 500));
    }
};


// --- Ürün Varyantları Kontrolleri ---

// Yeni ürün varyantı oluşturma
exports.createProductVariant = async (req, res, next) => {
    const productId = req.params.productId;
    const { color, size, material, sku, price, stock, imageUrl } = req.body;

    try {
        // Ürünün varlığını kontrol et
        const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            return next(new NotFoundError('Varyant eklenecek ürün bulunamadı.'));
        }

        // SKU'nun benzersizliğini kontrol et (aynı SKU'dan başka varyant olmamalı)
        const [existingVariant] = await db.query('SELECT id FROM product_variants WHERE sku = ?', [sku]);
        if (existingVariant.length > 0) {
            return next(new AppError('Bu SKU zaten mevcut.', 409)); // 409 Conflict
        }

        // Varyantı veritabanına ekle
        const [result] = await db.query(
            'INSERT INTO product_variants (product_id, color, size, material, sku, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [productId, color || null, size || null, material || null, sku, price, stock, imageUrl || null]
        );

        // Eğer ürünün varyantı yoktuysa, has_variants'ı true yap
        await db.query('UPDATE products SET has_variants = TRUE WHERE id = ? AND has_variants = FALSE', [productId]);

        res.status(201).json({
            status: 'success',
            message: 'Ürün varyantı başarıyla oluşturuldu.',
            data: {
                id: result.insertId,
                product_id: productId,
                color, size, material, sku, price, stock, image_url: imageUrl
            }
        });

    } catch (err) {
        console.error('Ürün varyantı oluşturulurken hata oluştu:', err);
        return next(new AppError('Ürün varyantı oluşturulurken bir hata oluştu.', 500));
    }
};

// Bir ürüne ait tüm varyantları listeleme
exports.getProductVariants = async (req, res, next) => {
    const productId = req.params.productId;

    try {
        const [variants] = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [productId]);

        if (variants.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'Bu ürüne ait varyant bulunamadı.',
                data: { variants: [] }
            });
        }

        res.status(200).json({
            status: 'success',
            results: variants.length,
            data: { variants }
        });

    } catch (err) {
        console.error('Ürün varyantları getirilirken hata oluştu:', err);
        return next(new AppError('Ürün varyantları getirilirken bir hata oluştu.', 500));
    }
};

// Belirli bir varyantı ID ile getirme
exports.getProductVariantById = async (req, res, next) => {
    const productId = req.params.productId;
    const variantId = req.params.variantId;

    try {
        const [variant] = await db.query(
            'SELECT * FROM product_variants WHERE id = ? AND product_id = ?',
            [variantId, productId]
        );

        if (variant.length === 0) {
            return next(new NotFoundError('Ürün varyantı bulunamadı.'));
        }

        res.status(200).json({
            status: 'success',
            data: { variant: variant[0] }
        });

    } catch (err) {
        console.error('Belirli ürün varyantı getirilirken hata oluştu:', err);
        return next(new AppError('Belirli ürün varyantı getirilirken bir hata oluştu.', 500));
    }
};

// Ürün varyantını güncelleme
exports.updateProductVariant = async (req, res, next) => {
    const productId = req.params.productId;
    const variantId = req.params.variantId;
    const { color, size, material, sku, price, stock, imageUrl } = req.body;

    try {
        // Güncellenecek alanları dinamik olarak oluştur
        const updateFields = [];
        const updateValues = [];

        if (color !== undefined) { updateFields.push('color = ?'); updateValues.push(color); }
        if (size !== undefined) { updateFields.push('size = ?'); updateValues.push(size); }
        if (material !== undefined) { updateFields.push('material = ?'); updateValues.push(material); }
        if (sku !== undefined) {
            // Eğer SKU güncelleniyorsa, benzersizliğini kontrol et
            const [existingSku] = await db.query('SELECT id FROM product_variants WHERE sku = ? AND id != ?', [sku, variantId]);
            if (existingSku.length > 0) {
                return next(new AppError('Bu SKU başka bir varyant tarafından kullanılıyor.', 409));
            }
            updateFields.push('sku = ?'); updateValues.push(sku);
        }
        if (price !== undefined) { updateFields.push('price = ?'); updateValues.push(price); }
        if (stock !== undefined) { updateFields.push('stock = ?'); updateValues.push(stock); }
        if (imageUrl !== undefined) { updateFields.push('image_url = ?'); updateValues.push(imageUrl); }

        if (updateFields.length === 0) {
            return next(new BadRequestError('Güncellenecek veri bulunamadı.'));
        }

        updateValues.push(variantId, productId); // WHERE koşulları için ID'ler

        const [result] = await db.query(
            `UPDATE product_variants SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND product_id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return next(new NotFoundError('Ürün varyantı bulunamadı veya güncellenmedi.'));
        }

        const [updatedVariant] = await db.query('SELECT * FROM product_variants WHERE id = ?', [variantId]);

        res.status(200).json({
            status: 'success',
            message: 'Ürün varyantı başarıyla güncellendi.',
            data: {
                variant: updatedVariant[0]
            }
        });

    } catch (err) {
        console.error('Ürün varyantı güncellenirken hata oluştu:', err);
        return next(new AppError('Ürün varyantı güncellenirken bir hata oluştu.', 500));
    }
};

// Ürün varyantını silme
exports.deleteProductVariant = async (req, res, next) => {
    const productId = req.params.productId;
    const variantId = req.params.variantId;

    try {
        const [result] = await db.query(
            'DELETE FROM product_variants WHERE id = ? AND product_id = ?',
            [variantId, productId]
        );

        if (result.affectedRows === 0) {
            return next(new NotFoundError('Ürün varyantı bulunamadı veya silinemedi.'));
        }

        // Eğer ürünün başka varyantı kalmadıysa, has_variants'ı false yap
        const [remainingVariants] = await db.query('SELECT id FROM product_variants WHERE product_id = ?', [productId]);
        if (remainingVariants.length === 0) {
            await db.query('UPDATE products SET has_variants = FALSE WHERE id = ?', [productId]);
        }

        res.status(204).json({ // 204 No Content, silme başarıyla tamamlandığında genellikle boş yanıt döner
            status: 'success',
            message: 'Ürün varyantı başarıyla silindi.'
        });

    } catch (err) {
        console.error('Ürün varyantı silinirken hata oluştu:', err);
        return next(new AppError('Ürün varyantı silinirken bir hata oluştu.', 500));
    }
};
