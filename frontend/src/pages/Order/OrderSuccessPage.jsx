// src/pages/Order/OrderSuccessPage.jsx
import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, clearCurrentOrder, clearOrderError } from '../../features/order/orderSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
    return () => {
      dispatch(clearCurrentOrder());
      dispatch(clearOrderError());
    };
  }, [orderId, dispatch]);

  if (loading) {
    return <LoadingSpinner message="Sipariş detayları yükleniyor..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Sipariş Yüklenirken Hata!</h1>
        <p className="text-lg text-gray-600 mb-4">{error}</p>
        <Link to="/orders">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Siparişlerim Sayfasına Git</Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Sipariş Bulunamadı</h1>
        <p className="text-lg text-gray-600 mb-4">Belirtilen sipariş ID'sine sahip bir sipariş bulunamadı.</p>
        <Link to="/orders">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Siparişlerim Sayfasına Git</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 my-8">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <svg className="mx-auto h-24 w-24 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-4xl font-bold text-green-700 mt-4 mb-2">Siparişiniz Alındı!</h1>
        <p className="text-lg text-gray-700 mb-6">Siparişiniz başarıyla oluşturuldu. Teşekkür ederiz!</p>

        <div className="mb-6 text-left inline-block">
          <p className="text-md text-gray-800 mb-1"><strong>Sipariş ID:</strong> {order.id}</p>
          <p className="text-md text-gray-800 mb-1"><strong>Sipariş Tarihi:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
          <p className="text-md text-gray-800 mb-1"><strong>Toplam Tutar:</strong> {order.total_amount?.toFixed(2)} TL</p>
          <p className="text-md text-gray-800 mb-1"><strong>Gönderim Adresi:</strong> {order.shipping_address}</p>
          <p className="text-md text-gray-800 mb-1"><strong>Ödeme Yöntemi:</strong> {order.payment_method === 'cash_on_delivery' ? 'Kapıda Ödeme' : 'Kredi Kartı'}</p>
          <p className="text-md text-gray-800 mb-1"><strong>Sipariş Durumu:</strong> <span className="capitalize">{order.status}</span></p>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sipariş Detayları</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Ürün Adı</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Miktar</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Birim Fiyat</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-2 px-4 text-gray-700">{item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</td>
                  <td className="py-2 px-4 text-gray-700">{item.quantity}</td>
                  <td className="py-2 px-4 text-gray-700">{item.price?.toFixed(2)} TL</td>
                  <td className="py-2 px-4 text-gray-700">{(item.quantity * item.price)?.toFixed(2)} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link to="/orders">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">Siparişlerimi Görüntüle</Button>
          </Link>
          <Link to="/products">
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">Alışverişe Devam Et</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;