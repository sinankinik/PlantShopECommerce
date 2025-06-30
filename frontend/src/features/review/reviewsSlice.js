// frontend/src/features/reviews/reviewsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; // api servisini kullanıyorsanız axios yerine api import edin

// API temel URL'si
const API_URL = 'http://localhost:5000/api'; // Eğer bir 'api' servisi kullanıyorsanız bunu kullanmayın

// Eğer projenizde ../services/api.js dosyanız varsa, axios yerine onu kullanmak daha iyi olur:
// import api from '../../services/api';
// Aşağıdaki axios.post/get/patch/delete çağrılarını api.post/get/patch/delete olarak değiştirin.

// Yorum ekleme veya güncelleme thunk'ı
export const addReview = createAsyncThunk(
    'reviews/addReview',
    async ({ productId, rating, comment }, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            const token = auth.token; 
            // Kullanıcı ID'sini veya adını request body'sine eklemeye gerek yok.
            // Backend token'dan req.user.id'yi alıyor.

            if (!token) {
                return rejectWithValue('Yorum eklemek için giriş yapmalısınız.');
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            // Backend'e sadece rating ve comment gönderiyoruz.
            // userId bilgisi token üzerinden backend tarafından alınacak.
            const reviewData = {
                rating,
                comment,
            };

            const response = await axios.post(
                `${API_URL}/reviews/products/${productId}`,
                reviewData, 
                config
            );
            return response.data.data; 
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return rejectWithValue(message);
        }
    }
);

// Bir ürüne ait tüm yorumları ve ortalama derecelendirmeyi getir
export const getReviewsByProductId = createAsyncThunk(
    'reviews/getReviewsByProductId',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/reviews/products/${productId}`);
            // Backend'den gelen veri yapısına göre doğrudan return edebiliriz
            // Çünkü backend zaten `data: { productId, averageRating, reviews }` yapısını döndürüyor.
            return response.data.data; 
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return rejectWithValue(message);
        }
    }
);

// Yorum güncelleme thunk'ı
export const updateReview = createAsyncThunk(
    'reviews/updateReview',
    async ({ reviewId, rating, comment }, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            const token = auth.token;

            if (!token) {
                return rejectWithValue('Yorum güncellemek için giriş yapmalısınız.');
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const response = await axios.patch(
                `${API_URL}/reviews/${reviewId}`,
                { rating, comment },
                config
            );
            return response.data.data;
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return rejectWithValue(message);
        }
    }
);

// Yorum silme thunk'ı
export const deleteReview = createAsyncThunk(
    'reviews/deleteReview',
    async (reviewId, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            const token = auth.token;

            if (!token) {
                return rejectWithValue('Yorum silmek için giriş yapmalısınız.');
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.delete(`${API_URL}/reviews/${reviewId}`, config);
            return reviewId;
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return rejectWithValue(message);
        }
    }
);

// reviewsSlice
const reviewsSlice = createSlice({
    name: 'reviews',
    initialState: {
        reviews: [],
        averageRating: 0,
        status: 'idle',
        error: null,
    },
    reducers: {
        resetReviewsState: (state) => {
            state.reviews = [];
            state.averageRating = 0;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addReview.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addReview.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Not: Yorum eklendikten sonra `getProductReviews`'ı tekrar çağırmanız iyi bir pratik.
                // Bu sayede yorum listesi ve ortalama puan güncellenecektir.
            })
            .addCase(addReview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(getReviewsByProductId.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(getReviewsByProductId.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.reviews = action.payload.reviews;
                state.averageRating = action.payload.averageRating;
            })
            .addCase(getReviewsByProductId.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.reviews = [];
                state.averageRating = 0;
            })
            .addCase(updateReview.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateReview.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Not: Yorum güncellendikten sonra `getProductReviews`'ı tekrar çağırmanız iyi bir pratik.
            })
            .addCase(updateReview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteReview.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteReview.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.reviews = state.reviews.filter(
                    (review) => review.id !== action.payload
                );
                // Not: Yorum silindikten sonra `getProductReviews`'ı tekrar çağırmanız iyi bir pratik.
            })
            .addCase(deleteReview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { resetReviewsState } = reviewsSlice.actions;
export default reviewsSlice.reducer;