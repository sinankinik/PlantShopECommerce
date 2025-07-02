// src/pages/Admin/ReportDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    getOverallSalesReport, 
    getTopSellingProducts, 
    getUserStatistics,
    clearReportError,
    clearReportData
} from '../../features/report/reportSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import DatePicker from 'react-datepicker'; // react-datepicker kütüphanesi kullanılacak
import 'react-datepicker/dist/react-datepicker.css'; // Stil dosyasını import edin

const ReportDashboard = () => {
    const dispatch = useDispatch();
    const { salesReport, topSellingProducts, userStatistics, loading, error } = useSelector((state) => state.report);

    // Tarih aralığı state'leri
    const [salesStartDate, setSalesStartDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1))); // Son 1 yıl
    const [salesEndDate, setSalesEndDate] = useState(new Date());
    const [userStatsStartDate, setUserStatsStartDate] = useState(null); // Başlangıçta null olabilir
    const [userStatsEndDate, setUserStatsEndDate] = useState(null);

    useEffect(() => {
        // Genel satış raporunu çek (varsayılan tarih aralığı ile)
        const formattedSalesStartDate = salesStartDate.toISOString().split('T')[0];
        const formattedSalesEndDate = salesEndDate.toISOString().split('T')[0];
        dispatch(getOverallSalesReport({ startDate: formattedSalesStartDate, endDate: formattedSalesEndDate }));

        // En çok satan ürünleri çek
        dispatch(getTopSellingProducts(5)); // İlk 5 ürünü çek

        // Kullanıcı istatistiklerini çek (tarih aralığı opsiyonel)
        let formattedUserStartDate = '';
        let formattedUserEndDate = '';
        if (userStatsStartDate && userStatsEndDate) {
            formattedUserStartDate = userStatsStartDate.toISOString().split('T')[0];
            formattedUserEndDate = userStatsEndDate.toISOString().split('T')[0];
        }
        dispatch(getUserStatistics({ startDate: formattedUserStartDate, endDate: formattedUserEndDate }));

        // Bileşen unmount edildiğinde veya yenilendiğinde verileri temizle
        return () => {
            dispatch(clearReportData());
        };
    }, [dispatch, salesStartDate, salesEndDate, userStatsStartDate, userStatsEndDate]);

    const handleApplySalesFilter = () => {
        const formattedStartDate = salesStartDate.toISOString().split('T')[0];
        const formattedEndDate = salesEndDate.toISOString().split('T')[0];
        dispatch(getOverallSalesReport({ startDate: formattedStartDate, endDate: formattedEndDate }));
    };

    const handleApplyUserStatsFilter = () => {
        let formattedStartDate = '';
        let formattedEndDate = '';
        if (userStatsStartDate && userStatsEndDate) {
            formattedStartDate = userStatsStartDate.toISOString().split('T')[0];
            formattedEndDate = userStatsEndDate.toISOString().split('T')[0];
        }
        dispatch(getUserStatistics({ startDate: formattedStartDate, endDate: formattedEndDate }));
    };


    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Rapor Panosu</h1>

            {loading && <LoadingSpinner />}
            {error && <Alert type="error" message={error} onClose={() => dispatch(clearReportError())} />}

            {/* Genel Satış Raporu */}
            <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Genel Satış Raporu</h2>
                <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-gray-600">Başlangıç:</label>
                        <DatePicker
                            selected={salesStartDate}
                            onChange={(date) => setSalesStartDate(date)}
                            selectsStart
                            startDate={salesStartDate}
                            endDate={salesEndDate}
                            dateFormat="yyyy-MM-dd"
                            className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-gray-600">Bitiş:</label>
                        <DatePicker
                            selected={salesEndDate}
                            onChange={(date) => setSalesEndDate(date)}
                            selectsEnd
                            startDate={salesStartDate}
                            endDate={salesEndDate}
                            minDate={salesStartDate}
                            dateFormat="yyyy-MM-dd"
                            className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button 
                        onClick={handleApplySalesFilter} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Uygula
                    </button>
                </div>
                
                {salesReport ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-100 p-4 rounded-lg flex items-center justify-between shadow-sm">
                            <span className="text-blue-800 font-medium">Toplam Sipariş:</span>
                            <span className="text-blue-900 text-2xl font-bold">{salesReport.totalOrders}</span>
                        </div>
                        <div className="bg-green-100 p-4 rounded-lg flex items-center justify-between shadow-sm">
                            <span className="text-green-800 font-medium">Toplam Gelir:</span>
                            <span className="text-green-900 text-2xl font-bold">${salesReport.totalRevenue}</span>
                        </div>
                    </div>
                ) : (
                    !loading && <p className="text-gray-600">Genel satış raporu verisi bulunamadı.</p>
                )}
            </div>

            {/* En Çok Satan Ürünler */}
            <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">En Çok Satan Ürünler (İlk 5)</h2>
                {topSellingProducts && topSellingProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead>
                                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Ürün Adı</th>
                                    <th className="py-3 px-6 text-left">Satılan Miktar</th>
                                    <th className="py-3 px-6 text-left">Elde Edilen Gelir</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm font-light">
                                {topSellingProducts.map((product) => (
                                    <tr key={product.product_id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-6 text-left">{product.product_name}</td>
                                        <td className="py-3 px-6 text-left">{product.total_quantity_sold}</td>
                                        <td className="py-3 px-6 text-left">${product.total_revenue_generated}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    !loading && <p className="text-gray-600">En çok satan ürün verisi bulunamadı.</p>
                )}
            </div>

            {/* Kullanıcı İstatistikleri */}
            <div className="p-6 border rounded-lg shadow-sm bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Kullanıcı İstatistikleri</h2>
                <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-gray-600">Başlangıç (Yeni Kayıtlar):</label>
                        <DatePicker
                            selected={userStatsStartDate}
                            onChange={(date) => setUserStatsStartDate(date)}
                            selectsStart
                            startDate={userStatsStartDate}
                            endDate={userStatsEndDate}
                            dateFormat="yyyy-MM-dd"
                            isClearable
                            className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-gray-600">Bitiş (Yeni Kayıtlar):</label>
                        <DatePicker
                            selected={userStatsEndDate}
                            onChange={(date) => setUserStatsEndDate(date)}
                            selectsEnd
                            startDate={userStatsStartDate}
                            endDate={userStatsEndDate}
                            minDate={userStatsStartDate}
                            dateFormat="yyyy-MM-dd"
                            isClearable
                            className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button 
                        onClick={handleApplyUserStatsFilter} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Uygula
                    </button>
                </div>

                {userStatistics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-purple-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm text-center">
                            <span className="text-purple-800 text-lg font-medium">Toplam Kullanıcı</span>
                            <span className="text-purple-900 text-3xl font-bold">{userStatistics.totalUsers}</span>
                        </div>
                        <div className="bg-indigo-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm text-center">
                            <span className="text-indigo-800 text-lg font-medium">Aktif Kullanıcı</span>
                            <span className="text-indigo-900 text-3xl font-bold">{userStatistics.activeUsers}</span>
                        </div>
                        <div className="bg-teal-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm text-center">
                            <span className="text-teal-800 text-lg font-medium">Doğrulanmış Kullanıcı</span>
                            <span className="text-teal-900 text-3xl font-bold">{userStatistics.verifiedUsers}</span>
                        </div>
                        <div className="bg-orange-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm text-center">
                            <span className="text-orange-800 text-lg font-medium">Yeni Kayıtlar ({userStatistics.dateRangeForNewUsers ? `${userStatistics.dateRangeForNewUsers.startDate} - ${userStatistics.dateRangeForNewUsers.endDate}` : 'Tüm Zamanlar'})</span>
                            <span className="text-orange-900 text-3xl font-bold">{userStatistics.newUsersInPeriod}</span>
                        </div>
                    </div>
                ) : (
                    !loading && <p className="text-gray-600">Kullanıcı istatistikleri verisi bulunamadı.</p>
                )}
            </div>
        </div>
    );
};

export default ReportDashboard;