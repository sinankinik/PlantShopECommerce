// backend/controllers/reviewController.js

const db = require('../config/db');
const AppError = require('../errors/AppError');

// Yeni yorum ve derecelendirme ekleme veya mevcut olanı güncelleme (Mevcut kodunuz)
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

// Bir ürüne ait tüm yorumları ve ortalama derecelendirmeyi getir (Mevcut kodunuz)
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
                r.updated_at,
                u.id as userId,
                u.username as userName, 
                u.email as userEmail,
                p.id as productId,
                p.name as productName
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.id
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
                    updatedAt: review.updated_at,
                    user: {
                        id: review.userId,
                        username: review.userName, 
                        email: review.userEmail
                    },
                    product: {
                        id: review.productId,
                        name: review.productName
                    }
                }))
            }
        });

    } catch (err) {
        console.error('Ürün yorumları getirilirken hata oluştu:', err);
        return next(new AppError('Ürün yorumları getirilirken bir hata oluştu.', 500));
    }
};

// --- YENİ EKLENEN KOD: Tüm yorumları getir (Admin paneli için) ---
exports.getAllReviews = async (req, res, next) => {
    // Sayfalama ve filtreleme parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'created_at'; // Sıralama kriteri
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC'; // Sıralama yönü
    const search = req.query.search || ''; // Yorum içeriği veya kullanıcı adı/e-posta arama

    let query = `
        SELECT 
            r.id, 
            r.rating, 
            r.comment, 
            r.created_at, 
            r.updated_at,
            u.id as userId,
            u.username as userName, 
            u.email as userEmail,
            p.id as productId,
            p.name as productName
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
    `;
    let countQuery = `
        SELECT COUNT(*) as total FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
    `;
    let whereClauses = [];
    let queryParams = [];

    if (search) {
        whereClauses.push(`(r.comment LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.name LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
        query += ` WHERE ` + whereClauses.join(' AND ');
        countQuery += ` WHERE ` + whereClauses.join(' AND ');
    }

    // Sıralama
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Sayfalama
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    try {
        const [reviews] = await db.query(query, queryParams);
        const [totalCountResult] = await db.query(countQuery, queryParams.slice(0, queryParams.length - 2)); // Limit/offset olmadan toplam sayıyı al

        const totalReviews = totalCountResult[0].total;
        const totalPages = Math.ceil(totalReviews / limit);

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: {
                reviews: reviews.map(review => ({
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.created_at,
                    updatedAt: review.updated_at,
                    user: {
                        id: review.userId,
                        username: review.userName, 
                        email: review.userEmail
                    },
                    product: {
                        id: review.productId,
                        name: review.productName
                    }
                })),
                pagination: {
                    currentPage: page,
                    limit: limit,
                    totalPages: totalPages,
                    totalItems: totalReviews
                }
            }
        });

    } catch (err) {
        console.error('Tüm yorumlar getirilirken hata oluştu:', err);
        return next(new AppError('Yorumlar getirilirken bir hata oluştu.', 500));
    }
};

// Yorumu silme (Hem kullanıcı hem admin için. Admin için yetki kontrolü rotada yapılacak)
exports.deleteReview = async (req, res, next) => {
    const { reviewId } = req.params; // Silinecek yorumun ID'si
    const userId = req.user ? req.user.id : null; // Eğer kullanıcı giriş yapmadıysa null
    const userRole = req.user ? req.user.role : null;

    try {
        let query;
        let queryParams;

        if (userRole === 'admin') {
            // Admin, herhangi bir yorumu silebilir
            query = 'DELETE FROM reviews WHERE id = ?';
            queryParams = [reviewId];
        } else if (userId) {
            // Kullanıcı, sadece kendi yorumunu silebilir
            query = 'DELETE FROM reviews WHERE id = ? AND user_id = ?';
            queryParams = [reviewId, userId];
        } else {
            return next(new AppError('Bu işlemi yapmak için yetkiniz yok.', 403));
        }
        
        const [result] = await db.query(query, queryParams);

        if (result.affectedRows === 0) {
            return next(new AppError('Yorum bulunamadı veya bu yorumu silmeye yetkiniz yok.', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Yorum başarıyla silindi.',
            data: null
        });

    } catch (err) {
        console.error('Yorum silinirken hata oluştu:', err);
        return next(new AppError('Yorum silinirken bir hata oluştu.', 500));
    }
};

// Admin'in bir yorumu onaylaması/reddetmesi (isteğe bağlı, henüz backend'de yok ama frontend'de düşünülebilir)
// exports.updateReviewStatus = async (req, res, next) => {
//     const { reviewId } = req.params;
//     const { status } = req.body; // 'approved', 'rejected'
//     try {
//         await db.query('UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, reviewId]);
//         res.status(200).json({ status: 'success', message: 'Yorum durumu güncellendi.' });
//     } catch (err) {
//         console.error('Yorum durumu güncellenirken hata oluştu:', err);
//         return next(new AppError('Yorum durumu güncellenemedi.', 500));
//     }
// };
