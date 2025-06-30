// src/pages/Cart/CartPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItemQuantity, removeCartItem, clearCart, clearCartError } from '../../features/cart/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: cartItems, totalQuantity, totalPrice, loading, error } = useSelector((state) => state.cart);

  useEffect(() => {
    // Sayfa yüklendiğinde sepet içeriğini getir
    dispatch(fetchCart());
    // Component unmount edildiğinde veya yeni bir sepet çekme isteği gönderilmeden önce hataları temizle
    return () => {
      dispatch(clearCartError());
    };
  }, [dispatch]);

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      // Miktar 1'den az olamaz, eğer 0'a düşerse ürünü kaldır
      if (window.confirm('Bu ürünü sepetten kaldırmak istediğinizden emin misiniz?')) {
        dispatch(removeCartItem(cartItemId));
      }
      return;
    }
    dispatch(updateCartItemQuantity({ cartItemId, quantity: newQuantity }));
  };

  const handleRemoveItem = (cartItemId) => {
    if (window.confirm('Bu ürünü sepetten kaldırmak istediğinizden emin misiniz?')) { // Basit onay
      dispatch(removeCartItem(cartItemId));
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Sepetinizin tamamını boşaltmak istediğinizden emin misiniz?')) { // Basit onay
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    navigate('/checkout'); // Ödeme sayfasına yönlendir (daha sonra oluşturacağız)
  };

  if (loading && cartItems.length === 0) {
    return <div className="text-center py-8">Sepet yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Sepet içeriği yüklenirken hata oluştu: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 my-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Sepetim</h1>

      {cartItems.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p className="text-lg text-gray-600 mb-4">Sepetinizde ürün bulunmamaktadır.</p>
          <Link to="/products" className="text-blue-600 hover:underline">
            Ürünlere göz atmak için tıklayın.
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <Link to={`/products/${item.product_id}`}>
                    <img
                      src={item.image_url || 'https://via.placeholder.com/80x80/cccccc/ffffff?text=Ürün'} // Sepet öğesi görseli
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </Link>
                  <div className="flex-grow">
                    <Link to={`/products/${item.product_id}`} className="block text-lg font-semibold text-gray-800 hover:text-blue-600">
                      {item.product_name}
                    </Link>
                    {item.variant_name && <p className="text-sm text-gray-500">{item.variant_name}</p>} {/* Varyant adı varsa göster */}
                    <p className="text-md font-bold text-green-700">{item.price} TL</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded-l-md"
                      disabled={loading}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center border-x border-gray-300 focus:outline-none"
                      min="1"
                      disabled={loading}
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded-r-md"
                      disabled={loading}
                    >
                      +
                    </button>
                  </div>
                  <Button
                    onClick={() => handleRemoveItem(item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                    disabled={loading}
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">Toplam Tutar: {totalPrice.toFixed(2)} TL</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                onClick={handleClearCart}
                className="bg-gray-500 hover:bg-gray-600 text-white w-full sm:w-auto"
                disabled={loading}
              >
                Sepeti Boşalt
              </Button>
              <Button
                onClick={handleCheckout}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                disabled={loading}
              >
                Ödeme Sayfasına Git
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
