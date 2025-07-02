// src/pages/Admin/CartManagement.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllUserShoppingCarts, // Yeni thunk adı
  fetchUserShoppingCartDetails, // Yeni thunk adı
  clearUserCart, // Yeni thunk adı
  clearCartManagementError,
  clearCartManagementMessage,
  clearSelectedCart,
} from '../../features/cart/cartManagementSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaEye, FaTrash, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';

const CartManagement = () => {
  const dispatch = useDispatch();
  const { carts, selectedCart, loading, error, message, pagination } = useSelector((state) => state.cartManagement);

  const [searchQuery, setSearchQuery] = useState(''); // userName için
  const [filterUserId, setFilterUserId] = useState(''); // userId için
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Sayfalama, filtreleme ve arama için useEffect
  useEffect(() => {
    dispatch(fetchAllUserShoppingCarts({
      page: pagination.currentPage,
      limit: pagination.limit,
      userId: filterUserId || undefined, // Boş string ise gönderme
      userName: searchQuery || undefined, // Boş string ise gönderme
    }));
  }, [dispatch, pagination.currentPage, pagination.limit, filterUserId, searchQuery]);

  // Hata ve mesaj bildirimleri için useEffect
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCartManagementError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearCartManagementMessage());
    }
  }, [error, message, dispatch]);

  const handlePageChange = (newPage) => {
    dispatch(fetchAllUserShoppingCarts({
      page: newPage,
      limit: pagination.limit,
      userId: filterUserId || undefined,
      userName: searchQuery || undefined,
    }));
  };

  const handleViewDetails = (userId) => {
    dispatch(fetchUserShoppingCartDetails(userId));
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    dispatch(clearSelectedCart());
  };

  const handleClearCart = (userId) => {
    if (window.confirm(`Kullanıcı ${userId}'nin ALIŞVERİŞ SEPETİNİ boşaltmak istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      dispatch(clearUserCart({ userId, listType: 'shopping_cart' })); // Sadece shopping_cart'ı boşalt
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sepet Yönetimi (Alışveriş Sepetleri)</h1>

      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Kullanıcı Adına Göre Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Kullanıcı ID'sine Göre Ara..."
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner /> <span className="ml-2">Sepetler yükleniyor...</span>
        </div>
      )}

      {carts.length === 0 && !loading && (
        <p className="text-gray-600 text-center py-8">Henüz hiç kullanıcı alışveriş sepeti bulunmuyor.</p>
      )}

      {carts.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Ürün</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Güncelleme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {carts.map((cart) => (
                <tr key={cart.userId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cart.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cart.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cart.totalItems}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₺{parseFloat(cart.totalAmount).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cart.lastUpdated ? new Date(cart.lastUpdated).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(cart.userId)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Sepet Detaylarını Görüntüle"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleClearCart(cart.userId)}
                      className="text-red-600 hover:text-red-900"
                      title="Sepeti Boşalt"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || loading}
            className="px-4 py-2 border rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Önceki
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={pagination.currentPage === page || loading}
              className={`px-4 py-2 border rounded-md ${
                pagination.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || loading}
            className="px-4 py-2 border rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}

      {/* Sepet Detayları Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative">
            <button
              onClick={handleCloseDetailModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
              title="Kapat"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Kullanıcı Sepet Detayları: {selectedCart?.userId}
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-4">
                <LoadingSpinner /> <span className="ml-2">Sepet detayları yükleniyor...</span>
              </div>
            ) : selectedCart ? (
              <div>
                <p className="mb-4">
                  **Toplam Tutar:** <span className="font-semibold text-lg text-blue-700">₺{selectedCart.totalAmount}</span>
                </p>
                <h3 className="text-xl font-semibold mb-3">Ürünler:</h3>
                {selectedCart.items.length === 0 ? (
                  <p className="text-gray-600">Bu sepet boş.</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Adı</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Varyant</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eklendiği Fiyat</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Güncel Fiyat</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stokta Mevcut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedCart.items.map((item) => (
                          <tr key={item.productId + (item.productVariantId || '')}> {/* Varyant ID'sini de anahtara ekledik */}
                            <td className="px-4 py-2 whitespace-nowrap">
                                {item.productImage && (
                                    <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded-md" />
                                )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.variantName || 'Yok'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">₺{item.priceAtAddition.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">₺{item.currentPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.productStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Sepet detayları bulunamadı veya bir hata oluştu.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartManagement;