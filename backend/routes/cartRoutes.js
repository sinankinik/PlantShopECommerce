// backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware'); // Kullanıcı kimlik doğrulama middleware'iniz

// Tüm sepet/liste rotaları için koruma uygula
router.use(protect); // Tüm aşağıdaki rotalar için kullanıcının giriş yapmış olması gerekecek

// Belirli bir türdeki listeyi getir (örn: /api/cart/shopping_cart)
router.get('/:listType', cartController.getList);

// Belirli bir türdeki listeye ürün ekle (POST /api/cart/shopping_cart/items)
router.post('/:listType/items', cartController.addItemToList);

// Belirli bir türdeki listeden ürün çıkar (DELETE /api/cart/shopping_cart/items/:cartItemId)
router.delete('/:listType/items/:cartItemId', cartController.removeItemFromList);

// Belirli bir türdeki listedeki ürün miktarını güncelle (PUT /api/cart/shopping_cart/items/:cartItemId)
router.put('/:listType/items/:cartItemId', cartController.updateListItemQuantity); // <-- BURASI DÜZELTİLDİ: PATCH yerine PUT kullanıldı

// Belirli bir türdeki listeyi temizle (DELETE /api/cart/shopping_cart/clear)
router.delete('/:listType/clear', cartController.clearList);

// Bir ürünü bir listeden diğerine taşı (POST /api/cart/move/:cartItemId)
router.post('/move/:cartItemId', cartController.moveItemBetweenLists);


module.exports = router;