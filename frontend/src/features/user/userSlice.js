// src/features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService'; // Daha önce oluşturduğumuz servis dosyasını import et

// Tüm kullanıcıları getirme asenkron thunk'ı
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (params, { rejectWithValue, getState }) => {
        try {
            // Redux store'dan kimlik doğrulama (auth) durumunu al
            const { auth } = getState();
            // Auth slice'daki token'a doğrudan erişiyoruz
            const token = auth.token; 

            if (!token) {
                // Eğer token yoksa, yetkilendirme hatası döndür
                return rejectWithValue('Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.');
            }
            
            // UserService üzerinden API çağrısı yap
            const data = await userService.fetchAllUsers(token, params);
            
            // Backend'den gelen yanıtın yapısını kontrol ediyoruz:
            // "data: { users: [...] }" ve "total" bekliyoruz
            return {
                items: data.data.users, // 'users' dizisini 'items' olarak alıyoruz
                pagination: {
                    currentPage: params.page || 1, // Gönderdiğimiz page parametresini kullanıyoruz
                    limit: params.limit || 10,     // Gönderdiğimiz limit parametresini kullanıyoruz
                    totalPages: Math.ceil(data.total / (params.limit || 10)), // Toplam kullanıcı / limit
                    totalItems: data.total,        // Backend'den gelen toplam kullanıcı sayısı
                }
            };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Kullanıcılar getirilemedi.';
            return rejectWithValue(message);
        }
    }
);

// Kullanıcı güncelleme asenkron thunk'ı
export const updateUser = createAsyncThunk(
    'users/updateUser',
    async ({ userId, userData }, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            // Auth slice'daki token'a doğrudan erişiyoruz
            const token = auth.token;

            if (!token) {
                return rejectWithValue('Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.');
            }
            const data = await userService.updateUser(userId, userData, token);
            // Backend'den güncellenen kullanıcının kendisini bekliyoruz (data.user)
            return data.data.user; 
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Kullanıcı güncellenemedi.';
            return rejectWithValue(message);
        }
    }
);

// Kullanıcı silme (pasifize etme) asenkron thunk'ı
export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (userId, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            // Auth slice'daki token'a doğrudan erişiyoruz
            const token = auth.token;

            if (!token) {
                return rejectWithValue('Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.');
            }
            await userService.deleteUser(userId, token);
            // Başarılı olursa silinen kullanıcının ID'sini döndür
            return userId; 
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Kullanıcı silinemedi.';
            return rejectWithValue(message);
        }
    }
);

const userSlice = createSlice({
    name: 'users',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pagination: {
            currentPage: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 0,
        },
    },
    reducers: {
        // Hata durumunu temizlemek için bir eylem
        clearUserError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchUsers (Kullanıcıları Getirme)
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.items = []; // Hata durumunda listeyi temizleyebiliriz
                state.pagination = { currentPage: 1, limit: 10, totalPages: 1, totalItems: 0 };
            })
            // updateUser (Kullanıcı Güncelleme)
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                // Güncellenen kullanıcıyı listede bul ve değiştir
                const index = state.items.findIndex(user => user.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // deleteUser (Kullanıcı Silme/Pasifize Etme)
            .addCase(deleteUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading = false;
                // Silinen (pasifize edilen) kullanıcıyı listeden çıkarıyoruz.
                // Eğer is_active: false olanları da listede görmek isterseniz,
                // bunun yerine `action.payload` ID'sine sahip kullanıcının `is_active` durumunu `false` olarak güncelleyebilirsiniz.
                state.items = state.items.filter(user => user.id !== action.payload);
                // Toplam öğe sayısını da güncellemeyi unutmayın
                state.pagination.totalItems -= 1;
                // totalPages'ı yeniden hesapla
                state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;