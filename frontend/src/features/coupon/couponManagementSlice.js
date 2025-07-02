// src/features/coupon/couponManagementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // Axios instance'ınız

// Kupon oluşturma
export const createCoupon = createAsyncThunk(
    'couponManagement/createCoupon',
    async (couponData, { rejectWithValue }) => {
        try {
            const response = await api.post('/coupons', couponData);
            return response.data.data.coupon; // Backend'den dönen kupon verisi
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Tüm kuponları getirme
export const getAllCoupons = createAsyncThunk(
    'couponManagement/getAllCoupons',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/coupons');
            return response.data.data.coupons;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Kuponu ID'ye göre getirme (detayları göstermek için)
export const getCouponById = createAsyncThunk(
    'couponManagement/getCouponById',
    async (couponId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/coupons/${couponId}`);
            return response.data.data.coupon;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Kupon güncelleme
export const updateCoupon = createAsyncThunk(
    'couponManagement/updateCoupon',
    async ({ couponId, couponData }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/coupons/${couponId}`, couponData);
            return response.data.data; // Güncelleme sonrası dönen veri (genellikle sadece success mesajı)
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Kupon silme
export const deleteCoupon = createAsyncThunk(
    'couponManagement/deleteCoupon',
    async (couponId, { rejectWithValue }) => {
        try {
            await api.delete(`/coupons/${couponId}`);
            return couponId; // Silinen kuponun ID'sini döndürürüz
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const couponManagementSlice = createSlice({
    name: 'couponManagement',
    initialState: {
        coupons: [],
        currentCoupon: null,
        loading: false,
        error: null,
        message: null,
    },
    reducers: {
        clearCouponManagementError: (state) => {
            state.error = null;
        },
        clearCouponManagementMessage: (state) => {
            state.message = null;
        },
        clearCurrentCoupon: (state) => {
            state.currentCoupon = null;
        },
        resetCouponManagementState: (state) => {
            state.coupons = [];
            state.currentCoupon = null;
            state.loading = false;
            state.error = null;
            state.message = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // createCoupon
            .addCase(createCoupon.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(createCoupon.fulfilled, (state, action) => {
                state.loading = false;
                // Kupon listesini anında güncellemek istersen, dönen kuponu listeye ekleyebilirsin.
                // Ancak getAllCoupons'ı tekrar çağırmak daha garantili olabilir.
                // state.coupons.push(action.payload); // Eğer backend kuponun tamamını döndürüyorsa
                state.message = 'Kupon başarıyla oluşturuldu.';
            })
            .addCase(createCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Kupon oluşturulurken bir hata oluştu.';
            })

            // getAllCoupons
            .addCase(getAllCoupons.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(getAllCoupons.fulfilled, (state, action) => {
                state.loading = false;
                state.coupons = action.payload;
            })
            .addCase(getAllCoupons.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Kuponlar getirilirken bir hata oluştu.';
            })

            // getCouponById
            .addCase(getCouponById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
                state.currentCoupon = null; // Yeni kupon çekilirken önceki kuponu temizle
            })
            .addCase(getCouponById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentCoupon = action.payload;
            })
            .addCase(getCouponById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Kupon detayı getirilirken bir hata oluştu.';
            })

            // updateCoupon
            .addCase(updateCoupon.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(updateCoupon.fulfilled, (state, action) => {
                state.loading = false;
                state.message = 'Kupon başarıyla güncellendi.';
                // Güncellenen kuponu listede bulup güncelleyebiliriz
                // Veya tüm kuponları yeniden çekebiliriz (getAllCoupons).
                // Şimdilik sadece mesaj gösterip, modal kapanınca liste yenileneceği varsayılıyor.
            })
            .addCase(updateCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Kupon güncellenirken bir hata oluştu.';
            })

            // deleteCoupon
            .addCase(deleteCoupon.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(deleteCoupon.fulfilled, (state, action) => {
                state.loading = false;
                state.coupons = state.coupons.filter(
                    (coupon) => coupon.id !== action.payload
                );
                state.message = 'Kupon başarıyla silindi.';
            })
            .addCase(deleteCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Kupon silinirken bir hata oluştu.';
            });
    },
});

export const {
    clearCouponManagementError,
    clearCouponManagementMessage,
    clearCurrentCoupon,
    resetCouponManagementState,
} = couponManagementSlice.actions;

export default couponManagementSlice.reducer;