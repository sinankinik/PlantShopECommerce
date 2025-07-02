// src/features/order/orderManagementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // Axios instance'ınız veya API servisiniz

const initialState = {
    orders: [], // Tüm siparişler burada tutulacak
    currentOrder: null, // Detayları gösterilen sipariş
    pagination: {
        currentPage: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 0,
    },
    loading: false,
    error: null,
    message: null, // Başarılı işlem mesajları için
};

// Async Thunks
// Tüm siparişleri getirme (Admin için)
export const getAllOrders = createAsyncThunk(
    'orderManagement/getAllOrders',
    async (params = {}, { rejectWithValue }) => {
        try {
            // Backend API'nizin tüm siparişleri döndürdüğü endpoint'i kullanın.
            // Eğer backend'inizde /api/orders endpoint'i tüm siparişleri pagination ile döndürüyorsa:
            const queryString = new URLSearchParams(params).toString();
            const response = await api.get(`/orders?${queryString}`);
            
            // Backend yanıt yapınıza göre burayı ayarlayın.
            // Önceki konuşmalarımızda backend'inizin { data: { orders: [...], total: N } } gibi bir yapı döndürdüğünü varsaymıştık.
            // Eğer direkt dizi dönüyorsa veya başka bir yapıdaysa, burayı ona göre düzenleyin.
            return {
                items: response.data.data.orders, // Sipariş dizisi
                pagination: {
                    currentPage: params.page || 1,
                    limit: params.limit || 10,
                    totalPages: Math.ceil(response.data.total / (params.limit || 10)),
                    totalItems: response.data.total,
                },
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Belirli bir siparişi ID'ye göre getirme (Admin için detay görüntüleme)
export const fetchOrderById = createAsyncThunk(
    'orderManagement/fetchOrderById',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            // Backend yanıt yapınıza göre burayı ayarlayın.
            // Örneğin, { data: { order: {...} } } şeklinde geliyorsa:
            return response.data.data.order; 
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Sipariş güncelleme (Admin için)
export const updateOrder = createAsyncThunk(
    'orderManagement/updateOrder',
    async ({ orderId, orderData }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/orders/${orderId}`, orderData);
            // Backend yanıt yapınıza göre burayı ayarlayın.
            // Örneğin, { data: { order: {...} } } şeklinde geliyorsa:
            return response.data.data.order;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Sipariş durumu güncelleme (Admin için, özel bir endpoint varsa daha iyi)
// Eğer backend'de sadece status güncellemek için ayrı bir endpoint yoksa, yukarıdaki updateOrder'ı kullanabiliriz.
// Ancak, eğer varsa bu daha spesifik ve temiz olur.
export const updateOrderStatus = createAsyncThunk(
    'orderManagement/updateOrderStatus',
    async ({ orderId, status }, { rejectWithValue }) => {
        try {
            // Varsayım: Backend'de sadece durumu güncellemek için bir endpoint var.
            // Yoksa, yukarıdaki updateOrder'ı kullanın ve orderData olarak { status: status } gönderin.
            const response = await api.patch(`/orders/${orderId}/status`, { status });
            return response.data.data.order; // Güncellenmiş sipariş objesini döndür
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Sipariş silme (Admin için)
export const deleteOrder = createAsyncThunk(
    'orderManagement/deleteOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            await api.delete(`/orders/${orderId}`);
            return orderId; // Silinen siparişin ID'sini döndür
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


const orderManagementSlice = createSlice({
    name: 'orderManagement',
    initialState,
    reducers: {
        clearOrderManagementError: (state) => {
            state.error = null;
        },
        clearOrderManagementMessage: (state) => {
            state.message = null;
        },
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        // Sadece admin panelinde kullanılan sipariş listesini ve pagination'ı sıfırlamak için
        resetOrderManagementState: (state) => {
            state.orders = [];
            state.currentOrder = null;
            state.pagination = {
                currentPage: 1,
                limit: 10,
                totalPages: 1,
                totalItems: 0,
            };
            state.loading = false;
            state.error = null;
            state.message = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllOrders
            .addCase(getAllOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.items;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Siparişler getirilemedi.';
            })

            // fetchOrderById
            .addCase(fetchOrderById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentOrder = null; // Yeni sipariş çekilirken eskiyi temizle
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sipariş detayı getirilemedi.';
                state.currentOrder = null;
            })

            // updateOrder
            .addCase(updateOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(updateOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.message = 'Sipariş başarıyla güncellendi.';
                // Güncellenen siparişi listede de güncelle
                state.orders = state.orders.map((order) =>
                    order.id === action.payload.id ? action.payload : order
                );
                // Eğer güncel sipariş buysa, onu da güncelle
                if (state.currentOrder && state.currentOrder.id === action.payload.id) {
                    state.currentOrder = action.payload;
                }
            })
            .addCase(updateOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sipariş güncellenemedi.';
            })

            // updateOrderStatus (Eğer ayrı bir endpoint kullanılıyorsa)
            .addCase(updateOrderStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.message = 'Sipariş durumu başarıyla güncellendi.';
                state.orders = state.orders.map((order) =>
                    order.id === action.payload.id ? action.payload : order
                );
                if (state.currentOrder && state.currentOrder.id === action.payload.id) {
                    state.currentOrder = action.payload;
                }
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sipariş durumu güncellenemedi.';
            })

            // deleteOrder
            .addCase(deleteOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(deleteOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.message = 'Sipariş başarıyla silindi.';
                state.orders = state.orders.filter((order) => order.id !== action.payload);
                state.pagination.totalItems -= 1; // Toplam öğe sayısını azalt
                // Eğer silinen sipariş currentOrder ise onu da temizle
                if (state.currentOrder && state.currentOrder.id === action.payload) {
                    state.currentOrder = null;
                }
            })
            .addCase(deleteOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sipariş silinemedi.';
            });
    },
});

export const { 
    clearOrderManagementError, 
    clearOrderManagementMessage, 
    clearCurrentOrder,
    resetOrderManagementState
} = orderManagementSlice.actions;

export default orderManagementSlice.reducer;