// src/features/product/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // Axios instance'ımızı import ediyoruz

// Ürünleri getiren asenkron thunk
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 10, category: categoryId = '', search = '' }, { rejectWithValue }) => {
    try {
      // Backend API'nize gönderilen sorgu parametreleri
      const response = await api.get('/products', {
        params: { page, limit, category: categoryId, search }, // categoryId'yi backend'e category olarak gönderiyoruz
      });
      // Backend'iniz { products: [...], pagination: {...} } formatında dönüyor.
      return response.data; // Tüm yanıt nesnesini döndürüyoruz
    } catch (error) {
      // Hata yakalama ve Redux'a iletme
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Tek bir ürünü getiren asenkron thunk
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data.product; // Backend'den gelen yanıtın 'product' anahtarını döndürüyoruz
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Admin için ürün oluşturma (placeholder)
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await api.post('/products', productData);
      return response.data.data.product; // Backend'den gelen yanıtın 'data.product' anahtarını döndürüyoruz
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Admin için ürün güncelleme (placeholder)
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ productId, productData }, { rejectWithValue }) => {
    try {
      // BURAYI DÜZELTİYORUZ: api.put yerine api.patch kullanıyoruz
      const response = await api.patch(`/products/${productId}`, productData);
      
      // Backend'den güncellenmiş ürünü veya sadece başarı mesajını alabilirsiniz.
      // Şu anki backend'iniz sadece mesaj döndürdüğü için, 
      // frontend'deki local state'i güncellemek adına gönderilen veriyi döndürüyoruz.
      // İdealde, backend'in güncel ürünü tam olarak dönmesi daha iyidir.
      return { id: productId, ...Object.fromEntries(productData) }; // FormData'yı objeye çeviriyoruz
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Admin için ürün silme (placeholder)
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${productId}`);
      return productId; // Silinen ürünün ID'sini döndür
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [], // Tüm ürünler
    selectedProduct: null, // Detay sayfası için seçilen ürün
    loading: false, // Yüklenme durumu
    error: null, // Hata mesajı
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },
  },
  reducers: {
    // Sync reducer'lar: Hata ve seçili ürünü temizlemek için
    clearProductError: (state) => {
      state.error = null;
    },
    clearSelectedProduct: (state) => {
        state.selectedProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Düzeltme: Backend'den gelen yanıtın 'products' anahtarını items'a atıyoruz.
        state.items = action.payload.products;
        // Pagination bilgisini de doğru yerden alıyoruz
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ürünler yüklenirken bir hata oluştu.';
        state.items = []; // Hata durumunda listeyi temizle
      })

      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedProduct = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ürün detayı yüklenirken bir hata oluştu.';
        state.selectedProduct = null;
      })

      // createProduct
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload); // Yeni ürünü listeye ekle
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ürün oluşturulurken hata oluştu.';
      })

      // updateProduct
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload; // Ürünü güncelle
        }
        // Eğer güncellenen ürün seçili ürün ise onu da güncelle
        if (state.selectedProduct && state.selectedProduct.id === action.payload.id) {
            state.selectedProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ürün güncellenirken hata oluştu.';
      })

      // deleteProduct
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(p => p.id !== action.payload); // Ürünü listeden çıkar
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ürün silinirken hata oluştu.';
      });
  },
});

// Reducer'larda tanımlanan eylemleri export et
export const { clearProductError, clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;