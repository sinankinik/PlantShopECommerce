// backend/controllers/cartController.js

const db = require('../config/db');
// Düzeltme: AppError ve diğer hata sınıflarını yapıbozum (destructuring) ile içe aktarın
const { AppError, NotFoundError, BadRequestError } = require('../errors/AppError');

// Sepet tipini doğrulamak için yardımcı fonksiyon
const validateListType = (type) => {
    const validTypes = ['shopping_cart', 'wishlist', 'save_for_later']; // Desteklenen liste türleri
    if (!validTypes.includes(type)) {
        // AppError'ı doğru şekilde çağırıyoruz
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
        const listType = req.params.listType; // Frontend'den gelen listType (örn: 'shopping_cart')

        validateListType(listType);

        // product_variant_id'ye göre join ekledik ve varyant bilgilerini de çektik
        const [listItems] = await db.query(
            `SELECT 
                ci.id as cartItemId,
                ci.product_id,
                p.name as product_name,
                p.image_url as image_url,
                ci.quantity,
                p.price as price, -- Ürünün güncel fiyatı
                ci.price_at_addition, -- Sepete eklendiği zamanki fiyatı
                (ci.quantity * ci.price_at_addition) as itemTotalPrice,
                p.stock_quantity as product_stock_quantity,
                pv.id as product_variant_id,
                pv.color as variant_color,
                pv.size as variant_size,
                pv.material as variant_material,
                pv.sku as variant_sku
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
            WHERE c.user_id = ? AND c.type = ?`,
            [userId, listType]
        );

        if (!listItems || listItems.length === 0) {
            // Sepet boşsa 200 OK ile boş sepet objesi döndür
            return res.status(200).json({
                status: 'success',
                message: `${listType} listeniz boş.`,
                data: {
                    cart: { // Frontend'in beklediği 'cart' objesi
                        items: [],
                        total_price: 0,
                        total_quantity: 0
                    }
                }
            });
        }

        let total_price = 0;
        let total_quantity = 0;

        const items = listItems.map(item => {
            const itemCalculatedPrice = parseFloat(item.price_at_addition) * item.quantity;
            total_price += itemCalculatedPrice;
            total_quantity += item.quantity;

            return {
                id: item.cartItemId, // Frontend'de cartItemId olarak kullandığımız, şimdi 'id' olarak gönderiyoruz
                product_id: item.product_id,
                product_name: item.product_name,
                image_url: item.image_url,
                quantity: item.quantity,
                price: parseFloat(item.price_at_addition), // Sepete eklendiği zamanki fiyatı
                current_price: parseFloat(item.price), // Ürünün güncel fiyatı
                total_item_price: itemCalculatedPrice,
                product_stock_quantity: item.product_stock_quantity,
                product_variant_id: item.product_variant_id,
                variant_name: item.product_variant_id ? 
                              `${item.variant_color ? item.variant_color + ' ' : ''}${item.variant_size ? item.variant_size : ''}`.trim() : null // Varyant adı oluştur
            };
        });

        res.status(200).json({
            status: 'success',
            results: items.length,
            data: {
                cart: { // Frontend'in beklediği 'cart' objesi
                    type: listType,
                    items: items,
                    total_price: parseFloat(total_price.toFixed(2)),
                    total_quantity: total_quantity
                }
            }
        });

    } catch (err) {
        console.error(`${req.params.listType} listesi getirilirken hata oluştu:`, err);
        return next(new AppError(`${req.params.listType} listesi getirilirken bir hata oluştu.`, 500));
    }
};

// Listeye ürün ekle (veya miktarını güncelle)
exports.addItemToList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const listType = req.params.listType; // Frontend'den gelen listType (örn: 'shopping_cart')
        const { product_id, quantity = 1, product_variant_id = null } = req.body; // product_id olarak değiştirdik

        validateListType(listType);

        if (!product_id || quantity <= 0) {
            return next(new BadRequestError('Ürün ID\'si ve geçerli miktar sağlanmalıdır.'));
        }

        // Ürünün mevcut fiyatını ve stok durumunu al
        const [productRows] = await db.query('SELECT price, stock_quantity FROM products WHERE id = ?', [product_id]);
        if (productRows.length === 0) {
            return next(new NotFoundError('Ürün bulunamadı.'));
        }
        const product = productRows[0];
        const productPrice = product.price; // Mevcut fiyat
        let productStock = product.stock_quantity;

        // Eğer varyant varsa, varyantın stok ve fiyatını kullan
        let variantPrice = productPrice;
        let variantStock = productStock;
        if (product_variant_id) {
            const [variantRows] = await db.query('SELECT price, stock_quantity FROM product_variants WHERE id = ? AND product_id = ?', [product_variant_id, product_id]);
            if (variantRows.length === 0) {
                return next(new NotFoundError('Ürün varyantı bulunamadı.'));
            }
            const variant = variantRows[0];
            variantPrice = variant.price || productPrice; // Varyantın kendi fiyatı yoksa ürün fiyatını kullan
            variantStock = variant.stock_quantity;
        }

        // Stok kontrolü (sadece 'shopping_cart' için)
        if (listType === 'shopping_cart' && quantity > variantStock) {
            return next(new BadRequestError(`Yeterli stok yok. Maksimum ${variantStock} adet ekleyebilirsiniz.`));
        }

        // Kullanıcının belirli türdeki listesini (cartId) getir veya oluştur
        const listId = await getUserList(userId, listType);

        // Ürün listede zaten var mı kontrol et
        const [listItemRows] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND product_variant_id <=> ?', // <=> null güvenli karşılaştırma
            [listId, product_id, product_variant_id]
        );

        let cartItemId;
        let finalQuantity;
        let message;

        if (listItemRows.length > 0) {
            // Ürün listede varsa miktarını güncelle
            const existingQuantity = listItemRows[0].quantity;
            cartItemId = listItemRows[0].id;
            
            if (listType === 'shopping_cart') {
                finalQuantity = existingQuantity + quantity;
                // Güncellenmiş miktar için stok kontrolü
                if (finalQuantity > variantStock) {
                    return next(new BadRequestError(`Sepetteki toplam miktar (${finalQuantity}) stoktan (${variantStock}) fazla olamaz.`));
                }
            } else {
                // Diğer listeler için (wishlist gibi) doğrudan belirtilen miktarı ayarla
                finalQuantity = quantity;
            }

            await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [finalQuantity, cartItemId]);
            message = `Ürün miktarı ${listType} listenizde güncellendi.`;
        } else {
            // Ürün listede yoksa yeni öğe olarak ekle
            const [insertResult] = await db.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition, product_variant_id) VALUES (?, ?, ?, ?, ?)',
                [listId, product_id, quantity, variantPrice, product_variant_id]
            );
            cartItemId = insertResult.insertId;
            finalQuantity = quantity;
            message = `Ürün ${listType} listenize başarıyla eklendi.`;
        }

        // Güncellenmiş veya yeni eklenen öğeyi geri döndür
        const [updatedItemRows] = await db.query(
            `SELECT 
                ci.id as cartItemId,
                ci.product_id,
                p.name as product_name,
                p.image_url as image_url,
                ci.quantity,
                p.price as price, 
                ci.price_at_addition, 
                (ci.quantity * ci.price_at_addition) as itemTotalPrice,
                p.stock_quantity as product_stock_quantity,
                pv.id as product_variant_id,
                pv.color as variant_color,
                pv.size as variant_size,
                pv.material as variant_material,
                pv.sku as variant_sku
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
            WHERE ci.id = ?`,
            [cartItemId]
        );

        const updatedCartItem = updatedItemRows[0];
        const formattedCartItem = {
            id: updatedCartItem.cartItemId,
            product_id: updatedCartItem.product_id,
            product_name: updatedCartItem.product_name,
            image_url: updatedCartItem.image_url,
            quantity: updatedCartItem.quantity,
            price: parseFloat(updatedCartItem.price_at_addition), // Sepete eklendiği zamanki fiyatı
            current_price: parseFloat(updatedCartItem.price), // Ürünün güncel fiyatı
            total_item_price: parseFloat(updatedCartItem.itemTotalPrice),
            product_stock_quantity: updatedCartItem.product_stock_quantity,
            product_variant_id: updatedCartItem.product_variant_id,
            variant_name: updatedCartItem.product_variant_id ? 
                          `${updatedCartItem.variant_color ? updatedCartItem.variant_color + ' ' : ''}${updatedCartItem.variant_size ? updatedCartItem.variant_size : ''}`.trim() : null
        };


        res.status(200).json({
            status: 'success',
            message: message,
            data: { cartItem: formattedCartItem }
        });

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
            return next(new NotFoundError('Liste öğesi bulunamadı veya bu öğeyi silme yetkiniz yok.'));
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
            return next(new BadRequestError('Geçerli bir miktar sağlanmalıdır.'));
        }

        // Kullanıcının listesinin öğesini bul ve doğru kullanıcıya/listeye ait olduğunu doğrula
        const [itemRows] = await db.query(
            `SELECT ci.id, ci.product_id, ci.product_variant_id, c.user_id, c.type
             FROM cart_items ci 
             JOIN carts c ON ci.cart_id = c.id 
             WHERE ci.id = ? AND c.user_id = ? AND c.type = ?`,
            [cartItemId, userId, listType]
        );

        if (itemRows.length === 0) {
            return next(new NotFoundError('Liste öğesi bulunamadı veya bu öğeyi güncelleme yetkiniz yok.'));
        }

        const { product_id, product_variant_id } = itemRows[0];

        // Stok kontrolü (sadece 'shopping_cart' için)
        if (listType === 'shopping_cart') {
            let stockQuantity;
            if (product_variant_id) {
                const [variantRows] = await db.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [product_variant_id]);
                stockQuantity = variantRows[0]?.stock_quantity;
            } else {
                const [productRows] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [product_id]);
                stockQuantity = productRows[0]?.stock_quantity;
            }

            if (quantity > stockQuantity) {
                return next(new BadRequestError(`Yeterli stok yok. Maksimum ${stockQuantity} adet ayarlanabilir.`));
            }
        }

        await db.query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, cartItemId]);

        // Güncellenen öğeyi geri döndür
        const [updatedItemResult] = await db.query(
            `SELECT 
                ci.id as cartItemId,
                ci.product_id,
                p.name as product_name,
                p.image_url as image_url,
                ci.quantity,
                p.price as price, 
                ci.price_at_addition, 
                (ci.quantity * ci.price_at_addition) as itemTotalPrice,
                p.stock_quantity as product_stock_quantity,
                pv.id as product_variant_id,
                pv.color as variant_color,
                pv.size as variant_size,
                pv.material as variant_material,
                pv.sku as variant_sku
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
            WHERE ci.id = ?`,
            [cartItemId]
        );

        const updatedCartItem = updatedItemResult[0];
        const formattedCartItem = {
            id: updatedCartItem.cartItemId,
            product_id: updatedCartItem.product_id,
            product_name: updatedCartItem.product_name,
            image_url: updatedCartItem.image_url,
            quantity: updatedCartItem.quantity,
            price: parseFloat(updatedCartItem.price_at_addition),
            current_price: parseFloat(updatedCartItem.price),
            total_item_price: parseFloat(updatedCartItem.itemTotalPrice),
            product_stock_quantity: updatedCartItem.product_stock_quantity,
            product_variant_id: updatedCartItem.product_variant_id,
            variant_name: updatedCartItem.product_variant_id ? 
                          `${updatedCartItem.variant_color ? updatedCartItem.variant_color + ' ' : ''}${updatedCartItem.variant_size ? updatedCartItem.variant_size : ''}`.trim() : null
        };

        res.status(200).json({
            status: 'success',
            message: `Ürün miktarı ${listType} listenizde başarıyla güncellendi.`,
            data: { cartItem: formattedCartItem }
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
            return next(new NotFoundError(`Temizlenecek bir ${listType} listesi bulunamadı.`));
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
            `SELECT ci.id, ci.product_id, ci.product_variant_id, ci.quantity, ci.price_at_addition, c.user_id, c.type as source_list_type
             FROM cart_items ci
             JOIN carts c ON ci.cart_id = c.id
             WHERE ci.id = ? AND c.user_id = ?`,
            [cartItemId, userId]
        );

        if (sourceItemRows.length === 0) {
            return next(new NotFoundError('Taşınacak liste öğesi bulunamadı veya yetkiniz yok.'));
        }
        const sourceItem = sourceItemRows[0];
        // sourceItem.cart_id'ye ihtiyacımız yok çünkü ci.id'yi kullanıyoruz

        if (sourceItem.quantity < quantity) {
            return next(new BadRequestError(`Taşınacak miktar (${quantity}) mevcut miktardan (${sourceItem.quantity}) fazla olamaz.`));
        }

        // 2. Hedef listeyi (sepet/istek listesi) getir veya oluştur
        const targetListId = await getUserList(userId, targetListType);

        if (sourceItem.source_list_type === targetListType) {
            return next(new BadRequestError('Ürünü aynı liste türüne taşıyamazsınız.'));
        }

        // 3. Hedef listede ürün zaten var mı kontrol et
        const [targetItemRows] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND product_variant_id <=> ?',
            [targetListId, sourceItem.product_id, sourceItem.product_variant_id]
        );

        if (targetItemRows.length > 0) {
            // Hedef listede zaten varsa miktarı güncelle
            const existingTargetQuantity = targetItemRows[0].quantity;
            const targetCartItemId = targetItemRows[0].id;
            let newTargetQuantity = existingTargetQuantity + quantity;

            // Hedef 'shopping_cart' ise stok kontrolü
            if (targetListType === 'shopping_cart') {
                let stockQuantity;
                if (sourceItem.product_variant_id) {
                    const [variantRows] = await db.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [sourceItem.product_variant_id]);
                    stockQuantity = variantRows[0]?.stock_quantity;
                } else {
                    const [productRows] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [sourceItem.product_id]);
                    stockQuantity = productRows[0]?.stock_quantity;
                }
                
                if (newTargetQuantity > stockQuantity) {
                    return next(new BadRequestError(`Taşıma işlemiyle ${targetListType} listesindeki toplam miktar (${newTargetQuantity}) stoktan (${stockQuantity}) fazla olamaz.`));
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
                'INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition, product_variant_id) VALUES (?, ?, ?, ?, ?)',
                [targetListId, sourceItem.product_id, quantity, sourceItem.price_at_addition, sourceItem.product_variant_id]
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
