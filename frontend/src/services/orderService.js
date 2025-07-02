// src/services/orderService.js
import api from './api'; // Daha önce oluşturduğumuz axios instance'ı

const ORDER_API_URL = '/orders'; // Backend'deki "/api/orders" rotası için

// Kullanıcının kendi siparişlerini getir (Normal kullanıcı ve Admin de kendi siparişlerini görebilir)
const getUserOrders = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${ORDER_API_URL}/my-orders?${queryString}` : `${ORDER_API_URL}/my-orders`;
    const response = await api.get(url);
    // Backend yanıtı: { status: 'success', results: N, total: M, data: { orders: [...] } }
    return response.data;
};

// Tüm siparişleri getir (Sadece Admin için)
const getAllOrders = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${ORDER_API_URL}?${queryString}` : ORDER_API_URL;
    const response = await api.get(url);
    // Backend yanıtı: { status: 'success', results: N, total: M, data: { orders: [...] } }
    return response.data;
};

// Belirli bir siparişi ID ile getir (Kullanıcı veya Admin için)
const getOrderById = async (orderId) => {
    const response = await api.get(`${ORDER_API_URL}/${orderId}`);
    // Backend yanıtı: { status: 'success', data: { order: {...} } }
    return response.data;
};

// Yeni sipariş oluştur (Kullanıcı tarafı için)
const createOrder = async (orderData) => {
    const response = await api.post(ORDER_API_URL, orderData);
    // Backend yanıtı: { status: 'success', message: '...', data: { order: {...} } }
    return response.data;
};

// Sipariş durumunu güncelle (Admin için)
const updateOrderStatus = async (orderId, status) => {
    const response = await api.patch(`${ORDER_API_URL}/${orderId}/status`, { status });
    // Backend yanıtı: { status: 'success', message: '...', data: { orderId: N, newStatus: '...' } }
    return response.data;
};

// Sipariş bilgilerini genel olarak güncelle (Admin için)
const updateOrder = async (orderId, orderData) => {
    const response = await api.patch(`${ORDER_API_URL}/${orderId}`, orderData);
    // Backend yanıtı: { status: 'success', message: '...', data: { orderId: N } }
    return response.data;
};

// Sipariş silme (Sadece Admin için, dikkatli kullanılmalı)
const deleteOrder = async (orderId) => {
    const response = await api.delete(`${ORDER_API_URL}/${orderId}`);
    // Backend yanıtı: { status: 'success', data: null, message: '...' } (204 No Content dönebilir)
    return response.data;
};

const orderService = {
    getUserOrders,
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
};

export default orderService;