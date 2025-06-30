// src/features/cart/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Sepete ürün ekleme
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1, variantId = null }, { rejectWithValue }) => {
    try {
      // Düzeltme: listType'ı URL'ye ekliyoruz
      const listType = 'shopping_cart'; // Sepet için sabit olarak 'shopping_cart' kullanıyoruz
      const response = await api.post(`/cart/${listType}/items`, { product_id: productId, quantity, product_variant_id: variantId });
      return response.data.data.cartItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Sepet içeriğini getirme
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const listType = 'shopping_cart'; // Sepet için sabit olarak 'shopping_cart' kullanıyoruz
      const response = await api.get(`/cart/${listType}`); // Düzeltme: listType'ı URL'ye ekliyoruz
      return response.data.data.cart;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { items: [], total_price: 0, total_quantity: 0 };
      }
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Sepet öğesinin miktarını güncelleme
export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateCartItemQuantity',
  async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
      const listType = 'shopping_cart'; // Sepet için sabit olarak 'shopping_cart' kullanıyoruz
      const response = await api.put(`/cart/${listType}/items/${cartItemId}`, { quantity }); // Düzeltme: listType'ı URL'ye ekliyoruz
      return response.data.data.cartItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Sepetten ürün çıkarma
export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (cartItemId, { rejectWithValue }) => {
    try {
      const listType = 'shopping_cart'; // Sepet için sabit olarak 'shopping_cart' kullanıyoruz
      await api.delete(`/cart/${listType}/items/${cartItemId}`); // Düzeltme: listType'ı URL'ye ekliyoruz
      return cartItemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Sepeti tamamen boşaltma
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const listType = 'shopping_cart'; // Sepet için sabit olarak 'shopping_cart' kullanıyoruz
      await api.delete(`/cart/${listType}/clear`); // Düzeltme: listType'ı URL'ye ekliyoruz
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [], // Sepet öğeleri dizisi
    totalQuantity: 0,
    totalPrice: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // addToCart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const newItem = action.payload;
        const existingItemIndex = state.items.findIndex(item =>
          item.product_id === newItem.product_id &&
          item.product_variant_id === newItem.product_variant_id
        );

        if (existingItemIndex !== -1) {
          state.items[existingItemIndex].quantity = newItem.quantity;
        } else {
          state.items.push(newItem);
        }
        state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ürün sepete eklenirken hata oluştu.';
      })

      // fetchCart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalQuantity = action.payload.total_quantity || 0;
        state.totalPrice = action.payload.total_price || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepet içeriği getirilirken hata oluştu.';
        state.items = [];
        state.totalQuantity = 0;
        state.totalPrice = 0;
      })

      // updateCartItemQuantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        const updatedItem = action.payload;
        const index = state.items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
          state.items[index] = updatedItem;
          state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.totalPrice = state.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        }
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepet öğesi güncellenirken hata oluştu.';
      })

      // removeCartItem
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const removedItemId = action.payload;
        state.items = state.items.filter(item => item.id !== removedItemId);
        state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepet öğesi silinirken hata oluştu.';
      })

      // clearCart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalQuantity = 0;
        state.totalPrice = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Sepet boşaltılırken hata oluştu.';
      });
  },
});

export const { clearCartError } = cartSlice.actions;
export default cartSlice.reducer;