// src/features/category/categorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Tüm kategorileri getir
export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message || 'Kategoriler getirilirken hata oluştu.');
        }
    }
);

// Belirli bir kategoriyi ID ile getir (YENİ EKLENDİ)
export const fetchCategoryById = createAsyncThunk(
    'categories/fetchCategoryById',
    async (categoryId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/categories/${categoryId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message || 'Kategori detayları getirilirken hata oluştu.');
        }
    }
);

// Yeni kategori oluştur
export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (categoryData, { rejectWithValue }) => {
        try {
            const response = await api.post('/categories', categoryData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message || 'Kategori oluşturulurken hata oluştu.');
        }
    }
);

// Kategoriyi güncelle (HTTP metodunu PATCH olarak düzeltildi)
export const updateCategory = createAsyncThunk(
    'categories/updateCategory',
    async ({ categoryId, categoryData }, { rejectWithValue }) => {
        try {
            // Backend'deki rota `PATCH` metodunu kullandığı için burada da `api.patch` kullanıyoruz.
            const response = await api.patch(`/categories/${categoryId}`, categoryData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message || 'Kategori güncellenirken hata oluştu.');
        }
    }
);

// Kategoriyi sil
export const deleteCategory = createAsyncThunk(
    'categories/deleteCategory',
    async (categoryId, { rejectWithValue }) => {
        try {
            await api.delete(`/categories/${categoryId}`);
            return categoryId; // Başarılı olursa silinen ID'yi döndür
        } catch (error) {
            return rejectWithValue(error.response.data.message || 'Kategori silinirken hata oluştu.');
        }
    }
);

const categorySlice = createSlice({
    name: 'categories',
    initialState: {
        items: [],
        selectedCategory: null, // YENİ EKLENDİ: Düzenlenecek kategoriyi tutmak için
        loading: false,
        error: null,
    },
    reducers: {
        clearCategoryError: (state) => {
            state.error = null;
        },
        clearSelectedCategory: (state) => { // YENİ EKLENDİ: Seçili kategoriyi temizlemek için
            state.selectedCategory = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchCategories
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.items = []; // Hata durumunda boş liste
            })
            // fetchCategoryById (YENİ EKLENDİ)
            .addCase(fetchCategoryById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategoryById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedCategory = action.payload; // Gelen kategoriyi selectedCategory'ye ata
            })
            .addCase(fetchCategoryById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.selectedCategory = null;
            })
            // createCategory
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.items.push(action.payload);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // updateCategory
            .addCase(updateCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload; // Güncellenen öğeyi listede değiştir
                }
                state.selectedCategory = null; // Güncelleme sonrası seçili kategoriyi temizle
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // deleteCategory
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.loading = false;
                // action.payload doğrudan silinen categoryId olmalı
                state.items = state.items.filter(item => item.id !== action.payload);
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCategoryError, clearSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;