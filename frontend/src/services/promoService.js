// src/services/promoService.js
import api from './api';

const PROMOTIONS_API_URL = '/promotions';

// Tüm promosyonları getir (Backend'in sayfalama/filtreleme almadığını varsayarak params şimdilik pasif)
const getAllPromotions = async (params = {}) => {
  try {
    // Backend'inizde getAllPromotions'ın şu an için query parametrelerini işlemediğini görüyorum.
    // Eğer backend'e sayfalama/filtreleme eklerseniz bu satırı aktif edebilirsiniz:
    // const queryString = new URLSearchParams(params).toString();
    // const response = await api.get(`${PROMOTIONS_API_URL}?${queryString}`);
    const response = await api.get(PROMOTIONS_API_URL); // Şimdilik parametresiz çağırıyoruz

    return response.data; // Backend'iniz { status, results, data: { promotions: [...] } } dönüyor
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// Belirli bir promosyonu ID'ye göre getir
const getPromotionById = async (promotionId) => {
  try {
    const response = await api.get(`${PROMOTIONS_API_URL}/${promotionId}`);
    return response.data; // Backend'iniz { status, data: { promotion: {...} } } dönüyor
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// Yeni promosyon oluştur
const createPromotion = async (promotionData) => {
  try {
    // Backend'e gönderilecek veri, snake_case'e çevrildi
    const payload = {
      name: promotionData.name,
      description: promotionData.description,
      promotionType: promotionData.promotionType, // Frontend'de 'type' ise burada promotionType
      targetType: promotionData.targetType,
      targetId: promotionData.targetId || null,
      discountValue: promotionData.discountValue,
      minPurchaseAmount: promotionData.minPurchaseAmount || 0,
      maxDiscountAmount: promotionData.maxDiscountAmount || null,
      startDate: promotionData.startDate,
      endDate: promotionData.endDate,
      // isActive backend'de default olarak true olabilir veya burada gönderilebilir
      // isActive: promotionData.isActive,
    };
    const response = await api.post(PROMOTIONS_API_URL, payload);
    return response.data; // Backend'iniz { status, message, data: { promotionId: N } } dönüyor
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// Promosyon güncelle
const updatePromotion = async (promotionId, promotionData) => {
  try {
    // Backend'e gönderilecek veri, snake_case'e çevrildi ve sadece değişen alanlar gönderilmeli
    const payload = {
        name: promotionData.name,
        description: promotionData.description,
        promotionType: promotionData.promotionType,
        targetType: promotionData.targetType,
        targetId: promotionData.targetId || null,
        discountValue: promotionData.discountValue,
        minPurchaseAmount: promotionData.minPurchaseAmount,
        maxDiscountAmount: promotionData.maxDiscountAmount,
        startDate: promotionData.startDate,
        endDate: promotionData.endDate,
        isActive: promotionData.isActive, // Backend'inizde is_active var
    };
    const response = await api.patch(`${PROMOTIONS_API_URL}/${promotionId}`, payload);
    return response.data; // Backend'iniz { status, message, data: { promotionId: N } } dönüyor
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// Promosyon sil
const deletePromotion = async (promotionId) => {
  try {
    const response = await api.delete(`${PROMOTIONS_API_URL}/${promotionId}`);
    return response.data; // Backend'iniz { status, message, data: null } dönüyor
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const promoService = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};

export default promoService;