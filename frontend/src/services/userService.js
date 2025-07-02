// src/services/userService.js
import api from './api'; // src/utils/api.js dosyanızı import edin

const API_URL = '/users'; // Kullanıcı API'lerinin başlangıç yolu

// Tüm kullanıcıları getir (admin endpoint'i)
const fetchAllUsers = async (token, params = {}) => {
    // URLSearchParams ile query parametrelerini ekleyelim (search, page, limit vb.)
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;

    const response = await api.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data; // Backend'den gelen veri
};

// Belirli bir kullanıcıyı getir (admin endpoint'i)
const fetchUserById = async (userId, token) => {
    const response = await api.get(`${API_URL}/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

// Kullanıcı güncelle (admin endpoint'i)
const updateUser = async (userId, userData, token) => {
    const response = await api.patch(`${API_URL}/${userId}`, userData, { // Backend'de PATCH kullandığınız için burada da PATCH kullandım
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

// Kullanıcı sil (admin endpoint'i - mantıksal silme)
const deleteUser = async (userId, token) => {
    const response = await api.delete(`${API_URL}/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data; // Genellikle silme işleminde bir onay mesajı veya boş data döner
};

const userService = {
    fetchAllUsers,
    fetchUserById,
    updateUser,
    deleteUser,
};

export default userService;