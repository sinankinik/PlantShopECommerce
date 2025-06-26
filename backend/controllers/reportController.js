// backend/controllers/reportController.js

const db = require('../config/db');
const { AppError, BadRequestError } = require('../errors/AppError');

/**
 * Belirli bir tarih aralığındaki toplam satışları ve geliri getirir.
 * Sadece admin yetkisi gerektirir.
 * @param {object} req - İstek nesnesi (query params: startDate, endDate)
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.getOverallSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query; // Query parametrelerinden tarih aralığını al

        // Tarih validasyonu
        if (!startDate || !endDate) {
            return next(new BadRequestError('Başlangıç ve bitiş tarihleri (startDate, endDate) zorunludur.'));
        }
        if (isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
            return next(new BadRequestError('Geçersiz tarih formatı. Lütfen YYYY-MM-DD formatını kullanın.'));
        }

        // Toplam satış miktarını ve toplam geliri hesapla
        const [rows] = await db.query(
            `SELECT 
                COUNT(id) AS total_orders, 
                SUM(total_amount) AS total_revenue 
             FROM orders 
             WHERE status = 'completed' AND order_date BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        const reportData = rows[0];

        res.status(200).json({
            status: 'success',
            message: 'Genel satış raporu başarıyla getirildi.',
            data: {
                report: {
                    totalOrders: reportData.total_orders || 0,
                    totalRevenue: parseFloat(reportData.total_revenue || 0).toFixed(2) // Ondalık basamakları düzenle
                },
                dateRange: {
                    startDate,
                    endDate
                }
            }
        });

    } catch (err) {
        console.error('Genel satış raporu getirilirken hata oluştu:', err);
        next(new AppError('Genel satış raporu getirilirken bir hata oluştu.', 500));
    }
};

/**
 * En çok satan ürünleri belirli bir limite göre getirir.
 * Sadece admin yetkisi gerektirir.
 * @param {object} req - İstek nesnesi (query params: limit)
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.getTopSellingProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10; // Varsayılan olarak en çok satan 10 ürün

        if (isNaN(limit) || limit <= 0) {
            return next(new BadRequestError('Limit değeri pozitif bir sayı olmalıdır.'));
        }

        const [topProducts] = await db.query(
            `SELECT 
                oi.product_id, 
                p.name AS product_name, 
                SUM(oi.quantity) AS total_quantity_sold,
                SUM(oi.quantity * oi.price_at_order) AS total_revenue_generated
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE o.status = 'completed'
             GROUP BY oi.product_id, p.name
             ORDER BY total_quantity_sold DESC
             LIMIT ?`,
            [limit]
        );

        res.status(200).json({
            status: 'success',
            message: `En çok satan ${limit} ürün başarıyla getirildi.`,
            data: {
                topProducts: topProducts.map(p => ({
                    ...p,
                    total_revenue_generated: parseFloat(p.total_revenue_generated || 0).toFixed(2)
                }))
            }
        });

    } catch (err) {
        console.error('En çok satan ürünler getirilirken hata oluştu:', err);
        next(new AppError('En çok satan ürünler getirilirken bir hata oluştu.', 500));
    }
};

/**
 * Kullanıcı istatistiklerini getirir (toplam kullanıcı, aktif, doğrulanmış, yeni kayıtlar).
 * Sadece admin yetkisi gerektirir.
 * @param {object} req - İstek nesnesi (query params: startDate, endDate - yeni kayıtlar için)
 * @param {object} res - Yanıt nesnesi
 * @param {function} next - Sonraki middleware fonksiyonu
 */
exports.getUserStatistics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Toplam kullanıcı sayısı
        const [totalUsersResult] = await db.query('SELECT COUNT(id) AS total_users FROM users');
        const totalUsers = totalUsersResult[0].total_users;

        // Aktif kullanıcı sayısı (is_active = 1 olanlar)
        const [activeUsersResult] = await db.query('SELECT COUNT(id) AS active_users FROM users WHERE is_active = 1');
        const activeUsers = activeUsersResult[0].active_users;

        // Doğrulanmış kullanıcı sayısı (is_verified = 1 veya email_verified = 1 olanlar)
        const [verifiedUsersResult] = await db.query('SELECT COUNT(id) AS verified_users FROM users WHERE is_verified = 1 OR email_verified = 1');
        const verifiedUsers = verifiedUsersResult[0].verified_users;

        let newUsersInPeriod = 0;
        if (startDate && endDate) {
            if (isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
                return next(new BadRequestError('Geçersiz tarih formatı. Lütfen YYYY-MM-DD formatını kullanın.'));
            }
            // Belirli bir tarih aralığında yeni kayıt olan kullanıcılar
            const [newUsersResult] = await db.query(
                'SELECT COUNT(id) AS new_users FROM users WHERE created_at BETWEEN ? AND ?',
                [startDate, endDate]
            );
            newUsersInPeriod = newUsersResult[0].new_users;
        }

        res.status(200).json({
            status: 'success',
            message: 'Kullanıcı istatistikleri başarıyla getirildi.',
            data: {
                totalUsers,
                activeUsers,
                verifiedUsers,
                newUsersInPeriod: newUsersInPeriod,
                dateRangeForNewUsers: (startDate && endDate) ? { startDate, endDate } : null
            }
        });

    } catch (err) {
        console.error('Kullanıcı istatistikleri getirilirken hata oluştu:', err);
        next(new AppError('Kullanıcı istatistikleri getirilirken bir hata oluştu.', 500));
    }
};