// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/product/productSlice';
import categoryReducer from '../features/category/categorySlice';
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/order/orderSlice';
import reviewsReducer from '../features/review/reviewsSlice'; // Mevcut ürün yorumları slice'ı
import userReducer from '../features/user/userSlice';
import reportReducer from '../features/report/reportSlice';
import orderManagementReducer from '../features/order/orderManagementSlice';
import couponManagementReducer from '../features/coupon/couponManagementSlice';
import promotionReducer from '../features/promotion/promotionSlice';
import cartManagementReducer from '../features/cart/cartManagementSlice';
import notificationReducer from '../features/notification/notificationSlice';
import reviewsManagementReducer from '../features/review/reviewsManagementSlice'; // <-- YENİ EKLENDİ

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    categories: categoryReducer,
    cart: cartReducer,
    orders: orderReducer,
    reviews: reviewsReducer, // Ürün sayfalarındaki yorumlar için
    users: userReducer,
    report: reportReducer,
    orderManagement: orderManagementReducer,
    couponManagement: couponManagementReducer,
    promotions: promotionReducer,
    cartManagement: cartManagementReducer,
    notification: notificationReducer,
    reviewsManagement: reviewsManagementReducer, // <-- YENİ SLICE EKLENDİ (Admin yorum yönetimi için)
  },
});
