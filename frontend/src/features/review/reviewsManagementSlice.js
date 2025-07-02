// src/features/review/reviewsManagementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reviewService from '../../services/reviewService';

const initialState = {
  reviews: [],
  pagination: {
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  },
  loading: false,
  error: null, // Hata mesajı string olacak
  successMessage: null,
};

// Async Thunk: Tüm yorumları getir (Admin paneli için)
export const fetchAllReviews = createAsyncThunk(
  'reviewsManagement/fetchAllReviews',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Yetkilendirme token\'ı bulunamadı.');
      }
      const data = await reviewService.getAllReviews(token, params);
      return data.data;
    } catch (error) {
      // Sadece hata mesajını döndürerek serileştirme sorununu çözüyoruz
      return rejectWithValue(error.response?.data?.message || error.message || 'Yorumlar getirilirken bir hata oluştu.');
    }
  }
);

// Async Thunk: Yorum sil
export const deleteReview = createAsyncThunk(
  'reviewsManagement/deleteReview',
  async (reviewId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('Yetkilendirme token\'ı bulunamadı.');
      }
      await reviewService.deleteReview(reviewId, token);
      return reviewId;
    } catch (error) {
      // Sadece hata mesajını döndürerek serileştirme sorununu çözüyoruz
      return rejectWithValue(error.response?.data?.message || error.message || 'Yorum silinirken bir hata oluştu.');
    }
  }
);

const reviewsManagementSlice = createSlice({
  name: 'reviewsManagement',
  initialState,
  reducers: {
    clearReviewsManagementError: (state) => {
      state.error = null;
    },
    clearReviewsManagementSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllReviews
      .addCase(fetchAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Payload artık sadece string bir mesaj olacak
        state.reviews = [];
        state.pagination = initialState.pagination;
      })
      // deleteReview
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = state.reviews.filter(
          (review) => review.id !== action.payload
        );
        state.successMessage = 'Yorum başarıyla silindi.';
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Payload artık sadece string bir mesaj olacak
      });
  },
});

export const { clearReviewsManagementError, clearReviewsManagementSuccess } = reviewsManagementSlice.actions;

export default reviewsManagementSlice.reducer;