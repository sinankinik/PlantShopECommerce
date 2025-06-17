// backend/controllers/userController.js

const db = require('../config/db');
const { AppError, NotFoundError, BadRequestError } = require('../errors/AppError');
const APIFeatures = require('../utils/apiFeatures');
const bcrypt = require('bcryptjs'); // Şifre hashleme için

// Tüm kullanıcıları getir (Admin paneli için)
exports.getAllUsers = async (req, res, next) => {
    try {
        const baseQuery = "SELECT id, username, email, first_name, last_name, phone_number, address, role, is_verified, created_at, updated_at, is_active FROM users";

        const features = new APIFeatures(baseQuery, req.query)
            .filter()
            .search(['username', 'email', 'first_name', 'last_name'])
            .sort()
            .paginate();

        const [users] = await db.query(features.query, features.params);

        const countBaseQuery = "SELECT COUNT(*) as total FROM users";
        const countFeatures = new APIFeatures(countBaseQuery, req.query)
            .filter()
            .search(['username', 'email', 'first_name', 'last_name']);

        const [totalCountResult] = await db.query(countFeatures.query, countFeatures.params);
        const totalUsers = totalCountResult[0].total;

        res.status(200).json({
            status: 'success',
            results: users.length,
            total: totalUsers,
            data: {
                users
            }
        });
    } catch (err) {
        console.error('Kullanıcıları getirirken hata oluştu:', err);
        next(new AppError('Kullanıcılar getirilirken bir hata oluştu.', 500));
    }
};

// Belirli bir kullanıcıyı ID ile getir (Adminler için)
exports.getUserById = async (req, res, next) => {
    const userId = req.params.id;

    try {
        const [rows] = await db.query('SELECT id, username, email, first_name, last_name, phone_number, address, role, is_verified, created_at, updated_at, is_active FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        if (!user) {
            return next(new NotFoundError('Kullanıcı bulunamadı.'));
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });

    } catch (err) {
        console.error('Kullanıcı getirilirken hata oluştu:', err);
        next(new AppError('Kullanıcı getirilirken bir hata oluştu.', 500));
    }
};

// Yeni kullanıcı oluştur (Adminler için)
exports.createUser = async (req, res, next) => {
    const { username, email, password, first_name, last_name, phone_number, role, address } = req.body;

    try {
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUser.length > 0) {
            return next(new BadRequestError('Bu e-posta veya kullanıcı adı zaten kullanımda.'));
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            'INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, address, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, first_name || null, last_name || null, phone_number || null, role || 'user', address || null, true] // Admin oluşturduğu için varsayılan olarak doğrulanmış kabul edebiliriz
        );

        const newUser = {
            id: result.insertId,
            username,
            email,
            first_name,
            last_name,
            phone_number,
            role,
            address,
            is_verified: true
        };

        res.status(201).json({
            status: 'success',
            message: 'Kullanıcı başarıyla oluşturuldu.',
            data: { user: newUser }
        });

    } catch (err) {
        console.error('Kullanıcı oluşturulurken hata:', err);
        next(new AppError('Kullanıcı oluşturulurken bir hata oluştu.', 500));
    }
};

// Kullanıcıyı güncelle (Adminler için)
exports.updateUser = async (req, res, next) => {
    const userId = req.params.id;
    // Admin, kullanıcının rolünü de değiştirebilir
    const { username, email, first_name, last_name, phone_number, address, role, is_active } = req.body;

    const updateFields = {};
    if (username !== undefined) updateFields.username = username;
    if (email !== undefined) updateFields.email = email;
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (last_name !== undefined) updateFields.last_name = last_name;
    if (phone_number !== undefined) updateFields.phone_number = phone_number;
    if (address !== undefined) updateFields.address = address;
    if (role !== undefined) updateFields.role = role;
    if (is_active !== undefined) updateFields.is_active = is_active;


    if (Object.keys(updateFields).length === 0) {
        return next(new BadRequestError('Güncellenecek herhangi bir bilgi sağlamadınız.'));
    }

    try {
        // Eğer email veya username güncelleniyorsa benzersizlik kontrolü yap
        if (updateFields.email || updateFields.username) {
            const [existingUser] = await db.query(
                'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
                [updateFields.email || '', updateFields.username || '', userId]
            );
            if (existingUser.length > 0) {
                return next(new BadRequestError('Bu e-posta veya kullanıcı adı zaten kullanımda.'));
            }
        }

        const setClauses = Object.keys(updateFields).map(key => `${key} = ?`);
        const values = Object.values(updateFields);

        await db.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, [...values, userId]);

        const [updatedUserRows] = await db.query('SELECT id, username, email, first_name, last_name, phone_number, address, role, is_verified, created_at, updated_at, is_active FROM users WHERE id = ?', [userId]);
        const updatedUser = updatedUserRows[0];

        res.status(200).json({
            status: 'success',
            message: 'Kullanıcı başarıyla güncellendi.',
            data: { user: updatedUser }
        });

    } catch (err) {
        console.error('Kullanıcı güncellenirken hata:', err);
        next(new AppError('Kullanıcı güncellenirken bir hata oluştu.', 500));
    }
};

// Kullanıcıyı sil (Adminler için - Mantıksal silme)
exports.deleteUser = async (req, res, next) => {
    const userId = req.params.id;

    try {
        // Gerçek silme yerine is_active sütununu FALSE yapmak daha güvenlidir
        const [result] = await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return next(new NotFoundError('Silinecek kullanıcı bulunamadı.'));
        }

        res.status(204).json({
            status: 'success',
            data: null,
            message: 'Kullanıcı başarıyla silindi (pasifize edildi).'
        });

    } catch (err) {
        console.error('Kullanıcı silinirken hata:', err);
        next(new AppError('Kullanıcı silinirken bir hata oluştu.', 500));
    }
};