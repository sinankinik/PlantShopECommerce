// frontend/src/pages/Admin/ReviewManagementPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchAllReviews,
  deleteReview,
  clearReviewsManagementError,
  clearReviewsManagementSuccess,
} from '../../features/review/reviewsManagementSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination'; // Varsayılan bir Pagination bileşeni varsayıyoruz
import ConfirmationModal from '../../components/common/ConfirmationModal'; // Varsayılan bir ConfirmationModal bileşeni varsayıyoruz
import { FaTrashAlt, FaSearch, FaSortAmountDown, FaSortAmountUpAlt } from 'react-icons/fa';

const ReviewManagementPage = () => {
  const dispatch = useDispatch();
  const { reviews, loading, error, successMessage, pagination } = useSelector(
    (state) => state.reviewsManagement
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDeleteId, setReviewToDeleteId] = useState(null);

  // Yorumları getir
  useEffect(() => {
    dispatch(fetchAllReviews({ 
      page: currentPage, 
      limit, 
      search: searchQuery, 
      sortBy, 
      sortOrder 
    }));
  }, [dispatch, currentPage, limit, searchQuery, sortBy, sortOrder]);

  // Hata ve başarı mesajlarını yönet
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearReviewsManagementError());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearReviewsManagementSuccess());
    }
  }, [error, successMessage, dispatch]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setCurrentPage(1); // Limit değişince ilk sayfaya dön
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Arama değişince ilk sayfaya dön
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Varsayılan olarak azalan sıralama
    }
    setCurrentPage(1); // Sıralama değişince ilk sayfaya dön
  };

  const confirmDelete = (reviewId) => {
    setReviewToDeleteId(reviewId);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (reviewToDeleteId) {
      dispatch(deleteReview(reviewToDeleteId)).then(() => {
        // Silme işlemi sonrası güncel listeyi çek
        dispatch(fetchAllReviews({ 
          page: currentPage, 
          limit, 
          search: searchQuery, 
          sortBy, 
          sortOrder 
        }));
      });
      setShowDeleteModal(false);
      setReviewToDeleteId(null);
    }
  };

  const getSortIcon = (column) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? <FaSortAmountUpAlt className="ml-1" /> : <FaSortAmountDown className="ml-1" />;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Yorum Yönetimi</h1>

      {/* Filtreleme ve Arama */}
      <div className="mb-6 flex flex-wrap items-center space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Yorum, kullanıcı veya ürün ara..."
            className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={limit}
          onChange={handleLimitChange}
          className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="5">5 Göster</option>
          <option value="10">10 Göster</option>
          <option value="20">20 Göster</option>
          <option value="50">50 Göster</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <p className="text-center text-gray-600">Henüz hiç yorum bulunmamaktadır.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('id')}
                  >
                    ID {getSortIcon('id')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('rating')}
                  >
                    Derecelendirme {getSortIcon('rating')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yorum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('created_at')}
                  >
                    Oluşturulma Tarihi {getSortIcon('created_at')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{review.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{review.rating} ⭐</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis">
                      {review.comment || 'Yorum Yok'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.user?.username} ({review.user?.email})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.product?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => confirmDelete(review.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-full hover:bg-red-100"
                        title="Yorumu Sil"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Silme Onay Modalı */}
      {showDeleteModal && (
        <ConfirmationModal
          message="Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default ReviewManagementPage;
