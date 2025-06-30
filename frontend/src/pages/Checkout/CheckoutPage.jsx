// src/pages/Checkout/CheckoutPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCart, clearCart, clearCartError } from '../../features/cart/cartSlice';
import { createOrder, clearOrderError, clearCurrentOrder } from '../../features/order/orderSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: cartItems, totalQuantity, totalPrice, loading: cartLoading, error: cartError } = useSelector((state) => state.cart);
  const { isAuthenticated, user, loading: authLoading } = useSelector((state) => state.auth); 
  const { currentOrder, loading: orderLoading, error: orderError } = useSelector((state) => state.orders);

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentDetailsConfirmed, setIsPaymentDetailsConfirmed] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
    return () => {
      dispatch(clearCartError());
      dispatch(clearOrderError());
      dispatch(clearCurrentOrder());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!authLoading && user && user.address && !shippingAddress) { 
      setShippingAddress(user.address);
    }
  }, [authLoading, user, shippingAddress]);

  useEffect(() => {
    if (currentOrder && currentOrder.id) {
      dispatch(clearCart());
      navigate(`/order-success/${currentOrder.id}`);
    }
  }, [currentOrder, dispatch, navigate]);

  useEffect(() => {
    // Ödeme yöntemi değiştiğinde onay kutusunu sıfırla
    setIsPaymentDetailsConfirmed(false); 
  }, [paymentMethod]);

  const handlePlaceOrder = async () => {
    if (authLoading) {
      alert('Kullanıcı bilgileriniz yükleniyor, lütfen bekleyin.');
      return;
    }
    
    if (!user) {
      alert('Sipariş vermek için giriş yapmalısınız.');
      navigate('/login');
      return;
    }
    
    if (cartItems.length === 0) {
      alert('Sepetiniz boş. Lütfen önce ürün ekleyin.');
      navigate('/products');
      return;
    }
    if (!shippingAddress.trim()) {
      alert('Lütfen gönderim adresinizi girin.');
      return;
    }

    if (paymentMethod === 'stripe' && !isPaymentDetailsConfirmed) {
      alert('Kredi kartı ile ödeme için kart bilgilerini onaylamanız gerekmektedir.');
      return;
    }

    setIsProcessingPayment(true);

    const orderItems = cartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price, 
      product_variant_id: item.product_variant_id || null,
    }));

    const orderData = {
      user_id: user.id,
      total_amount: totalPrice,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      order_items: orderItems,
    };

    try {
      await dispatch(createOrder(orderData)).unwrap();
    } catch (err) {
      alert(`Sipariş oluşturulurken bir hata oluştu: ${err}`);
      console.error('Sipariş oluşturma hatası:', err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (cartLoading || orderLoading || isProcessingPayment || authLoading) {
    return <LoadingSpinner message={isProcessingPayment ? "Ödeme İşleniyor..." : "Yükleniyor..."} />;
  }

  if (cartError) {
    return <div className="text-center py-8 text-red-500">Sepetiniz yüklenirken hata oluştu: {cartError}</div>;
  }

  if (orderError) {
    return <div className="text-center py-8 text-red-500">Sipariş oluşturulurken hata oluştu: {orderError}</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Sipariş vermek için lütfen giriş yapın.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Giriş Yap
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Sepetiniz boş. Ödeme yapabilmek için ürün eklemelisiniz.</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          Ürünlere göz atmak için tıklayın.
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 my-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Ödeme Sayfası</h1>

      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sol Taraf: Sipariş Özeti */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sipariş Özeti</h2>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-3">
                  <img src={item.image_url || 'https://placehold.co/50x50/cccccc/ffffff?text=Ürün'} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                  <div>
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    {item.variant_name && <p className="text-sm text-gray-500">{item.variant_name}</p>}
                    <p className="text-sm text-gray-600">{item.quantity} x {item.price} TL</p>
                  </div>
                </div>
                <p className="font-semibold text-green-700">{(item.quantity * item.price).toFixed(2)} TL</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-xl font-bold text-gray-800">Toplam Tutar:</p>
            <p className="text-2xl font-bold text-green-700">{totalPrice.toFixed(2)} TL</p>
          </div>
        </div>

        {/* Sağ Taraf: Gönderim ve Ödeme Bilgileri */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gönderim ve Ödeme</h2>

          {/* Gönderim Adresi */}
          <div className="mb-6">
            <Input
              label="Gönderim Adresi"
              id="shippingAddress"
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Tam adresinizi girin"
              required
            />
          </div>

          {/* Ödeme Yöntemi */}
          <div className="mb-6">
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Yöntemi:
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="cash_on_delivery">Kapıda Ödeme</option>
              <option value="stripe">Kredi Kartı (Stripe)</option>
            </select>
          </div>

          {/* Ödeme Bilgileri (Stripe için placeholder) */}
          {paymentMethod === 'stripe' && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Kredi Kartı Bilgileri</h3>
              <p className="text-sm text-gray-600 mb-3">
                Bu alanda gerçek bir ödeme entegrasyonu (örn. Stripe Elements) bulunacaktır.
                Şu an için ödeme işlemi simüle edilecektir.
              </p>
              {/* Kredi kartı alanlarından 'disabled' özelliği kaldırıldı */}
              <Input label="Kart Numarası" id="cardNumber" type="text" placeholder="XXXX XXXX XXXX XXXX" />
              <div className="flex space-x-4 mt-3">
                <Input label="Son Kullanma Tarihi" id="expiry" type="text" placeholder="AA/YY" className="w-1/2" />
                <Input label="CVC" id="cvc" type="text" placeholder="XXX" className="w-1/2" />
              </div>
              <div className="mt-4">
                <input
                  type="checkbox"
                  id="confirmPaymentDetails"
                  checked={isPaymentDetailsConfirmed}
                  onChange={(e) => setIsPaymentDetailsConfirmed(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="confirmPaymentDetails" className="text-sm text-gray-700">
                  Ödeme bilgilerini onaylıyorum (simülasyon).
                </label>
              </div>
            </div>
          )}

          <Button
            onClick={handlePlaceOrder}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
            // Butonun 'disabled' durumu güncellendi:
            // Sadece işlem devam ederken, sepet boşken, kimlik doğrulaması yüklenirken veya kullanıcı yokken pasif olur.
            // Stripe onay kutusu artık butonun pasifliğini doğrudan etkilemiyor.
            disabled={isProcessingPayment || cartItems.length === 0 || authLoading || !user}
          >
            {isProcessingPayment ? 'Sipariş İşleniyor...' : 'Siparişi Tamamla'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;