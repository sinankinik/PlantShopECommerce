// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/product/productSlice'; // Yeni eklenen
import categoryReducer from '../features/category/categorySlice'; // Yeni eklenen
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/order/orderSlice';
import reviewsReducer from '../features/review/reviewsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer, // products slice'ı ekle
    categories: categoryReducer, // categories slice'ı ekle
    cart: cartReducer,
    orders: orderReducer,
    reviews: reviewsReducer,
  },
});