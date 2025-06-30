// src/pages/User/OrdersPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getUserOrders, clearOrderError } from '../../features/order/orderSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { isAuthenticated, user, loading: authLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Kullanıcı kimlik doğrulanmışsa ve kullanıcı bilgileri yüklendiyse siparişleri çek
    if (isAuthenticated && user && !authLoading) {
      dispatch(getUserOrders());
    }
    // Bileşen unmount edildiğinde veya hata oluştuğunda hataları temizle
    return () => {
      dispatch(clearOrderError());
    };
  }, [dispatch, isAuthenticated, user, authLoading]);

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
        <p className="text-lg text-gray-600 mb-4">Siparişlerinizi görüntülemek için lütfen giriş yapın.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Giriş Yap
        </Link>
      </div>
    );
  }

  // Siparişler yükleniyorsa
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Siparişleriniz yükleniyor..." />
      </div>
    );
  }

  // Hata oluştuysa
  if (error) {
    return <div className="text-center py-8 text-red-500">Siparişleriniz yüklenirken bir hata oluştu: {error}</div>;
  }

  // Sipariş yoksa
  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Henüz hiç siparişiniz bulunmamaktadır.</p>
        <Link to="/products">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Ürünlere Göz Atın
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 my-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Siparişlerim</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {orders.map((order) => (
          <div key={order.id} className="border-b border-gray-200 last:border-b-0 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
              <div className="mb-2 md:mb-0">
                <p className="text-lg font-semibold text-gray-800">Sipariş ID: {order.id}</p>
                <p className="text-sm text-gray-600">Tarih: {new Date(order.order_date).toLocaleDateString('tr-TR')}</p>
                <p className="text-sm text-gray-600">Durum: <span className={`font-medium ${
                  order.status === 'pending' ? 'text-yellow-600' :
                  order.status === 'processing' ? 'text-blue-600' :
                  order.status === 'shipped' ? 'text-indigo-600' :
                  order.status === 'delivered' ? 'text-green-600' :
                  'text-red-600'
                }`}>{order.status.toUpperCase()}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-700">Toplam: {order.total_amount.toFixed(2)} TL</p>
                <Link to={`/my-orders/${order.id}`}>
                  <Button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm">
                    Detayları Görüntüle
                  </Button>
                </Link>
              </div>
            </div>
            {/* Sipariş kalemlerinin kısa bir özeti de burada gösterilebilir */}
            <div className="mt-2 text-sm text-gray-700">
              <p className="font-semibold">Ürünler:</p>
              <ul className="list-disc list-inside ml-4">
                {order.items && order.items.slice(0, 2).map((item, index) => ( // İlk 2 ürünü göster
                  <li key={item.id || index}>{item.product_name} ({item.quantity} adet)</li>
                ))}
                {order.items && order.items.length > 2 && (
                  <li>...ve {order.items.length - 2} ürün daha</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;