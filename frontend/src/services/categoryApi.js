// src/services/categoryApi.js

import api from './api'; // Ana Axios instance'ınızı import edin

// Tüm kategorileri getir (public)
export const getCategories = async () => {
    try {
        const response = await api.get('/categories');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

// Belirli bir kategoriyi ID'ye göre getir (public)
export const getCategory = async (id) => {
    try {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

// Yeni kategori oluştur (admin)
export const createCategory = async (categoryData) => {
    try {
        // Auth middleware admin rolü gerektirdiği için, istek kimlik doğrulama tokenı ile gönderilmeli.
        // api.js dosyanız zaten bu token'ı (cookie veya header'dan) ekliyor olmalı.
        const response = await api.post('/categories', categoryData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

// Kategoriyi güncelle (admin)
export const updateCategory = async (id, categoryData) => {
    try {
        const response = await api.patch(`/categories/${id}`, categoryData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

// Kategoriyi sil (admin)
export const deleteCategory = async (id) => {
    try {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};