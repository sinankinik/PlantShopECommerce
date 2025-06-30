// src/features/auth/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// localStorage'dan kullanıcı verisini güvenli bir şekilde parse etmek için yardımcı fonksiyon
const getParsedUserFromLocalStorage = () => {
  try {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      const parsedUser = JSON.parse(user);
      return { user: parsedUser, token: token };
    }
  } catch (error) {
    console.error("localStorage'dan kullanıcı verisi parse edilirken hata:", error);
    localStorage.removeItem('user'); // Hata durumunda bozuk veriyi temizle
    localStorage.removeItem('token');
  }
  return { user: null, token: null };
};

// Slice'ın başlangıç durumu, localStorage'dan hemen yüklenir
const { user: initialUser, token: initialToken } = getParsedUserFromLocalStorage();

const initialState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialUser,
  loading: false,
  error: null,
  message: null,
};

// Mevcut asenkron thunk'lar
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Backend yanıtına göre user'ı data.user'dan, token'ı doğrudan response.data'dan çekiyoruz.
      const user = response.data.data.user;
      const token = response.data.token; // Düzeltme burada!

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token }; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, passwordConfirm }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/auth/reset-password/${token}`, { password, passwordConfirm });
      
      // Backend yanıtına göre: user'ı data.user'dan (varsa), token'ı doğrudan response.data'dan (varsa) çekiyoruz.
      const user = response.data.data?.user;
      const newToken = response.data.token; // Düzeltme burada!

      if (newToken) {
        localStorage.setItem('token', newToken);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return { message: response.data.message, user, token: newToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      // Backend yanıtına göre user'ı data.user'dan, token'ı doğrudan response.data'dan çekiyoruz.
      const user = response.data.data.user;
      const newToken = response.data.token; // Düzeltme burada!

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token: newToken, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Yeni thunk: Mevcut kullanıcı verisini backend'den çekmek için (genel kullanım)
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    const { auth } = getState();
    if (auth.token && !auth.user) {
      try {
        const response = await api.get('/users/me');
        // Backend yanıtı { data: { user: {...} } } şeklinde olduğu için
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        return response.data.data.user;
      } catch (error) {
        console.error("Kullanıcı verisi çekilirken hata:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return rejectWithValue(error.response?.data?.message || error.message);
      }
    }
    return auth.user;
  }
);

// Yeni thunk: Kullanıcının kendi profil bilgilerini almak için (UserProfile.jsx için)
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const user = await dispatch(fetchCurrentUser()).unwrap();
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Yeni thunk: Kullanıcı profilini güncellemek için
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/users/me', userData); 
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearAuthMessage: (state) => {
      state.message = null;
    },
    initializeAuth: (state) => {
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
        state.error = action.payload || 'Kayıt başarısız oldu.';
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.message = 'Giriş başarılı!';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Giriş başarısız oldu.';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.message = 'Çıkış başarılı!';
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Çıkış yapılırken hata oluştu.';
        state.user = null;
        state.token = null;
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
        state.message = action.payload.message || 'Şifre sıfırlama bağlantısı e-postanıza gönderildi.';
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Şifre sıfırlama isteği başarısız oldu.';
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Şifreniz başarıyla sıfırlandı.';
        if (action.payload.token) {
          state.token = action.payload.token;
        }
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Şifre sıfırlama başarısız oldu.';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'E-posta adresiniz başarıyla doğrulandı.';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'E-posta doğrulama başarısız oldu.';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        if (!state.user) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          if (!state.token) {
            state.user = null;
            state.isAuthenticated = false;
          }
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Kullanıcı bilgileri çekilirken hata oluştu.';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Get User Profile (getUserProfile thunk'ı fetchCurrentUser'ı çağırır)
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Profil bilgileri getirilirken hata oluştu.';
        state.user = null;
        state.isAuthenticated = false;
      })

      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.message = 'Profil başarıyla güncellendi!';
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Profil güncellenirken hata oluştu.';
      });
  },
});

export const { clearAuthError, clearAuthMessage, initializeAuth } = authSlice.actions;
export default authSlice.reducer;