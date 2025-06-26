// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // Daha önce oluşturduğumuz API istemcisi

// Asenkron Thunk'lar: Backend API çağrılarını yönetecek
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data; // Başarılı kayıt durumunda dönecek veri
    } catch (error) {
      // API'den gelen hata mesajını yakala ve Redux state'ine ilet
      return rejectWithValue(error.response.data.message || 'Kayıt olurken bir hata oluştu.');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', response.data.token);
      // Kullanıcı bilgilerini de kaydetmek isteyebiliriz
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data; // Token ve kullanıcı bilgileri
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Giriş yaparken bir hata oluştu.');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Backend'de logout endpoint'i varsa çağır
      // await api.post('/auth/logout'); // Eğer varsa
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true; // Başarılı çıkış
    } catch (error) {
      // Token zaten yoksa bile başarılı sayılabilir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(error.response.data.message || 'Çıkış yaparken bir hata oluştu.');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu.');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { newPassword });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Şifre sıfırlanırken bir hata oluştu.');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'E-posta doğrulanırken bir hata oluştu.');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Profil bilgileri çekilirken hata oluştu.');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Profil güncellenirken hata oluştu.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null, // Kullanıcı bilgileri
    token: localStorage.getItem('token') || null, // Oturum token'ı
    isAuthenticated: !!localStorage.getItem('token'), // Token varsa oturum açık say
    loading: false,
    error: null,
    message: null, // Başarı mesajları için
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearAuthMessage: (state) => {
      state.message = null;
    },
    // Eğer token'ı manuel olarak set etmemiz gerekirse
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Kayıt başarılı! Lütfen e-postanızı doğrulayın.';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.message = action.payload.message || 'Giriş başarılı!';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.message = 'Başarıyla çıkış yapıldı.';
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User Profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // Backend'den gelen güncel kullanıcı bilgisi
        localStorage.setItem('user', JSON.stringify(action.payload)); // LocalStorage'ı da güncelle
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // Güncellenmiş kullanıcı bilgisi
        state.message = 'Profil başarıyla güncellendi!';
        localStorage.setItem('user', JSON.stringify(action.payload)); // LocalStorage'ı da güncelle
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAuthError, clearAuthMessage, setToken } = authSlice.actions;
export default authSlice.reducer;