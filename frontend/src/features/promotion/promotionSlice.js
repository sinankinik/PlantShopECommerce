// src/features/promotion/promotionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import promoService from '../../services/promoService';

const initialState = {
  items: [],
  selectedPromotion: null,
  loading: false,
  error: null,
  message: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },
};

// Async Thunks
export const fetchPromotions = createAsyncThunk(
  'promotions/fetchPromotions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await promoService.getAllPromotions(params);
      // Backend'iniz { status, results, data: { promotions: [...] } } dönüyor
      // Promosyon objelerinin camelCase'e dönüştürülmesi gerekiyor
      const transformedPromotions = response.data.promotions.map(promo => ({
        id: promo.id,
        name: promo.name,
        description: promo.description,
        promotionType: promo.promotionType, // Backend'den doğrudan promotionType geliyor
        targetType: promo.targetType,
        targetId: promo.targetId,
        discountValue: promo.discountValue,
        minPurchaseAmount: promo.minPurchaseAmount,
        maxDiscountAmount: promo.maxDiscountAmount,
        startDate: promo.startDate,
        endDate: promo.endDate,
        isActive: promo.isActive, // Backend'den doğrudan isActive geliyor
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
      }));

      return {
        items: transformedPromotions,
        pagination: {
          currentPage: params.page || 1,
          limit: params.limit || 10,
          totalItems: response.results, // Backend'den gelen toplam öğe sayısı
          totalPages: Math.ceil(response.results / (params.limit || 10)),
        },
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchPromotionById = createAsyncThunk(
  'promotions/fetchPromotionById',
  async (promotionId, { rejectWithValue }) => {
    try {
      const response = await promoService.getPromotionById(promotionId);
      // Backend'iniz { status, data: { promotion: {...} } } dönüyor
      const promo = response.data.promotion;
      // Promosyon objesinin camelCase'e dönüştürülmesi
      const transformedPromotion = {
        id: promo.id,
        name: promo.name,
        description: promo.description,
        promotionType: promo.promotionType,
        targetType: promo.targetType,
        targetId: promo.targetId,
        discountValue: promo.discountValue,
        minPurchaseAmount: promo.minPurchaseAmount,
        maxDiscountAmount: promo.maxDiscountAmount,
        startDate: promo.startDate,
        endDate: promo.endDate,
        isActive: promo.isActive,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
      };
      return transformedPromotion;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createPromotion = createAsyncThunk(
  'promotions/createPromotion',
  async (promotionData, { rejectWithValue, dispatch }) => {
    try {
      const response = await promoService.createPromotion(promotionData);
      // Backend sadece promotionId dönüyor, bu yüzden listeyi yeniden çekelim
      // veya dönen ID ile tek bir promosyonu daha çekebiliriz.
      // Basitlik için tüm listeyi yeniden çekmek daha garantilidir.
      dispatch(fetchPromotions()); // Promosyon listesini yeniden çek

      // Kullanıcıya başarılı mesajı göstermek için
      return response.message || 'Promosyon başarıyla oluşturuldu.';
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updatePromotion = createAsyncThunk(
  'promotions/updatePromotion',
  async ({ promotionId, promotionData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await promoService.updatePromotion(promotionId, promotionData);
      // Backend sadece promotionId dönüyor, bu yüzden listeyi yeniden çekelim
      dispatch(fetchPromotions()); // Promosyon listesini yeniden çek

      // Kullanıcıya başarılı mesajı göstermek için
      return response.message || 'Promosyon başarıyla güncellendi.';
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deletePromotion = createAsyncThunk(
  'promotions/deletePromotion',
  async (promotionId, { rejectWithValue, dispatch }) => {
    try {
      const response = await promoService.deletePromotion(promotionId); // Backend data:null dönüyor
      // Listeden silineni çıkarmak için silinen ID'yi döndürelim
      dispatch(fetchPromotions()); // Promosyon listesini yeniden çek

      return promotionId; // Silinen ID'yi döndür
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const promotionSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    clearPromotionError: (state) => {
      state.error = null;
    },
    clearPromotionMessage: (state) => {
      state.message = null;
    },
    clearSelectedPromotion: (state) => {
      state.selectedPromotion = null;
    },
    resetPromotionState: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchPromotions
      .addCase(fetchPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Promosyonlar yüklenirken bir hata oluştu.';
        state.items = [];
      })

      // fetchPromotionById
      .addCase(fetchPromotionById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedPromotion = null;
      })
      .addCase(fetchPromotionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPromotion = action.payload;
      })
      .addCase(fetchPromotionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Promosyon detayı yüklenirken bir hata oluştu.';
        state.selectedPromotion = null;
      })

      // createPromotion
      .addCase(createPromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createPromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload; // Backend'den gelen mesajı kullan
        // Listeyi tekrar çekmek yerine doğrudan eklemeyeceğiz çünkü backend'den ID dışında bilgi gelmiyor
        // dispatch(fetchPromotions()) çağrısı zaten yapıldı
      })
      .addCase(createPromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Promosyon oluşturulurken hata oluştu.';
      })

      // updatePromotion
      .addCase(updatePromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updatePromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload; // Backend'den gelen mesajı kullan
        // Listeyi tekrar çekmek yerine doğrudan güncellemeyeceğiz
        // dispatch(fetchPromotions()) çağrısı zaten yapıldı
      })
      .addCase(updatePromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Promosyon güncellenirken hata oluştu.';
      })

      // deletePromotion
      .addCase(deletePromotion.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(deletePromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.message = 'Promosyon başarıyla silindi!';
        // Listeden silineni çıkarıyoruz
        state.items = state.items.filter(promo => promo.id !== action.payload);
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(deletePromotion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Promosyon silinirken hata oluştu.';
      });
  },
});

export const {
  clearPromotionError,
  clearPromotionMessage,
  clearSelectedPromotion,
  resetPromotionState
} = promotionSlice.actions;

export default promotionSlice.reducer;