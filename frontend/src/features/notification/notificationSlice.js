// src/features/notification/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

const initialState = {
  loading: false, // Yüklenme durumu
  error: null,    // Hata mesajı
  message: null,  // Başarılı işlem mesajı
  sentCount: 0,   // Gönderilen e-posta sayısı
  failedCount: 0, // Başarısız e-posta sayısı
};

// Async Thunk: Pazarlama e-postası gönderme
export const sendMarketingEmail = createAsyncThunk(
  'notification/sendMarketingEmail',
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await notificationService.sendMarketingEmail(emailData);
      // Backend yanıtı: { status, message, data: { sentCount, failedCount } }
      return response.data; // Sadece data kısmını döndürüyoruz
    } catch (error) {
      return rejectWithValue(error); // Hata mesajını rejectWithValue ile döndür
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    clearNotificationMessage: (state) => {
      state.message = null;
    },
    resetNotificationState: (state) => initialState, // State'i başlangıç durumuna döndürür
  },
  extraReducers: (builder) => {
    builder
      // sendMarketingEmail
      .addCase(sendMarketingEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
        state.sentCount = 0;
        state.failedCount = 0;
      })
      .addCase(sendMarketingEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message = `E-posta başarıyla gönderildi: ${action.payload.sentCount} başarılı, ${action.payload.failedCount} başarısız.`;
        state.sentCount = action.payload.sentCount;
        state.failedCount = action.payload.failedCount;
      })
      .addCase(sendMarketingEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'E-posta gönderilirken bir hata oluştu.';
      });
  },
});

export const {
  clearNotificationError,
  clearNotificationMessage,
  resetNotificationState
} = notificationSlice.actions;

export default notificationSlice.reducer;
