// src/features/report/reportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // API servisinizi import edin

const initialState = {
    salesReport: null,
    topSellingProducts: [],
    userStatistics: null,
    loading: false,
    error: null,
    message: null,
};

// Async Thunks
// Genel Satış Raporunu Getirme
export const getOverallSalesReport = createAsyncThunk(
    'report/getOverallSalesReport',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
            return response.data.data.report; // Backend yanıt yapınıza göre ayarlayın
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// En Çok Satan Ürünleri Getirme
export const getTopSellingProducts = createAsyncThunk(
    'report/getTopSellingProducts',
    async (limit = 10, { rejectWithValue }) => {
        try {
            const response = await api.get(`/reports/top-selling-products?limit=${limit}`);
            return response.data.data.topProducts; // Backend yanıt yapınıza göre ayarlayın
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Kullanıcı İstatistiklerini Getirme
export const getUserStatistics = createAsyncThunk(
    'report/getUserStatistics',
    async ({ startDate = '', endDate = '' } = {}, { rejectWithValue }) => {
        try {
            let url = '/reports/user-statistics';
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }
            const response = await api.get(url);
            return response.data.data; // Backend yanıt yapınıza göre ayarlayın
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const reportSlice = createSlice({
    name: 'report',
    initialState,
    reducers: {
        clearReportError: (state) => {
            state.error = null;
        },
        clearReportData: (state) => {
            state.salesReport = null;
            state.topSellingProducts = [];
            state.userStatistics = null;
            state.loading = false;
            state.error = null;
            state.message = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getOverallSalesReport
            .addCase(getOverallSalesReport.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOverallSalesReport.fulfilled, (state, action) => {
                state.loading = false;
                state.salesReport = action.payload;
            })
            .addCase(getOverallSalesReport.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Genel satış raporu getirilemedi.';
            })

            // getTopSellingProducts
            .addCase(getTopSellingProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTopSellingProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.topSellingProducts = action.payload;
            })
            .addCase(getTopSellingProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'En çok satan ürünler getirilemedi.';
            })

            // getUserStatistics
            .addCase(getUserStatistics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserStatistics.fulfilled, (state, action) => {
                state.loading = false;
                state.userStatistics = action.payload;
            })
            .addCase(getUserStatistics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Kullanıcı istatistikleri getirilemedi.';
            });
    },
});

export const { clearReportError, clearReportData } = reportSlice.actions;
export default reportSlice.reducer;