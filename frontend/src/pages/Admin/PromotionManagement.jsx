// src/pages/Admin/PromotionManagement.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  clearPromotionError,
  clearPromotionMessage
} from '../../features/promotion/promotionSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';

const PromotionManagement = () => {
  const dispatch = useDispatch();
  const { items: promotions, loading, error, message, pagination } = useSelector((state) => state.promotions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null); // Düzenlenecek promosyon
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promotionType: 'percentage_discount', // Backend'e uygun olarak 'promotionType'
    targetType: 'all_products', // Backend'e uygun olarak 'targetType'
    targetId: '', // Kategori veya ürün ID'si
    discountValue: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    startDate: '',
    endDate: '',
    isActive: true, // Backend'de is_active
  });

  // Kategori ve ürün ID'lerini select box için getirme (isteğe bağlı)
  // Bu kısım için ek Redux slice'lara veya API çağrılarına ihtiyacınız olabilir.
  // Şimdilik sadece text input olarak bırakıyoruz.
  const [categories, setCategories] = useState([]); // Örnek
  const [products, setProducts] = useState([]); // Örnek

  useEffect(() => {
    dispatch(fetchPromotions({ page: pagination.currentPage, limit: pagination.limit }));
    // Kategori ve ürünleri çekmek için API çağrıları burada yapılabilir
    // dispatch(fetchCategories());
    // dispatch(fetchProducts({ limit: 9999 })); // Tüm ürünleri çekmek isteyebilirsiniz
  }, [dispatch, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPromotionError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearPromotionMessage());
      setIsModalOpen(false); // İşlem başarılıysa modalı kapat
    }
  }, [error, message, dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOpenModal = (promotion = null) => {
    setCurrentPromotion(promotion);
    if (promotion) {
      const formatAsDateInput = (dateString) => {
        if (!dateString) return '';
        // Backend'den gelen tarih formatı ISO String ise:
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        promotionType: promotion.promotionType || 'percentage_discount',
        targetType: promotion.targetType || 'all_products',
        targetId: promotion.targetId || '',
        discountValue: promotion.discountValue || 0,
        minPurchaseAmount: promotion.minPurchaseAmount || 0,
        maxDiscountAmount: promotion.maxDiscountAmount || null,
        startDate: formatAsDateInput(promotion.startDate),
        endDate: formatAsDateInput(promotion.endDate),
        isActive: promotion.isActive,
      });
    } else {
      setFormData({ // Yeni promosyon için varsayılan değerler
        name: '',
        description: '',
        promotionType: 'percentage_discount',
        targetType: 'all_products',
        targetId: '',
        discountValue: 0,
        minPurchaseAmount: 0,
        maxDiscountAmount: null,
        startDate: '',
        endDate: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPromotion(null);
    setFormData({
      name: '', description: '', promotionType: 'percentage_discount', targetType: 'all_products', targetId: '',
      discountValue: 0, minPurchaseAmount: 0, maxDiscountAmount: null, startDate: '', endDate: '', isActive: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // FormData'daki tarihleri ISO formatına çevirin
    const dataToSend = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        // targetId, eğer all_products ise null olmalı, aksi halde bir değer içermeli.
        // Backend validation'ına göre boş string yerine null gönderiyoruz.
        targetId: formData.targetType === 'all_products' ? null : formData.targetId,
        // discountValue, minPurchaseAmount, maxDiscountAmount değerlerini sayıya çevir
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount),
        maxDiscountAmount: formData.maxDiscountAmount !== null && formData.maxDiscountAmount !== '' ? parseFloat(formData.maxDiscountAmount) : null,
    };

    if (currentPromotion) {
      dispatch(updatePromotion({ promotionId: currentPromotion.id, promotionData: dataToSend }));
    } else {
      dispatch(createPromotion(dataToSend));
    }
  };

  const handleDelete = (promotionId) => {
    if (window.confirm('Bu promosyonu silmek istediğinizden emin misiniz?')) {
      dispatch(deletePromotion(promotionId));
    }
  };

  const handlePageChange = (newPage) => {
    // Backend'iniz sayfalama desteği vermediği için bu fonksiyon şu an bir işe yaramıyor.
    // Ancak ileride eklenirse hazır olur.
    dispatch(fetchPromotions({ page: newPage, limit: pagination.limit }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Promosyon Yönetimi</h1>

      <button
        onClick={() => handleOpenModal()}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center transition duration-300"
      >
        <FaPlus className="mr-2" /> Yeni Promosyon Ekle
      </button>

      {loading && (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner /> <span className="ml-2">Promosyonlar yükleniyor...</span>
        </div>
      )}

      {promotions.length === 0 && !loading && (
        <p className="text-gray-600 text-center py-8">Henüz hiç promosyon bulunmuyor.</p>
      )}

      {promotions.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hedef Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Değer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlangıç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bitiş</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promo.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.promotionType === 'percentage_discount' ? 'Yüzde İndirim' :
                     promo.promotionType === 'fixed_amount_discount' ? 'Sabit Tutar İndirim' : 'Ücretsiz Kargo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.targetType === 'all_products' ? 'Tüm Ürünler' :
                     promo.targetType === 'category' ? `Kategori (${promo.targetId})` : `Ürün (${promo.targetId})`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.promotionType === 'percentage_discount' ? `${promo.discountValue}%` :
                     promo.promotionType === 'fixed_amount_discount' ? `₺${promo.discountValue?.toFixed(2)}` : 'Yok'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.startDate ? new Date(promo.startDate).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promo.endDate ? new Date(promo.endDate).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {promo.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Pasif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(promo)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:text-red-900"
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
      {/* Backend'inizde sayfalama henüz olmadığı için bu kısım şu an çalışmayacaktır,
          ancak backend'e eklendiğinde hazır olacak */}
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

      {/* Promosyon Ekle/Düzenle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {currentPromotion ? 'Promosyonu Düzenle' : 'Yeni Promosyon Ekle'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Promosyon Adı:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Açıklama:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="promotionType" className="block text-gray-700 text-sm font-bold mb-2">Promosyon Tipi:</label>
                <select
                  id="promotionType"
                  name="promotionType"
                  value={formData.promotionType}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="percentage_discount">Yüzde İndirim</option>
                  <option value="fixed_amount_discount">Sabit Tutar İndirim</option>
                  <option value="free_shipping">Ücretsiz Kargo</option>
                </select>
              </div>
              {/* İndirim Tipi 'free_shipping' değilse discountValue'yi göster */}
              {formData.promotionType !== 'free_shipping' && (
                <div className="mb-4">
                  <label htmlFor="discountValue" className="block text-gray-700 text-sm font-bold mb-2">İndirim Değeri ({formData.promotionType === 'percentage_discount' ? '%' : '₺'}):</label>
                  <input
                    type="number"
                    id="discountValue"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                    step={formData.promotionType === 'percentage_discount' ? "1" : "0.01"}
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="targetType" className="block text-gray-700 text-sm font-bold mb-2">Hedef Tipi:</label>
                <select
                  id="targetType"
                  name="targetType"
                  value={formData.targetType}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="all_products">Tüm Ürünler</option>
                  <option value="category">Kategori</option>
                  <option value="product">Ürün</option>
                </select>
              </div>
              {formData.targetType !== 'all_products' && (
                <div className="mb-4">
                  <label htmlFor="targetId" className="block text-gray-700 text-sm font-bold mb-2">Hedef ID (Kategori/Ürün ID):</label>
                  {/* Buraya dinamik olarak kategori/ürün seçimi eklenebilir */}
                  <input
                    type="text"
                    id="targetId"
                    name="targetId"
                    value={formData.targetId}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Kategori veya Ürün ID'si"
                    required={formData.targetType !== 'all_products'}
                  />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="minPurchaseAmount" className="block text-gray-700 text-sm font-bold mb-2">Minimum Alışveriş Tutarı:</label>
                <input
                  type="number"
                  id="minPurchaseAmount"
                  name="minPurchaseAmount"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="maxDiscountAmount" className="block text-gray-700 text-sm font-bold mb-2">Maksimum İndirim Tutarı (Opsiyonel):</label>
                <input
                  type="number"
                  id="maxDiscountAmount"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount || ''} // Null ise boş göster
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Başlangıç Tarihi:</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">Bitiş Tarihi:</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2 leading-tight"
                />
                <label htmlFor="isActive" className="text-gray-700 text-sm font-bold">Aktif</label>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
                  {currentPromotion ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;