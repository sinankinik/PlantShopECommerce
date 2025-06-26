// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // Backend API'nizin temel URL'si
  headers: {
    'Content-Type': 'application/json',
  },
});

// İsteklerden önce token eklemek için bir interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Token'ı localStorage'dan çekiyoruz
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıtlardan sonra hata yönetimi için bir interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Örneğin, 401 Unauthorized hatasında kullanıcıyı çıkış yapmaya yönlendirebiliriz
    if (error.response && error.response.status === 401) {
      // localStorage.removeItem('token');
      // window.location.href = '/login'; // Giriş sayfasına yönlendir
      console.error('Unauthorized, please log in again.');
    }
    return Promise.reject(error);
  }
);

export default api;