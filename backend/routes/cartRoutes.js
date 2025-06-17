// backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware'); // Kullanıcı kimlik doğrulama middleware'iniz

// Tüm sepet/liste rotaları için koruma uygula
router.use(protect); // Tüm aşağıdaki rotalar için kullanıcının giriş yapmış olması gerekecek

// Belirli bir türdeki listeyi getir (örn: /api/list/shopping_cart)
router.get('/:listType', cartController.getList);

// Belirli bir türdeki listeye ürün ekle (POST /api/list/shopping_cart)
router.post('/:listType', cartController.addItemToList);

// Belirli bir türdeki listeden ürün çıkar (DELETE /api/list/shopping_cart/:cartItemId)
router.delete('/:listType/:cartItemId', cartController.removeItemFromList);

// Belirli bir türdeki listedeki ürün miktarını güncelle (PATCH /api/list/shopping_cart/:cartItemId)
router.patch('/:listType/:cartItemId', cartController.updateListItemQuantity);

// Belirli bir türdeki listeyi temizle (DELETE /api/list/shopping_cart/clear)
router.delete('/:listType/clear', cartController.clearList);

// Bir ürünü bir listeden diğerine taşı (POST /api/list/move/:cartItemId)
router.post('/move/:cartItemId', cartController.moveItemBetweenLists);


module.exports = router;