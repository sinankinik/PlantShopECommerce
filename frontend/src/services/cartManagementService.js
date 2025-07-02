// src/services/cartManagementService.js
import api from './api'; // Genel Axios instance'ınızı import edin

const ADMIN_CARTS_API_BASE_URL = '/cart/admin'; // Backend'deki admin rotasının ana yolu

// Tüm kullanıcıların alışveriş sepetlerini listele (admin için)
const getAllUserShoppingCarts = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    // Yeni rotaya dikkat: /cart/admin/shopping-carts
    const response = await api.get(`${ADMIN_CARTS_API_BASE_URL}/shopping-carts?${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// Belirli bir kullanıcının alışveriş sepeti detaylarını getir (admin için)
const getUserShoppingCartDetails = async (userId) => {
  try {
    // Yeni rotaya dikkat: /cart/admin/shopping-carts/:userId
    const response = await api.get(`${ADMIN_CARTS_API_BASE_URL}/shopping-carts/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// Admin: Kullanıcının belirli bir türdeki sepetini boşalt
const clearUserSpecificCart = async (userId, listType = 'shopping_cart') => { // Varsayılan olarak shopping_cart
  try {
    // Yeni rotaya dikkat: /cart/admin/:listType/:userId/clear
    const response = await api.delete(`${ADMIN_CARTS_API_BASE_URL}/${listType}/${userId}/clear`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const cartManagementService = {
  getAllUserShoppingCarts,
  getUserShoppingCartDetails,
  clearUserSpecificCart,
};

export default cartManagementService;