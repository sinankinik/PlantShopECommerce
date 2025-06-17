// backend/controllers/couponController.js

const db = require('../config/db');
const AppError = require('../errors/AppError');

// Kupon oluşturma (Sadece yöneticiler için olmalı, şimdilik protect ile kalsın)
exports.createCoupon = async (req, res, next) => {
    const { code, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, usageLimit, expiresAt } = req.body;

    if (!code || !discountType || !discountValue) {
        return next(new AppError('Kupon kodu, indirim türü ve indirim değeri zorunludur.', 400));
    }

    if (!['percentage', 'fixed_amount'].includes(discountType)) {
        return next(new AppError('Geçersiz indirim türü. "percentage" veya "fixed_amount" olmalıdır.', 400));
    }

    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
        return next(new AppError('Yüzde indirimi 0 ile 100 arasında olmalıdır.', 400));
    }
    if (discountType === 'fixed_amount' && discountValue <= 0) {
        return next(new AppError('Sabit miktar indirimi sıfırdan büyük olmalıdır.', 400));
    }

    try {
        const [result] = await db.query(
            'INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [code, discountType, discountValue, minPurchaseAmount || 0, maxDiscountAmount || null, usageLimit || null, expiresAt || null]
        );

        res.status(201).json({
            status: 'success',
            message: 'Kupon başarıyla oluşturuldu.',
            data: {
                couponId: result.insertId,
                code: code
            }
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return next(new AppError('Bu kupon kodu zaten mevcut.', 409));
        }
        console.error('Kupon oluşturulurken hata oluştu:', err);
        return next(new AppError('Kupon oluşturulurken bir hata oluştu.', 500));
    }
};

// Kuponu uygulama (sepete veya bir toplama)
exports.applyCoupon = async (req, res, next) => {
    const { code, cartAmount } = req.body; // cartAmount: kuponun uygulanacağı sepet tutarı

    if (!code || !cartAmount || isNaN(cartAmount) || parseFloat(cartAmount) < 0) {
        return next(new AppError('Kupon kodu ve uygulanacak sepet tutarı gereklidir.', 400));
    }

    try {
        const [coupons] = await db.query('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [code]);

        if (coupons.length === 0) {
            return next(new AppError('Geçersiz veya aktif olmayan kupon kodu.', 404));
        }

        const coupon = coupons[0];

        // Kupon kullanım limitini kontrol et
        if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
            return next(new AppError('Bu kuponun kullanım limiti dolmuştur.', 400));
        }

        // Kuponun geçerlilik süresini kontrol et
        if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
            return next(new AppError('Bu kuponun süresi dolmuştur.', 400));
        }

        // Minimum sepet tutarı kontrolü
        if (parseFloat(cartAmount) < parseFloat(coupon.min_purchase_amount)) {
            return next(new AppError(`Bu kuponu kullanmak için sepet tutarınız minimum ${coupon.min_purchase_amount} TL olmalıdır.`, 400));
        }

        let discountedAmount = 0;
        let finalAmount = parseFloat(cartAmount);

        if (coupon.discount_type === 'fixed_amount') {
            discountedAmount = parseFloat(coupon.discount_value);
            if (coupon.max_discount_amount !== null && discountedAmount > parseFloat(coupon.max_discount_amount)) {
                discountedAmount = parseFloat(coupon.max_discount_amount);
            }
            finalAmount = finalAmount - discountedAmount;
        } else if (coupon.discount_type === 'percentage') {
            discountedAmount = parseFloat(cartAmount) * (parseFloat(coupon.discount_value) / 100);
            if (coupon.max_discount_amount !== null && discountedAmount > parseFloat(coupon.max_discount_amount)) {
                discountedAmount = parseFloat(coupon.max_discount_amount);
            }
            finalAmount = finalAmount - discountedAmount;
        }

        // Final tutarının negatif olmamasını sağla
        if (finalAmount < 0) finalAmount = 0;

        res.status(200).json({
            status: 'success',
            message: 'Kupon başarıyla uygulandı.',
            data: {
                couponCode: coupon.code,
                discountType: coupon.discount_type,
                discountValue: parseFloat(coupon.discount_value),
                discountApplied: parseFloat(discountedAmount.toFixed(2)),
                originalAmount: parseFloat(cartAmount),
                finalAmount: parseFloat(finalAmount.toFixed(2))
            }
        });

    } catch (err) {
        console.error('Kupon uygulanırken hata oluştu:', err);
        return next(new AppError('Kupon uygulanırken bir hata oluştu.', 500));
    }
};

// Kupon kullanım sayısını artırma (Sipariş tamamlandığında çağrılmalı)
// Bu fonksiyonu doğrudan bir API endpoint'i olarak expose etmek yerine,
// createOrder gibi sipariş oluşturma süreçlerinde dahili olarak çağırmak daha güvenlidir.
exports.incrementCouponUsage = async (couponCode) => {
    try {
        await db.query(
            'UPDATE coupons SET times_used = times_used + 1 WHERE code = ?',
            [couponCode]
        );
    } catch (err) {
        console.error(`Kupon "${couponCode}" kullanım sayısı artırılırken hata oluştu:`, err);
        // Hatanın çağrılan yerden yakalanmasını sağlamak için hata fırlatılabilir
        throw new AppError('Kupon kullanım sayısı artırılamadı.', 500);
    }
};

// Kuponu güncelleme (Sadece yöneticiler için)
exports.updateCoupon = async (req, res, next) => {
    const { couponId } = req.params;
    const { code, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, usageLimit, expiresAt, isActive } = req.body;

    // Güncelleme için en az bir alan olmalı
    if (Object.keys(req.body).length === 0) {
        return next(new AppError('Güncelleme için en az bir alan belirtilmelidir.', 400));
    }

    try {
        const [couponCheck] = await db.query('SELECT id FROM coupons WHERE id = ?', [couponId]);
        if (couponCheck.length === 0) {
            return next(new AppError('Güncellenmek istenen kupon bulunamadı.', 404));
        }

        let updateQuery = 'UPDATE coupons SET ';
        const updateValues = [];
        const updates = [];

        if (code !== undefined) { updates.push('code = ?'); updateValues.push(code); }
        if (discountType !== undefined) {
            if (!['percentage', 'fixed_amount'].includes(discountType)) {
                return next(new AppError('Geçersiz indirim türü. "percentage" veya "fixed_amount" olmalıdır.', 400));
            }
            updates.push('discount_type = ?'); updateValues.push(discountType);
        }
        if (discountValue !== undefined) {
            if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
                return next(new AppError('Yüzde indirimi 0 ile 100 arasında olmalıdır.', 400));
            }
            if (discountType === 'fixed_amount' && discountValue <= 0) {
                return next(new AppError('Sabit miktar indirimi sıfırdan büyük olmalıdır.', 400));
            }
            updates.push('discount_value = ?'); updateValues.push(discountValue);
        }
        if (minPurchaseAmount !== undefined) { updates.push('min_purchase_amount = ?'); updateValues.push(minPurchaseAmount); }
        if (maxDiscountAmount !== undefined) { updates.push('max_discount_amount = ?'); updateValues.push(maxDiscountAmount); }
        if (usageLimit !== undefined) { updates.push('usage_limit = ?'); updateValues.push(usageLimit); }
        if (expiresAt !== undefined) { updates.push('expires_at = ?'); updateValues.push(expiresAt); }
        if (isActive !== undefined) { updates.push('is_active = ?'); updateValues.push(isActive); }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        updateValues.push(couponId);

        await db.query(updateQuery, updateValues);

        res.status(200).json({
            status: 'success',
            message: 'Kupon başarıyla güncellendi.',
            data: { couponId: couponId }
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return next(new AppError('Bu kupon kodu zaten mevcut.', 409));
        }
        console.error('Kupon güncellenirken hata oluştu:', err);
        return next(new AppError('Kupon güncellenirken bir hata oluştu.', 500));
    }
};

// Kupon silme (Sadece yöneticiler için)
exports.deleteCoupon = async (req, res, next) => {
    const { couponId } = req.params;

    try {
        const [result] = await db.query('DELETE FROM coupons WHERE id = ?', [couponId]);

        if (result.affectedRows === 0) {
            return next(new AppError('Silinecek kupon bulunamadı.', 404));
        }

        res.status(200).json({ // 200 OK ve mesajlı yanıt
            status: 'success',
            message: 'Kupon başarıyla silindi.',
            data: null
        });
    } catch (err) {
        console.error('Kupon silinirken hata oluştu:', err);
        return next(new AppError('Kupon silinirken bir hata oluştu.', 500));
    }
};

// Tüm kuponları listeleme (Sadece yöneticiler için)
exports.getAllCoupons = async (req, res, next) => {
    try {
        const [coupons] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');

        res.status(200).json({
            status: 'success',
            results: coupons.length,
            data: {
                coupons: coupons.map(coupon => ({
                    id: coupon.id,
                    code: coupon.code,
                    discountType: coupon.discount_type,
                    discountValue: parseFloat(coupon.discount_value),
                    minPurchaseAmount: parseFloat(coupon.min_purchase_amount),
                    maxDiscountAmount: coupon.max_discount_amount ? parseFloat(coupon.max_discount_amount) : null,
                    usageLimit: coupon.usage_limit,
                    timesUsed: coupon.times_used,
                    expiresAt: coupon.expires_at,
                    isActive: coupon.is_active,
                    createdAt: coupon.created_at,
                    updatedAt: coupon.updated_at
                }))
            }
        });
    } catch (err) {
        console.error('Kuponlar getirilirken hata oluştu:', err);
        return next(new AppError('Kuponlar getirilirken bir hata oluştu.', 500));
    }
};