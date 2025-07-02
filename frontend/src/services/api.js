// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; // <-- BURAYI KONTROL EDİN


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İsteklerden önce token eklemek ve loglamak için bir interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('FRONTEND API Request Hatası:', error); // LOG EKLENDİ
    return Promise.reject(error);
  }
);

// Yanıtlardan sonra hata yönetimi ve loglama için bir interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('FRONTEND API Unauthorized, please log in again.'); // LOG EKLENDİ
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    } else {
      console.error('FRONTEND API Response Hatası:', error.response?.status, error.response?.data || error.message); // LOG EKLENDİ
    }
    return Promise.reject(error);
  }
);

export default api;