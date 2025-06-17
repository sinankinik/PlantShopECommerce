// backend/controllers/cartController.js

const db = require('../config/db');
const AppError = require('../errors/AppError');

// Sepet tipini doğrulamak için yardımcı fonksiyon
const validateListType = (type) => {
    const validTypes = ['shopping_cart', 'wishlist', 'save_for_later']; // Desteklenen liste türleri
    if (!validTypes.includes(type)) {
        throw new AppError(`Geçersiz liste türü: ${type}. Desteklenen türler: ${validTypes.join(', ')}`, 400);
    }
};

// Ortak fonksiyon: Kullanıcının listesini (sepetini/istek listesini) getir veya oluştur
const getUserList = async (userId, type) => {
    validateListType(type); // Türü doğrula

    let [listRows] = await db.query('SELECT id FROM carts WHERE user_id = ? AND type = ?', [userId, type]);
    let listId;

    if (listRows.length === 0) {
        // Liste yoksa oluştur
        const [insertListResult] = await db.query('INSERT INTO carts (user_id, type) VALUES (?, ?)', [userId, type]);
        listId = insertListResult.insertId;
    } else {
        listId = listRows[0].id;
    }
    return listId;
};


// Belirli bir türdeki listeyi (sepeti/istek listesini) getir
exports.getList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listType = req.params.listType;

        validateListType(listType);

        const [listItems] = await db.query(
            `SELECT 
                c.id as cartId,
                ci.id as cartItemId,
                ci.product_id,
                p.name as productName,
                p.image_url as productImage,
                ci.quantity,
                p.price as productCurrentPrice, 
                ci.price_at_addition as itemPriceAtAddition, 
                (ci.quantity * ci.price_at_addition) as itemTotalPrice,
                p.stock_quantity as productStock
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            WHERE c.user_id = ? AND c.type = ?`,
            [userId, listType]
        );

        if (!listItems || listItems.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: `${listType} listeniz boş.`,
                data: {
                    list: {
                        type: listType,
                        items: [],
                        totalAmount: 0 // Boş sepet için 0 olarak dönsün
                    }
                }
            });
        }

        let totalAmount = 0; // Başlangıçta sayı (number) olarak tanımla
        const items = listItems.map(item => {
            if (listType === 'shopping_cart') { // Sadece alışveriş sepeti için toplam hesapla
                // parseFloat ile string'den sayıya çevirerek toplama yapın
                totalAmount += parseFloat(item.itemTotalPrice); 
            }
            return {
                cartItemId: item.cartItemId,
                productId: item.product_id,
                productName: item.productName,
                productImage: item.productImage,
                quantity: item.quantity,
                itemPriceAtAddition: parseFloat(item.itemPriceAtAddition), // String gelebilir, güvene al
                productCurrentPrice: parseFloat(item.productCurrentPrice),   // String gelebilir, güvene al
                itemTotalPrice: parseFloat(item.itemTotalPrice),             // String gelebilir, güvene al
                productStock: item.productStock
            };
        });

        res.status(200).json({
            status: 'success',
            results: items.length,
            data: {
                list: {
                    type: listType,
                    items: items,
                    // Burada zaten sayı olmalı, ama yine de parseFloat ile garanti edebiliriz.
                    // toFixed(2) zaten bir string döner, bu yüzden tekrar parseFloat'a ihtiyacınız yok
                    // eğer sonuçta string istiyorsanız. Ama genellikle sayı olarak saklanır.
                    totalAmount: parseFloat(totalAmount.toFixed(2)) 
                }
            }
        });

    } catch (err) {
        console.error(`${req.params.listType} listesi getirilirken hata oluştu:`, err);
        return next(new AppError(`${req.params.listType} listesi getirilirken bir hata oluştu.`, 500));
    }
}

// Listeye ürün ekle (veya miktarını güncelle)
exports.addItemToList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listType = req.params.listType;
        const { productId, quantity = 1 } = req.body; // Varsayılan miktar 1

        validateListType(listType);

        if (!productId || quantity <= 0) {
            return next(new AppError('Ürün ID\'si ve geçerli miktar sağlanmalıdır.', 400));
        }

        // Ürünün mevcut fiyatını ve stok durumunu al
        const [productRows] = await db.query('SELECT price, stock_quantity FROM products WHERE id = ?', [productId]);
        if (productRows.length === 0) {
            return next(new AppError('Ürün bulunamadı.', 404));
        }
        const product = productRows[0];
        const productPrice = product.price; // Mevcut fiyat
        const productStock = product.stock_quantity;

        // Stok kontrolü (sadece 'shopping_cart' için)
        if (listType === 'shopping_cart' && quantity > productStock) {
            return next(new AppError(`Yeterli stok yok. Maksimum ${productStock} adet ekleyebilirsiniz.`, 400));
        }

        // Kullanıcının belirli türdeki listesini (cartId) getir veya oluştur
        const listId = await getUserList(userId, listType);

        // Ürün listede zaten var mı kontrol et
        const [listItemRows] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [listId, productId]
        );

        if (listItemRows.length > 0) {
            // Ürün listede varsa miktarını güncelle
            const existingQuantity = listItemRows[0].quantity;
            const cartItemId = listItemRows[0].id;
            let newQuantity;

            if (listType === 'shopping_cart') {
                newQuantity = existingQuantity + quantity;
                // Güncellenmiş miktar için stok kontrolü
                if (newQuantity > productStock) {
                    return next(new AppError(`Sepetteki toplam miktar (${newQuantity}) stoktan (${productStock}) fazla olamaz.`, 400));
                }
            } else {
                // Diğer listeler için (wishlist gibi) miktar genellikle hep 1'dir,
                // ama eğer kullanıcı belirtirse güncelleyebiliriz.
                // Burada basitlik için doğrudan belirtilen miktarı ayarlayalım.
                newQuantity = quantity;
            }

            await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQuantity, cartItemId]);
            res.status(200).json({
                status: 'success',
                message: `Ürün miktarı ${listType} listenizde güncellendi.`,
                data: { cartItemId, newQuantity }
            });
        } else {
            // Ürün listede yoksa yeni öğe olarak ekle
            await db.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition) VALUES (?, ?, ?, ?)',
                [listId, productId, quantity, productPrice]
            );
            res.status(201).json({
                status: 'success',
                message: `Ürün ${listType} listenize başarıyla eklendi.`,
                data: { listId, productId }
            });
        }

    } catch (err) {
        console.error(`Ürün ${req.params.listType} listesine eklenirken hata oluştu:`, err);
        return next(new AppError(`Ürün ${req.params.listType} listesine eklenirken bir hata oluştu.`, 500));
    }
};

// Listeden ürün çıkar
exports.removeItemFromList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listType = req.params.listType;
        const { cartItemId } = req.params; // Silinecek cart_item'ın ID'si

        validateListType(listType);

        // Kullanıcının listesinin öğesini bul ve doğru kullanıcıya/listeye ait olduğunu doğrula
        const [itemRows] = await db.query(
            `SELECT ci.id, c.user_id, c.type
             FROM cart_items ci 
             JOIN carts c ON ci.cart_id = c.id 
             WHERE ci.id = ? AND c.user_id = ? AND c.type = ?`,
            [cartItemId, userId, listType]
        );

        if (itemRows.length === 0) {
            return next(new AppError('Liste öğesi bulunamadı veya bu öğeyi silme yetkiniz yok.', 404));
        }

        await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);

        res.status(200).json({
            status: 'success',
            message: `Ürün ${listType} listenizden başarıyla kaldırıldı.`
        });

    } catch (err) {
        console.error(`Ürün ${req.params.listType} listesinden kaldırılırken hata oluştu:`, err);
        return next(new AppError(`Ürün ${req.params.listType} listesinden kaldırılırken bir hata oluştu.`, 500));
    }
};

// Listedeki ürün miktarını güncelle
exports.updateListItemQuantity = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listType = req.params.listType;
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        validateListType(listType);

        if (!quantity || quantity <= 0) {
            return next(new AppError('Geçerli bir miktar sağlanmalıdır.', 400));
        }

        // Kullanıcının listesinin öğesini bul ve doğru kullanıcıya/listeye ait olduğunu doğrula
        const [itemRows] = await db.query(
            `SELECT ci.id, ci.product_id, c.user_id, c.type
             FROM cart_items ci 
             JOIN carts c ON ci.cart_id = c.id 
             WHERE ci.id = ? AND c.user_id = ? AND c.type = ?`,
            [cartItemId, userId, listType]
        );

        if (itemRows.length === 0) {
            return next(new AppError('Liste öğesi bulunamadı veya bu öğeyi güncelleme yetkiniz yok.', 404));
        }

        const productId = itemRows[0].product_id;

        // Stok kontrolü (sadece 'shopping_cart' için)
        if (listType === 'shopping_cart') {
            const [productRows] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
            const productStock = productRows[0].stock_quantity;

            if (quantity > productStock) {
                return next(new AppError(`Yeterli stok yok. Maksimum ${productStock} adet ayarlanabilir.`, 400));
            }
        }

        await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, cartItemId]);

        res.status(200).json({
            status: 'success',
            message: `Ürün miktarı ${listType} listenizde başarıyla güncellendi.`,
            data: { cartItemId, newQuantity: quantity }
        });

    } catch (err) {
        console.error(`Ürün miktarı ${req.params.listType} listesinde güncellenirken hata oluştu:`, err);
        return next(new AppError(`Ürün miktarı ${req.params.listType} listesinde güncellenirken bir hata oluştu.`, 500));
    }
};

// Belirli bir türdeki listeyi temizle (tüm öğelerini sil)
exports.clearList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listType = req.params.listType;

        validateListType(listType);

        const [listRows] = await db.query('SELECT id FROM carts WHERE user_id = ? AND type = ?', [userId, listType]);

        if (listRows.length === 0) {
            return next(new AppError(`Temizlenecek bir ${listType} listesi bulunamadı.`, 404));
        }

        const listId = listRows[0].id;

        await db.query('DELETE FROM cart_items WHERE cart_id = ?', [listId]);

        res.status(200).json({
            status: 'success',
            message: `${listType} listeniz başarıyla temizlendi.`
        });

    } catch (err) {
        console.error(`${req.params.listType} listesi temizlenirken hata oluştu:`, err);
        return next(new AppError(`${req.params.listType} listesi temizlenirken bir hata oluştu.`, 500));
    }
};

// Bir ürünü bir listeden diğerine taşıma (örn: istek listesinden sepete)
exports.moveItemBetweenLists = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params; // Taşınacak öğenin ID'si (cart_items tablosundan)
        const { targetListType, quantity = 1 } = req.body; // Hedef liste türü ve taşınacak miktar

        validateListType(targetListType);

        // 1. Taşınacak öğeyi ve ait olduğu listeyi bul
        const [sourceItemRows] = await db.query(
            `SELECT ci.id, ci.product_id, ci.quantity, ci.price_at_addition, c.user_id, c.type as source_list_type
             FROM cart_items ci
             JOIN carts c ON ci.cart_id = c.id
             WHERE ci.id = ? AND c.user_id = ?`,
            [cartItemId, userId]
        );

        if (sourceItemRows.length === 0) {
            return next(new AppError('Taşınacak liste öğesi bulunamadı veya yetkiniz yok.', 404));
        }
        const sourceItem = sourceItemRows[0];
        const sourceListId = sourceItem.cart_id; // Kaynak liste ID'si

        if (sourceItem.quantity < quantity) {
            return next(new AppError(`Taşınacak miktar (${quantity}) mevcut miktardan (${sourceItem.quantity}) fazla olamaz.`, 400));
        }

        // 2. Hedef listeyi (sepet/istek listesi) getir veya oluştur
        const targetListId = await getUserList(userId, targetListType);

        if (sourceItem.source_list_type === targetListType) {
            return next(new AppError('Ürünü aynı liste türüne taşıyamazsınız.', 400));
        }

        // 3. Hedef listede ürün zaten var mı kontrol et
        const [targetItemRows] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [targetListId, sourceItem.product_id]
        );

        if (targetItemRows.length > 0) {
            // Hedef listede zaten varsa miktarı güncelle
            const existingTargetQuantity = targetItemRows[0].quantity;
            const targetCartItemId = targetItemRows[0].id;
            let newTargetQuantity = existingTargetQuantity + quantity;

            // Hedef 'shopping_cart' ise stok kontrolü
            if (targetListType === 'shopping_cart') {
                const [productRows] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [sourceItem.product_id]);
                const productStock = productRows[0].stock_quantity;
                if (newTargetQuantity > productStock) {
                    return next(new AppError(`Taşıma işlemiyle ${targetListType} listesindeki toplam miktar (${newTargetQuantity}) stoktan (${productStock}) fazla olamaz.`, 400));
                }
            }

            await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newTargetQuantity, targetCartItemId]);
            
            // Kaynak listedeki öğeyi güncelle veya sil
            if (sourceItem.quantity === quantity) {
                await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
            } else {
                await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [sourceItem.quantity - quantity, cartItemId]);
            }

            res.status(200).json({
                status: 'success',
                message: `Ürün başarıyla ${sourceItem.source_list_type} listesinden ${targetListType} listesine taşındı ve miktar güncellendi.`
            });

        } else {
            // Hedef listede yoksa, yeni öğe olarak ekle
            await db.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition) VALUES (?, ?, ?, ?)',
                [targetListId, sourceItem.product_id, quantity, sourceItem.price_at_addition]
            );

            // Kaynak listedeki öğeyi güncelle veya sil
            if (sourceItem.quantity === quantity) {
                await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
            } else {
                await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [sourceItem.quantity - quantity, cartItemId]);
            }

            res.status(201).json({
                status: 'success',
                message: `Ürün başarıyla ${sourceItem.source_list_type} listesinden ${targetListType} listesine taşındı.`
            });
        }

    } catch (err) {
        console.error('Ürün listeler arası taşınırken hata oluştu:', err);
        return next(new AppError('Ürün listeler arası taşınırken bir hata oluştu.', 500));
    }
};