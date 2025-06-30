// src/pages/Order/OrderDetailPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderById, clearOrderError } from '../../features/order/orderSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

const OrderDetailPage = () => {
  const { id } = useParams(); // URL'den sipariş ID'sini al
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector((state) => state.orders);
  const { isAuthenticated, user, loading: authLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Kullanıcı kimlik doğrulanmışsa ve kullanıcı bilgileri yüklendiyse sipariş detaylarını çek
    if (isAuthenticated && user && !authLoading && id) {
      dispatch(fetchOrderById(id));
    }
    // Bileşen unmount edildiğinde veya hata oluştuğunda hataları temizle
    return () => {
      dispatch(clearOrderError());
    };
  }, [dispatch, id, isAuthenticated, user, authLoading]);

  // Kullanıcı yükleniyorsa veya kimlik doğrulanmamışsa
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Kullanıcı bilgileri yükleniyor..." />
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Sipariş detaylarını görüntülemek için lütfen giriş yapın.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Giriş Yap
        </Link>
      </div>
    );
  }

  // Sipariş yükleniyorsa
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Sipariş detayları yükleniyor..." />
      </div>
    );
  }

  // Hata oluştuysa veya sipariş bulunamadıysa
  if (error) {
    return <div className="text-center py-8 text-red-500">Sipariş detayları yüklenirken bir hata oluştu: {error}</div>;
  }

  if (!currentOrder) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Sipariş bulunamadı veya bu siparişi görüntüleme yetkiniz yok.</p>
        <Link to="/my-orders">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Siparişlerim Sayfasına Dön
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 my-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Sipariş Detayı</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sipariş Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Sipariş ID:</strong> {currentOrder.id}</p>
          <p><strong>Tarih:</strong> {new Date(currentOrder.order_date).toLocaleDateString('tr-TR')}</p>
          <p><strong>Toplam Tutar:</strong> <span className="font-bold text-green-700">{currentOrder.total_amount.toFixed(2)} TL</span></p>
          <p><strong>Durum:</strong> <span className={`font-semibold ${
            currentOrder.status === 'pending' ? 'text-yellow-600' :
            currentOrder.status === 'processing' ? 'text-blue-600' :
            currentOrder.status === 'shipped' ? 'text-indigo-600' :
            currentOrder.status === 'delivered' ? 'text-green-600' :
            'text-red-600'
          }`}>{currentOrder.status.toUpperCase()}</span></p>
          <p className="col-span-2"><strong>Gönderim Adresi:</strong> {currentOrder.shipping_address}</p>
          <p><strong>Ödeme Yöntemi:</strong> {currentOrder.payment_method === 'cash_on_delivery' ? 'Kapıda Ödeme' : 'Kredi Kartı (Stripe)'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sipariş Kalemleri</h2>
        <div className="space-y-4">
          {currentOrder.items && currentOrder.items.length > 0 ? (
            currentOrder.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <img src={item.product_image_url || 'https://placehold.co/50x50/cccccc/ffffff?text=Ürün'} alt={item.product_name} className="w-16 h-16 object-cover rounded-md" />
                  <div>
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    {item.variant_name && <p className="text-sm text-gray-500">Varyant: {item.variant_name}</p>}
                    <p className="text-sm text-gray-600">{item.quantity} x {item.price.toFixed(2)} TL</p>
                  </div>
                </div>
                <p className="font-semibold text-green-700">{(item.quantity * item.price).toFixed(2)} TL</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">Bu sipariş için ürün kalemi bulunmamaktadır.</p>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/my-orders">
          <Button className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
            Siparişlerim Listesine Geri Dön
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderDetailPage;