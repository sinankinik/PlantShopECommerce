// src/features/cart/cartManagementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartManagementService from '../../services/cartManagementService';

const initialState = {
  carts: [], // Tüm kullanıcı sepetlerinin özeti (sadece shopping_cart)
  selectedCart: null, // Detayları görüntülenen sepet
  loading: false,
  error: null,
  message: null,
  pagination: {
    currentPage: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },
};

// Async Thunks
export const fetchAllUserShoppingCarts = createAsyncThunk(
  'cartManagement/fetchAllUserShoppingCarts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cartManagementService.getAllUserShoppingCarts(params);
      return {
        carts: response.data.carts,
        pagination: {
          currentPage: params.page || 1,
          limit: params.limit || 10,
          totalItems: response.total,
          totalPages: Math.ceil(response.total / (params.limit || 10)),
        },
      };
    } catch (error) {
      return rejectWithValue(error); // Error response'u doğrudan döndürüyoruz
    }
  }
);

export const fetchUserShoppingCartDetails = createAsyncThunk(
  'cartManagement/fetchUserShoppingCartDetails',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await cartManagementService.getUserShoppingCartDetails(userId);
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const clearUserCart = createAsyncThunk( // Adı clearSpecificUserCart yerine clearUserCart yaptık
  'cartManagement/clearUserCart',
  async ({ userId, listType = 'shopping_cart' }, { rejectWithValue, dispatch }) => {
    try {
      const response = await cartManagementService.clearUserSpecificCart(userId, listType);
      // Başarılı olursa listeyi yeniden çek
      dispatch(fetchAllUserShoppingCarts({ page: initialState.pagination.currentPage, limit: initialState.pagination.limit }));
      return { userId, message: response.message };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const cartManagementSlice = createSlice({
  name: 'cartManagement',
  initialState,
  reducers: {
    clearCartManagementError: (state) => {
      state.error = null;
    },
    clearCartManagementMessage: (state) => {
      state.message = null;
    },
    clearSelectedCart: (state) => {
      state.selectedCart = null;
    },
    resetCartManagementState: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchAllUserShoppingCarts
      .addCase(fetchAllUserShoppingCarts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserShoppingCarts.fulfilled, (state, action) => {
        state.loading = false;
        state.carts = action.payload.carts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllUserShoppingCarts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepetler yüklenirken bir hata oluştu.';
        state.carts = [];
      })

      // fetchUserShoppingCartDetails
      .addCase(fetchUserShoppingCartDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedCart = null;
      })
      .addCase(fetchUserShoppingCartDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCart = action.payload;
      })
      .addCase(fetchUserShoppingCartDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepet detayları yüklenirken bir hata oluştu.';
        state.selectedCart = null;
      })

      // clearUserCart
      .addCase(clearUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(clearUserCart.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || `Sepet başarıyla boşaltıldı.`;
        // Sepet boşaltıldığında, carts listesini güncelleyebiliriz
        state.carts = state.carts.map(cart =>
          cart.userId === action.payload.userId
            ? { ...cart, totalItems: 0, totalAmount: '0.00' }
            : cart
        );
        state.selectedCart = null; // Detay görüntüleniyorsa onu da sıfırla
      })
      .addCase(clearUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepet boşaltılırken hata oluştu.';
      });
  },
});

export const {
  clearCartManagementError,
  clearCartManagementMessage,
  clearSelectedCart,
  resetCartManagementState
} = cartManagementSlice.actions;

export default cartManagementSlice.reducer;