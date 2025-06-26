// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // authSlice'ı import et

export const store = configureStore({
  reducer: {
    auth: authReducer, // auth slice'ı ekle
    // Diğer slice'lar buraya gelecek
  },
});