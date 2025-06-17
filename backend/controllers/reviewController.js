const db = require('../config/db');
const AppError = require('../errors/AppError');

// Yeni yorum ve derecelendirme ekleme veya mevcut olanı güncelleme
exports.createOrUpdateReview = async (req, res, next) => {
    const userId = req.user.id;
    const { productId } = req.params; // URL'den productId'yi al
    const { rating, comment } = req.body;

    // Geçersiz veya eksik veri kontrolü
    if (!productId || !rating) {
        return next(new AppError('Ürün ID ve derecelendirme (rating) bilgileri gereklidir.', 400));
    }
    if (rating < 1 || rating > 5) {
        return next(new AppError('Derecelendirme 1 ile 5 arasında olmalıdır.', 400));
    }

    try {
        // Ürünün varlığını kontrol et
        const [productCheck] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (productCheck.length === 0) {
            return next(new AppError('Yorum yapılmak istenen ürün bulunamadı.', 404));
        }

        // Kullanıcının daha önce bu ürüne yorum yapıp yapmadığını kontrol et
        const [existingReview] = await db.query(
            'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
            [productId, userId]
        );

        if (existingReview.length > 0) {
            // Mevcut yorumu güncelle
            await db.query(
                'UPDATE reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [rating, comment || null, existingReview[0].id] // comment yoksa null olarak kaydet
            );
            res.status(200).json({
                status: 'success',
                message: 'Yorum ve derecelendirme başarıyla güncellendi.',
                data: { reviewId: existingReview[0].id }
            });
        } else {
            // Yeni yorum ekle
            const [result] = await db.query(
                'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                [productId, userId, rating, comment || null] // comment yoksa null olarak kaydet
            );
            res.status(201).json({
                status: 'success',
                message: 'Yorum ve derecelendirme başarıyla eklendi.',
                data: { reviewId: result.insertId }
            });
        }

    } catch (err) {
        console.error('Yorum eklenirken/güncellenirken hata oluştu:', err);
        return next(new AppError('Yorum eklenirken/güncellenirken bir hata oluştu.', 500));
    }
};

// Bir ürüne ait tüm yorumları ve ortalama derecelendirmeyi getir
exports.getProductReviews = async (req, res, next) => {
    const { productId } = req.params;

    try {
        // Ürünün varlığını kontrol et
        const [productCheck] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (productCheck.length === 0) {
            return next(new AppError('Yorumları istenen ürün bulunamadı.', 404));
        }

        // Yorumları getir (yorum yapan kullanıcı bilgisiyle birlikte)
        const [reviews] = await db.query(
            `SELECT 
                r.id, 
                r.rating, 
                r.comment, 
                r.created_at, 
                u.username as userName, -- u.name yerine u.username kullanıldı
                u.email as userEmail
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC`,
            [productId]
        );

        // Ortalama derecelendirmeyi hesapla
        let averageRating = 0;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = (totalRating / reviews.length).toFixed(1); // Bir ondalık basamak
        }

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: {
                productId: productId,
                averageRating: parseFloat(averageRating),
                reviews: reviews.map(review => ({
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.created_at,
                    user: {
                        name: review.userName, // userName olarak zaten geliyor
                        email: review.userEmail
                    }
                }))
            }
        });

    } catch (err) {
        console.error('Ürün yorumları getirilirken hata oluştu:', err);
        return next(new AppError('Ürün yorumları getirilirken bir hata oluştu.', 500));
    }
};

// Kullanıcının bir ürüne yaptığı yorumu silme
exports.deleteReview = async (req, res, next) => {
    const userId = req.user.id;
    const { reviewId } = req.params; // Silinecek yorumun ID'si

    try {
        // Yorumu bulan ve kullanıcının o yoruma sahip olup olmadığını doğrulayan sorgu
        const [result] = await db.query(
            'DELETE FROM reviews WHERE id = ? AND user_id = ?',
            [reviewId, userId]
        );

        if (result.affectedRows === 0) {
            return next(new AppError('Yorum bulunamadı veya bu yorumu silmeye yetkiniz yok.', 404));
        }

        // Değişiklik burada! 204 yerine 200 OK ve mesajlı yanıt.
        res.status(200).json({
            status: 'success',
            message: 'Yorum başarıyla silindi.',
            data: null // Veri döndürmeye gerek yoksa null kalabilir
        });

    } catch (err) {
        console.error('Yorum silinirken hata oluştu:', err);
        return next(new AppError('Yorum silinirken bir hata oluştu.', 500));
    }
};