// src/services/notificationService.js
import api from './api'; // Genel Axios instance'ımızı import ediyoruz

const NOTIFICATION_API_URL = '/notifications'; // Backend'deki rotaya uygun

/**
 * Pazarlama e-postası gönderme (Admin tarafından).
 * @param {Object} emailData - E-posta gönderme verileri.
 * @param {string} emailData.subject - E-postanın konusu.
 * @param {string} emailData.messageHtml - E-postanın HTML içeriği.
 * @param {string} emailData.messageText - E-postanın düz metin içeriği.
 * @param {string|number[]} emailData.targetUsers - Hedef kullanıcılar ('all' veya kullanıcı ID'lerinin dizisi).
 */
const sendMarketingEmail = async (emailData) => {
  try {
    const response = await api.post(`${NOTIFICATION_API_URL}/marketing-email`, emailData);
    // Backend'den beklenen dönüş: { status: 'success', message: '...', data: { sentCount, failedCount } }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const notificationService = {
  sendMarketingEmail,
};

export default notificationService;
