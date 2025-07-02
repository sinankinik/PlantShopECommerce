// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/product/productSlice'; // Yeni eklenen
import categoryReducer from '../features/category/categorySlice'; // Yeni eklenen
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/order/orderSlice';
import reviewsReducer from '../features/review/reviewsSlice';
import userReducer from '../features/user/userSlice';
import reportReducer from '../features/report/reportSlice';
import orderManagementReducer from '../features/order/orderManagementSlice';
import couponManagementReducer from '../features/coupon/couponManagementSlice';
import promotionReducer from '../features/promotion/promotionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer, // products slice'ı ekle
    categories: categoryReducer, // categories slice'ı ekle
    cart: cartReducer,
    orders: orderReducer,
    reviews: reviewsReducer,
    users: userReducer,
    report: reportReducer,
    orderManagement: orderManagementReducer,
    couponManagement: couponManagementReducer,
    promotions: promotionReducer,
  },
});