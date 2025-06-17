// backend/controllers/productController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError } = require('../errors/AppError');
const APIFeatures = require('../utils/apiFeatures');
// const fs = require('fs'); // Eğer hata durumunda yüklenen resimleri silmek isterseniz import edin

// Ürün oluşturma
exports.createProduct = async (req, res, next) => {
    const { name, description, price, stock_quantity, image_url, category_id } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, stock_quantity, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, stock_quantity, image_url, category_id]
        );

        res.status(201).json({
            message: 'Ürün başarıyla oluşturuldu.',
            productId: result.insertId
        });

    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
            return next(new BadRequestError('Belirtilen kategori bulunamadı veya geçersiz.'));
        }
        next(new AppError('Ürün oluşturulurken bir hata oluştu.', 500));
    }
};

// Tüm ürünleri getir (filtreleme, arama, sıralama, sayfalama ile)
exports.getAllProducts = async (req, res, next) => {
    try {
        const baseQuery = "SELECT p.*, c.name as categoryName FROM products p JOIN categories c ON p.category_id = c.id";

        const features = new APIFeatures(baseQuery, req.query)
            .filter()
            .search(['p.name', 'p.description']) // Ürün adı ve açıklamasına göre arama yap
            .sort()
            .paginate();

        // Ürünleri ve toplam sayıyı almak için iki ayrı sorgu çalıştırılır
        // Ana sorgu: filtrelenmiş, sıralanmış ve sayfalanmış ürünler
        const [products] = await db.query(features.query, features.params);

        // Toplam ürün sayısını almak için ayrı bir sorgu (pagination için gerekli)
        const countBaseQuery = "SELECT COUNT(*) as total FROM products p JOIN categories c ON p.category_id = c.id";
        const countFeatures = new APIFeatures(countBaseQuery, req.query)
            .filter()
            .search(['p.name', 'p.description']); // COUNT sorgusuna da aynı arama ve filtreleri uygula

        const [totalCountResult] = await db.query(countFeatures.query, countFeatures.params);
        const totalProducts = totalCountResult[0].total;

        res.status(200).json({
            status: 'success',
            results: products.length,
            total: totalProducts,
            data: {
                products
            }
        });
    } catch (err) {
        console.error('Ürünleri getirirken hata oluştu:', err);
        next(new AppError('Ürünler getirilirken bir hata oluştu.', 500));
    }
};

// Ürünü ID'ye göre getir
exports.getProductById = async (req, res, next) => {
    const productId = req.params.id;

    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
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
    const { name, description, price, stock_quantity, image_url, category_id } = req.body;

    try {
        const [existingProduct] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (existingProduct.length === 0) {
            return next(new NotFoundError('Güncellenecek ürün bulunamadı.'));
        }

        const updateFields = { name, description, price, stock_quantity, image_url, category_id };
        const setClauses = Object.keys(updateFields).filter(key => updateFields[key] !== undefined).map(key => `${key} = ?`);
        const values = Object.keys(updateFields).filter(key => updateFields[key] !== undefined).map(key => updateFields[key]);

        if (setClauses.length === 0) {
            return next(new BadRequestError('Güncellenecek herhangi bir bilgi sağlamadınız.'));
        }

        await db.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, [...values, productId]);

        res.json({ message: 'Ürün başarıyla güncellendi.' });

    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
            return next(new BadRequestError('Belirtilen kategori bulunamadı veya geçersiz.'));
        }
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

    if (!req.file) {
        return next(new BadRequestError('Lütfen yüklenecek bir resim dosyası seçin.'));
    }

    // Dosya yolu: /uploads/dosya_adı.jpg
    const imageUrl = `/uploads/${req.file.filename}`;

    try {
        const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            // fs.unlink(req.file.path, (err) => { if (err) console.error("Resim silinirken hata:", err); }); // Hata durumunda resmi sil
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
        // fs.unlink(req.file.path, (err) => { if (err) console.error("Resim silinirken hata:", err); }); // Hata durumunda resmi sil
        return next(new AppError('Ürün resmi yüklenirken/güncellenirken bir hata oluştu.', 500));
    }
};


/*
// Eğer birden fazla resim yükleyecekseniz (galeri için)
exports.uploadProductImages = async (req, res, next) => {
    const productId = req.params.id;
    if (!req.files || req.files.length === 0) {
        return next(new BadRequestError('Lütfen yüklenecek resim dosyaları seçin.'));
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    try {
        const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            req.files.forEach(file => fs.unlink(file.path, (err) => { if (err) console.error("Resim silinirken hata:", err); }));
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
        req.files.forEach(file => fs.unlink(file.path, (err) => { if (err) console.error("Resim silinirken hata:", err); }));
        return next(new AppError('Ürün resimleri yüklenirken bir hata oluştu.', 500));
    }
};
*/


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