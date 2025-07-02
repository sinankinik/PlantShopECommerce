// src/services/reviewService.js
import api from './api'; // Axios instance'ımızı import ediyoruz

const REVIEWS_API_URL = '/reviews';

// Tüm yorumları getirme (Admin için)
const getAllReviews = async (token, params) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params, // Sayfalama, sıralama, arama parametreleri için
  };
  const response = await api.get(REVIEWS_API_URL, config);
  // Backend'den beklenen: { status, results, data: { reviews: [...], pagination: {...} } }
  return response.data;
};

// Yorum silme (Admin için herhangi bir yorumu, kullanıcı için kendi yorumunu)
const deleteReview = async (reviewId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.delete(`${REVIEWS_API_URL}/${reviewId}`, config);
  // Backend'den beklenen: { status, message }
  return response.data;
};

// Mevcut `createOrUpdateReview` ve `getProductReviews` metodlarını da ekleyebilirsiniz
// (Eğer bu servis dosyanızda daha önce tanımlamadıysanız)
const createOrUpdateReview = async (productId, reviewData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(`${REVIEWS_API_URL}/products/${productId}`, reviewData, config);
  return response.data;
};

const getProductReviews = async (productId) => {
  const response = await api.get(`${REVIEWS_API_URL}/products/${productId}`);
  return response.data;
};


const reviewService = {
  getAllReviews,
  deleteReview,
  createOrUpdateReview, // Mevcut
  getProductReviews,    // Mevcut
};

export default reviewService;
