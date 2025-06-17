// backend/controllers/categoryController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError } = require('../errors/AppError'); // AppError'ın yolu doğru olduğundan emin olun

// Yeni kategori oluşturma
exports.createCategory = async (req, res, next) => {
    const { name, description } = req.body; // description eklendi

    try {
        // Kategori adının benzersizliğini kontrol et
        const [existingCategory] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
        if (existingCategory.length > 0) {
            return next(new BadRequestError('Bu kategori adı zaten mevcut.'));
        }

        const [result] = await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null]);

        res.status(201).json({
            status: 'success',
            message: 'Kategori başarıyla oluşturuldu.',
            data: { id: result.insertId, name, description: description || null }
        });

    } catch (err) {
        console.error('Kategori oluşturulurken hata oluştu:', err);
        next(new AppError('Kategori oluşturulurken bir hata oluştu.', 500));
    }
};

// Tüm kategorileri getir
exports.getAllCategories = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT id, name, description, created_at, updated_at FROM categories');
        res.status(200).json({
            status: 'success',
            results: rows.length,
            data: { categories: rows }
        });
    } catch (err) {
        console.error('Kategoriler getirilirken hata oluştu:', err);
        next(new AppError('Kategoriler getirilirken bir hata oluştu.', 500));
    }
};

// Belirli bir kategoriyi ID ile getir
exports.getCategoryById = async (req, res, next) => {
    const categoryId = req.params.id;

    try {
        const [rows] = await db.query('SELECT id, name, description, created_at, updated_at FROM categories WHERE id = ?', [categoryId]);
        const category = rows[0];

        if (!category) {
            return next(new NotFoundError('Kategori bulunamadı.'));
        }

        res.status(200).json({
            status: 'success',
            data: { category }
        });

    } catch (err) {
        console.error('Kategori getirilirken hata oluştu:', err);
        next(new AppError('Kategori getirilirken bir hata oluştu.', 500));
    }
};

// Kategori güncelle
exports.updateCategory = async (req, res, next) => {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    try {
        // Güncellenecek kategori var mı kontrol et
        const [existingCategory] = await db.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
        if (existingCategory.length === 0) {
            return next(new NotFoundError('Güncellenecek kategori bulunamadı.'));
        }

        // Kategori adı değişiyorsa ve bu ad başka bir kategori tarafından kullanılıyorsa kontrol et
        if (name !== undefined) {
            const [duplicateCategory] = await db.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name, categoryId]);
            if (duplicateCategory.length > 0) {
                return next(new BadRequestError('Bu kategori adı zaten başka bir kategori tarafından kullanılıyor.'));
            }
        }

        // Güncelleme sorgusunu dinamik olarak oluştur
        const updates = [];
        const params = [];
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) { // description null da olabilir
            updates.push('description = ?');
            params.push(description);
        }
        if (updates.length === 0) {
            return next(new BadRequestError('Güncellenecek en az bir alan sağlamalısınız (name veya description).'));
        }

        params.push(categoryId);

        await db.query(`UPDATE categories SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

        res.status(200).json({
            status: 'success',
            message: 'Kategori başarıyla güncellendi.'
        });

    } catch (err) {
        console.error('Kategori güncellenirken hata oluştu:', err);
        next(new AppError('Kategori güncellenirken bir hata oluştu.', 500));
    }
};

// Kategori sil
exports.deleteCategory = async (req, res, next) => {
    const categoryId = req.params.id;

    try {
        // Kategoriye bağlı ürün olup olmadığını kontrol et
        const [products] = await db.query('SELECT id FROM products WHERE category_id = ?', [categoryId]);
        if (products.length > 0) {
            return next(new BadRequestError('Bu kategoriye bağlı ürünler olduğu için silinemez. Önce ürünleri silin veya başka bir kategoriye taşıyın.'));
        }

        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);

        if (result.affectedRows === 0) {
            return next(new NotFoundError('Silinecek kategori bulunamadı.'));
        }

        res.status(204).json({
            status: 'success',
            data: null,
            message: 'Kategori başarıyla silindi.'
        });

    } catch (err) {
        console.error('Kategori silinirken hata oluştu:', err);
        next(new AppError('Kategori silinirken bir hata oluştu.', 500));
    }
};