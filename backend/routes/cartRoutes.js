// backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect, restrictTo } = require('../middleware/authMiddleware');


// Tüm sepet/liste rotaları için koruma uygula (Kullanıcı rotaları)
router.use(protect);

// Kullanıcıya özel listeler için rotalar
// GET /api/cart/:listType - Belirli bir türdeki listeyi getir (örn: /api/cart/shopping_cart)
router.get('/:listType', cartController.getList);

// POST /api/cart/:listType/items - Belirli bir türdeki listeye ürün ekle
router.post('/:listType/items', cartController.addItemToList);

// DELETE /api/cart/:listType/items/:cartItemId - Belirli bir türdeki listeden ürün çıkar
router.delete('/:listType/items/:cartItemId', cartController.removeItemFromList);

// PUT /api/cart/:listType/items/:cartItemId - Belirli bir türdeki listedeki ürün miktarını güncelle
router.put('/:listType/items/:cartItemId', cartController.updateListItemQuantity);

// DELETE /api/cart/:listType/clear - Belirli bir türdeki listeyi temizle (tüm öğelerini sil)
router.delete('/:listType/clear', cartController.clearList);

// POST /api/cart/move/:cartItemId - Bir ürünü bir listeden diğerine taşı
router.post('/move/:cartItemId', cartController.moveItemBetweenLists);


// --- YENİ EKLENEN ADMIN ROTALLARI ---
// Bu rotalar `/api/cart/admin/...` şeklinde erişilebilir olacak
// Admin rotaları için 'restrictTo('admin')' middleware'ini kullanmayı unutmayın.


// GET /api/cart/admin/shopping-carts - Tüm kullanıcıların alışveriş sepetlerini listele (özet)
router.route('/admin/shopping-carts')
    .get(restrictTo('admin'), cartController.getAllUserShoppingCarts);

// GET /api/cart/admin/shopping-carts/:userId - Belirli bir kullanıcının alışveriş sepeti detaylarını getir
router.route('/admin/shopping-carts/:userId')
    .get(restrictTo('admin'), cartController.getUserShoppingCartDetails);

// DELETE /api/cart/admin/:listType/:userId/clear - Belirli bir kullanıcının belirli bir türdeki sepetini boşalt
// Örneğin: /api/cart/admin/shopping_cart/:userId/clear
router.route('/admin/:listType/:userId/clear')
    .delete(restrictTo('admin'), cartController.clearUserSpecificCart);

module.exports = router;