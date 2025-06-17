// backend/controllers/promotionController.js

const db = require('../config/db');
const AppError = require('../errors/AppError');

// Promosyon oluşturma (Admin yetkisi gerektirecek)
exports.createPromotion = async (req, res, next) => {
    const { name, description, promotionType, targetType, targetId, discountValue, minPurchaseAmount, maxDiscountAmount, startDate, endDate } = req.body;

    if (!name || !promotionType || !targetType || !startDate || !endDate) {
        return next(new AppError('Promosyon adı, türü, hedef türü, başlangıç ve bitiş tarihi zorunludur.', 400));
    }

    const validPromotionTypes = ['percentage_discount', 'fixed_amount_discount', 'free_shipping'];
    if (!validPromotionTypes.includes(promotionType)) {
        return next(new AppError('Geçersiz promosyon türü.', 400));
    }

    const validTargetTypes = ['all_products', 'category', 'product'];
    if (!validTargetTypes.includes(targetType)) {
        return next(new AppError('Geçersiz hedef türü.', 400));
    }

    if (['percentage_discount', 'fixed_amount_discount'].includes(promotionType) && (discountValue === undefined || discountValue <= 0)) {
        return next(new AppError('İndirim promosyonları için geçerli bir indirim değeri gereklidir.', 400));
    }

    if (promotionType === 'percentage_discount' && (discountValue <= 0 || discountValue > 100)) {
        return next(new AppError('Yüzde indirimi 0 ile 100 arasında olmalıdır.', 400));
    }

    if (new Date(startDate) >= new Date(endDate)) {
        return next(new AppError('Başlangıç tarihi bitiş tarihinden önce olmalıdır.', 400));
    }

    // Eğer hedef tipi 'category' veya 'product' ise targetId zorunlu
    if (['category', 'product'].includes(targetType) && !targetId) {
        return next(new AppError('Belirli bir kategori veya ürün için hedef ID zorunludur.', 400));
    }
    // Eğer hedef tipi 'all_products' ise targetId olmamalı
    if (targetType === 'all_products' && targetId) {
        return next(new AppError('Tüm ürünler için promosyon oluşturulurken hedef ID belirtilemez.', 400));
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Target ID kontrolü (eğer target_type belirli bir şey ise)
        if (targetType === 'category') {
            const [categoryCheck] = await connection.query('SELECT id FROM categories WHERE id = ?', [targetId]);
            if (categoryCheck.length === 0) {
                await connection.rollback();
                return next(new AppError('Hedef kategori bulunamadı.', 404));
            }
        } else if (targetType === 'product') {
            const [productCheck] = await connection.query('SELECT id FROM products WHERE id = ?', [targetId]);
            if (productCheck.length === 0) {
                await connection.rollback();
                return next(new AppError('Hedef ürün bulunamadı.', 404));
            }
        }

        const [result] = await connection.query(
            'INSERT INTO promotions (name, description, promotion_type, target_type, target_id, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description || null, promotionType, targetType, targetId || null, discountValue || null, minPurchaseAmount || 0, maxDiscountAmount || null, startDate, endDate]
        );

        await connection.commit();

        res.status(201).json({
            status: 'success',
            message: 'Promosyon başarıyla oluşturuldu.',
            data: { promotionId: result.insertId }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Promosyon oluşturulurken hata oluştu:', err);
        return next(new AppError('Promosyon oluşturulurken bir hata oluştu.', 500));
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Tüm promosyonları listeleme (Admin yetkisi gerektirecek)
exports.getAllPromotions = async (req, res, next) => {
    try {
        const [promotions] = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');

        res.status(200).json({
            status: 'success',
            results: promotions.length,
            data: {
                promotions: promotions.map(promo => ({
                    id: promo.id,
                    name: promo.name,
                    description: promo.description,
                    promotionType: promo.promotion_type,
                    targetType: promo.target_type,
                    targetId: promo.target_id,
                    discountValue: promo.discount_value ? parseFloat(promo.discount_value) : null,
                    minPurchaseAmount: parseFloat(promo.min_purchase_amount),
                    maxDiscountAmount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
                    startDate: promo.start_date,
                    endDate: promo.end_date,
                    isActive: promo.is_active,
                    createdAt: promo.created_at,
                    updatedAt: promo.updated_at
                }))
            }
        });
    } catch (err) {
        console.error('Promosyonlar getirilirken hata oluştu:', err);
        return next(new AppError('Promosyonlar getirilirken bir hata oluştu.', 500));
    }
};

// Promosyonu ID'ye göre getir (Admin yetkisi gerektirecek)
exports.getPromotionById = async (req, res, next) => {
    const { promotionId } = req.params;

    try {
        const [promotions] = await db.query('SELECT * FROM promotions WHERE id = ?', [promotionId]);

        if (promotions.length === 0) {
            return next(new AppError('Promosyon bulunamadı.', 404));
        }

        const promo = promotions[0];
        res.status(200).json({
            status: 'success',
            data: {
                promotion: {
                    id: promo.id,
                    name: promo.name,
                    description: promo.description,
                    promotionType: promo.promotion_type,
                    targetType: promo.target_type,
                    targetId: promo.target_id,
                    discountValue: promo.discount_value ? parseFloat(promo.discount_value) : null,
                    minPurchaseAmount: parseFloat(promo.min_purchase_amount),
                    maxDiscountAmount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
                    startDate: promo.start_date,
                    endDate: promo.end_date,
                    isActive: promo.is_active,
                    createdAt: promo.created_at,
                    updatedAt: promo.updated_at
                }
            }
        });
    } catch (err) {
        console.error('Promosyon getirilirken hata oluştu:', err);
        return next(new AppError('Promosyon getirilirken bir hata oluştu.', 500));
    }
};

// Promosyonu güncelleme (Admin yetkisi gerektirecek)
exports.updatePromotion = async (req, res, next) => {
    const { promotionId } = req.params;
    const { name, description, promotionType, targetType, targetId, discountValue, minPurchaseAmount, maxDiscountAmount, startDate, endDate, isActive } = req.body;

    if (Object.keys(req.body).length === 0) {
        return next(new AppError('Güncelleme için en az bir alan belirtilmelidir.', 400));
    }

    try {
        const [promotionCheck] = await db.query('SELECT id FROM promotions WHERE id = ?', [promotionId]);
        if (promotionCheck.length === 0) {
            return next(new AppError('Güncellenmek istenen promosyon bulunamadı.', 404));
        }

        let updateQuery = 'UPDATE promotions SET ';
        const updateValues = [];
        const updates = [];

        if (name !== undefined) { updates.push('name = ?'); updateValues.push(name); }
        if (description !== undefined) { updates.push('description = ?'); updateValues.push(description); }
        if (promotionType !== undefined) {
            const validPromotionTypes = ['percentage_discount', 'fixed_amount_discount', 'free_shipping'];
            if (!validPromotionTypes.includes(promotionType)) {
                return next(new AppError('Geçersiz promosyon türü.', 400));
            }
            updates.push('promotion_type = ?'); updateValues.push(promotionType);
        }
        if (targetType !== undefined) {
            const validTargetTypes = ['all_products', 'category', 'product'];
            if (!validTargetTypes.includes(targetType)) {
                return next(new AppError('Geçersiz hedef türü.', 400));
            }
            updates.push('target_type = ?'); updateValues.push(targetType);
        }
        if (targetId !== undefined) { updates.push('target_id = ?'); updateValues.push(targetId); }
        if (discountValue !== undefined) {
            if (promotionType === 'percentage_discount' && (discountValue <= 0 || discountValue > 100)) {
                return next(new AppError('Yüzde indirimi 0 ile 100 arasında olmalıdır.', 400));
            }
            updates.push('discount_value = ?'); updateValues.push(discountValue);
        }
        if (minPurchaseAmount !== undefined) { updates.push('min_purchase_amount = ?'); updateValues.push(minPurchaseAmount); }
        if (maxDiscountAmount !== undefined) { updates.push('max_discount_amount = ?'); updateValues.push(maxDiscountAmount); }
        if (startDate !== undefined) { updates.push('start_date = ?'); updateValues.push(startDate); }
        if (endDate !== undefined) { updates.push('end_date = ?'); updateValues.push(endDate); }
        if (isActive !== undefined) { updates.push('is_active = ?'); updateValues.push(isActive); }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        updateValues.push(promotionId);

        await db.query(updateQuery, updateValues);

        res.status(200).json({
            status: 'success',
            message: 'Promosyon başarıyla güncellendi.',
            data: { promotionId: promotionId }
        });

    } catch (err) {
        console.error('Promosyon güncellenirken hata oluştu:', err);
        return next(new AppError('Promosyon güncellenirken bir hata oluştu.', 500));
    }
};

// Promosyon silme (Admin yetkisi gerektirecek)
exports.deletePromotion = async (req, res, next) => {
    const { promotionId } = req.params;

    try {
        const [result] = await db.query('DELETE FROM promotions WHERE id = ?', [promotionId]);

        if (result.affectedRows === 0) {
            return next(new AppError('Silinecek promosyon bulunamadı.', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Promosyon başarıyla silindi.',
            data: null
        });
    } catch (err) {
        console.error('Promosyon silinirken hata oluştu:', err);
        return next(new AppError('Promosyon silinirken bir hata oluştu.', 500));
    }
};

// Uygulanabilir promosyonları bulma (Genel kullanıcılar veya sipariş süreci için)
// Bu fonksiyon bir API endpoint'i olmayacak, dahili olarak kullanılacak
exports.getApplicablePromotions = async (cartItems, userId, totalCartAmount) => {
    try {
        const currentTime = new Date();
        const [promotions] = await db.query(
            `SELECT * FROM promotions
            WHERE is_active = TRUE
            AND start_date <= ?
            AND end_date >= ?
            AND min_purchase_amount <= ?
            ORDER BY discount_value DESC`, // Daha yüksek indirimleri öncelikli hale getirebiliriz
            [currentTime, currentTime, totalCartAmount]
        );

        // Sepet öğelerini ve kategorilerini almak için yardımcı fonksiyon
        // Bu kısım, `cartItems` objesinin her bir ürünü için `productId` ve `categoryId` içermesini bekler
        // Örneğin: [{productId: 1, categoryId: 10, quantity: 2, price: 50}]
        const productIdsInCart = cartItems.map(item => item.productId);
        const categoryIdsInCart = [...new Set(cartItems.map(item => item.categoryId))]; // Benzersiz kategori ID'leri

        const applicablePromotions = promotions.filter(promo => {
            // Hedef türüne göre filtreleme
            if (promo.target_type === 'all_products') {
                return true; // Tüm ürünler için geçerli
            } else if (promo.target_type === 'category') {
                return categoryIdsInCart.includes(promo.target_id); // Sepetteki ürünlerin kategorisi eşleşiyor mu
            } else if (promo.target_type === 'product') {
                return productIdsInCart.includes(promo.target_id); // Sepette belirli ürün var mı
            }
            return false;
        });

        // Burada promosyonların nasıl birleştirileceğine dair karmaşık bir mantık geliştirilebilir.
        // Örneğin, sadece en iyi promosyonu uygula, veya belirli kombinasyonlara izin ver.
        // Şimdilik, sadece applicable promosyonları döndürüyoruz.
        // Sipariş toplamını hesaplarken bu promosyonları uygulayacağız.

        return applicablePromotions.map(promo => ({
            id: promo.id,
            name: promo.name,
            promotionType: promo.promotion_type,
            targetType: promo.target_type,
            targetId: promo.target_id,
            discountValue: promo.discount_value ? parseFloat(promo.discount_value) : null,
            minPurchaseAmount: parseFloat(promo.min_purchase_amount),
            maxDiscountAmount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
            startDate: promo.start_date,
            endDate: promo.end_date,
        }));

    } catch (err) {
        console.error('Uygulanabilir promosyonlar getirilirken hata oluştu:', err);
        throw new AppError('Uygulanabilir promosyonlar getirilirken bir hata oluştu.', 500);
    }
};

// Bu fonksiyonu şimdilik burada bırakıyoruz, ancak esas olarak
// sepet veya sipariş onay sayfasında çağrılacak bir yardımcı fonksiyondur.
// applyCoupon'dan farklı olarak, bu otomatiktir ve kod gerektirmez.