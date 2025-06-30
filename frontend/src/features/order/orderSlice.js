// src/features/order/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  orders: [], // Kullanıcının tüm siparişleri için
  currentOrder: null, // Detayları görüntülenen tek bir sipariş için
  loading: false,
  error: null,
  message: null,
};

// Sipariş oluşturma (mevcut)
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Kullanıcının tüm siparişlerini getirme (mevcut)
export const getUserOrders = createAsyncThunk(
  'order/getUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/my-orders'); // Backend'deki rotanıza göre ayarlayın
      return response.data.data.orders;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Belirli bir siparişi ID ile getirme (mevcut)
export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Sipariş durumunu güncelleme (Admin için, ancak burada da tanımlı olabilir)
export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      return { orderId, newStatus: status, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrders: (state) => { // Tüm siparişleri temizlemek için (örn: logout sonrası)
      state.orders = [];
      state.currentOrder = null;
      state.loading = false;
      state.error = null;
      state.message = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload; // Oluşturulan siparişi currentOrder'a ata
        state.message = 'Sipariş başarıyla oluşturuldu!';
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sipariş oluşturulurken hata oluştu.';
      })

      // getUserOrders
      .addCase(getUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload; // Kullanıcının siparişlerini ata
      })
      .addCase(getUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Siparişler getirilirken hata oluştu.';
      })

      // fetchOrderById
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentOrder = null; // Yeni sipariş çekilirken eskiyi temizle
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload; // Belirli siparişi currentOrder'a ata
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sipariş detayları getirilirken hata oluştu.';
        state.currentOrder = null; // Hata durumunda currentOrder'ı temizle
      })

      // updateOrderStatus (Admin için)
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Sipariş durumu güncellendi!';
        // Eğer güncellenen sipariş mevcut listedeyse, onu da güncelle
        const index = state.orders.findIndex(order => order.id === action.payload.orderId);
        if (index !== -1) {
          state.orders[index].status = action.payload.newStatus;
        }
        // Eğer güncellenen sipariş currentOrder ise onu da güncelle
        if (state.currentOrder && state.currentOrder.id === action.payload.orderId) {
          state.currentOrder.status = action.payload.newStatus;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sipariş durumu güncellenirken hata oluştu.';
      });
  },
});

export const { clearOrderError, clearCurrentOrder, clearOrders } = orderSlice.actions;
export default orderSlice.reducer;
