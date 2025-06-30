// backend/controllers/categoryController.js
const db = require('../config/db'); // Veritabanı bağlantı dosyanız

// Tüm kategorileri getir
exports.getAllCategories = async (req, res) => {
  try {
    // Veritabanı şemanızda (Dump20250626.sql) 'created_at' ve 'updated_at' sütunları olmadığı için
    // sorgudan bu sütunları çıkardık.
    const [rows] = await db.query('SELECT id, name, description FROM categories');
    res.json(rows);
  } catch (error) {
    console.error('Kategoriler getirilirken hata oluştu:', error);
    res.status(500).json({ message: 'Kategoriler getirilirken sunucu hatası oluştu.' });
  }
};

// Belirli bir kategoriyi ID'ye göre getir (İsteğe bağlı - şu an frontend'de kullanılmıyor)
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, name, description FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(`ID'si ${id} olan kategori getirilirken hata oluştu:`, error);
    res.status(500).json({ message: 'Kategori getirilirken sunucu hatası oluştu.' });
  }
};

// Yeni kategori oluştur (Admin işlemi)
exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  // TODO: Admin yetkilendirme kontrolü eklenecek
  if (!name) {
    return res.status(400).json({ message: 'Kategori adı gereklidir.' });
  }
  try {
    const [result] = await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ id: result.insertId, name, description, message: 'Kategori başarıyla oluşturuldu.' });
  } catch (error) {
    console.error('Kategori oluşturulurken hata oluştu:', error);
    if (error.code === 'ER_DUP_ENTRY') { // Duplicate entry for unique fields (e.g., category name)
        return res.status(409).json({ message: 'Bu kategori adı zaten mevcut.' });
    }
    res.status(500).json({ message: 'Kategori oluşturulurken sunucu hatası oluştu.' });
  }
};

// Kategoriyi güncelle (Admin işlemi)
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  // TODO: Admin yetkilendirme kontrolü eklenecek
  if (!name) {
    return res.status(400).json({ message: 'Kategori adı gereklidir.' });
  }
  try {
    const [result] = await db.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori bulunamadı veya güncellenecek veri yok.' });
    }
    res.json({ id, name, description, message: 'Kategori başarıyla güncellendi.' });
  } catch (error) {
    console.error(`ID'si ${id} olan kategori güncellenirken hata oluştu:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Bu kategori adı zaten mevcut.' });
    }
    res.status(500).json({ message: 'Kategori güncellenirken sunucu hatası oluştu.' });
  }
};

// Kategoriyi sil (Admin işlemi)
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  // TODO: Admin yetkilendirme kontrolü eklenecek
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }
    res.json({ message: 'Kategori başarıyla silindi.' });
  } catch (error) {
    console.error(`ID'si ${id} olan kategori silinirken hata oluştu:`, error);
    res.status(500).json({ message: 'Kategori silinirken sunucu hatası oluştu.' });
  }
};