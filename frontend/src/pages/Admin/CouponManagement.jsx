// src/pages/Admin/CouponManagement.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    clearCouponManagementError,
    clearCouponManagementMessage,
    resetCouponManagementState
} from '../../features/coupon/couponManagementSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination'; // Eğer kuponlar için de pagination düşünüyorsak
import { FaEdit, FaTrash, FaPlusCircle, FaTimes, FaSearch } from 'react-icons/fa'; // React Icons

const CouponManagement = () => {
    const dispatch = useDispatch();
    const {
        coupons,
        loading,
        error,
        message
    } = useSelector((state) => state.couponManagement);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentCouponToEdit, setCurrentCouponToEdit] = useState(null);
    const [newCouponData, setNewCouponData] = useState({
        code: '',
        discountType: 'percentage', // Varsayılan
        discountValue: 0,
        minPurchaseAmount: 0,
        maxDiscountAmount: null,
        usageLimit: null,
        expiresAt: '', // Date string
        isActive: true,
    });
    const [editCouponData, setEditCouponData] = useState({
        code: '',
        discountType: '',
        discountValue: 0,
        minPurchaseAmount: 0,
        maxDiscountAmount: null,
        usageLimit: null,
        expiresAt: '',
        isActive: true,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [couponsPerPage] = useState(10); // Her sayfada kaç kupon gösterileceği

    // Kuponları getiren fonksiyon
    const fetchCoupons = useCallback(() => {
        dispatch(getAllCoupons());
    }, [dispatch]);

    useEffect(() => {
        fetchCoupons();
        return () => {
            dispatch(resetCouponManagementState());
        };
    }, [fetchCoupons, dispatch]);

    // Kupon Oluşturma Form Değişiklikleri
    const handleNewCouponChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewCouponData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Kupon Düzenleme Form Değişiklikleri
    const handleEditCouponChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditCouponData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Yeni Kupon Oluşturma
    const handleCreateCouponSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...newCouponData,
            // Backend'in beklentisine göre null değerleri doğru ayarla
            minPurchaseAmount: newCouponData.minPurchaseAmount === '' ? null : Number(newCouponData.minPurchaseAmount),
            maxDiscountAmount: newCouponData.maxDiscountAmount === '' ? null : Number(newCouponData.maxDiscountAmount),
            usageLimit: newCouponData.usageLimit === '' ? null : Number(newCouponData.usageLimit),
            expiresAt: newCouponData.expiresAt === '' ? null : newCouponData.expiresAt, // YYYY-MM-DD formatında olmalı
            discountValue: Number(newCouponData.discountValue),
        };
        
        // Boş stringleri null yapma kontrolü
        for (const key in dataToSubmit) {
            if (dataToSubmit[key] === '') {
                dataToSubmit[key] = null;
            }
        }


        await dispatch(createCoupon(dataToSubmit));
        setShowCreateModal(false);
        setNewCouponData({ // Formu sıfırla
            code: '',
            discountType: 'percentage',
            discountValue: 0,
            minPurchaseAmount: 0,
            maxDiscountAmount: null,
            usageLimit: null,
            expiresAt: '',
            isActive: true,
        });
        fetchCoupons(); // Listeyi yenile
    };

    // Kupon Düzenleme Modalı Açma
    const openEditModal = (coupon) => {
        setCurrentCouponToEdit(coupon);
        setEditCouponData({
            ...coupon,
            // Tarih formatını inputa uygun hale getir (YYYY-MM-DD)
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
        });
        setShowEditModal(true);
    };

    // Kupon Güncelleme
    const handleUpdateCouponSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...editCouponData,
            // Backend'in beklentisine göre null değerleri doğru ayarla
            minPurchaseAmount: editCouponData.minPurchaseAmount === '' ? null : Number(editCouponData.minPurchaseAmount),
            maxDiscountAmount: editCouponData.maxDiscountAmount === '' ? null : Number(editCouponData.maxDiscountAmount),
            usageLimit: editCouponData.usageLimit === '' ? null : Number(editCouponData.usageLimit),
            expiresAt: editCouponData.expiresAt === '' ? null : editCouponData.expiresAt, // YYYY-MM-DD formatında olmalı
            discountValue: Number(editCouponData.discountValue),
        };

         // Boş stringleri null yapma kontrolü
         for (const key in dataToSubmit) {
            if (dataToSubmit[key] === '') {
                dataToSubmit[key] = null;
            }
        }

        await dispatch(updateCoupon({ couponId: currentCouponToEdit.id, couponData: dataToSubmit }));
        setShowEditModal(false);
        setCurrentCouponToEdit(null);
        fetchCoupons(); // Listeyi yenile
    };

    // Kupon Silme
    const handleDeleteCoupon = async (couponId) => {
        if (window.confirm('Bu kuponu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            await dispatch(deleteCoupon(couponId));
            // Silme başarılı olursa Redux state'i otomatik güncellenir.
            // Sayfalamada sorun olursa tekrar fetch yapabiliriz:
            // fetchCoupons();
        }
    };

    // Pagination Logic
    const indexOfLastCoupon = currentPage * couponsPerPage;
    const indexOfFirstCoupon = indexOfLastCoupon - couponsPerPage;
    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.discountType.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const currentCoupons = filteredCoupons.slice(indexOfFirstCoupon, indexOfLastCoupon);
    const totalPages = Math.ceil(filteredCoupons.length / couponsPerPage);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Kupon Yönetimi</h1>

            {error && <Alert type="error" message={error} onClose={() => dispatch(clearCouponManagementError())} />}
            {message && <Alert type="success" message={message} onClose={() => dispatch(clearCouponManagementMessage())} />}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                <input
                    type="text"
                    placeholder="Kupon kodu veya türüne göre ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                >
                    <FaPlusCircle className="mr-2" /> Yeni Kupon Oluştur
                </button>
            </div>

            {loading && <LoadingSpinner />}

            {!loading && coupons.length === 0 ? (
                <p className="text-gray-600 text-center text-lg mt-10">Henüz kupon bulunamadı.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Kod</th>
                                <th className="py-3 px-6 text-left">İndirim Türü</th>
                                <th className="py-3 px-6 text-left">Değer</th>
                                <th className="py-3 px-6 text-left">Min. Tutar</th>
                                <th className="py-3 px-6 text-left">Max. İndirim</th>
                                <th className="py-3 px-6 text-left">Kullanım Limiti</th>
                                <th className="py-3 px-6 text-left">Kullanıldı</th>
                                <th className="py-3 px-6 text-left">Bitiş Tarihi</th>
                                <th className="py-3 px-6 text-left">Aktif Mi?</th>
                                <th className="py-3 px-6 text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light">
                            {currentCoupons.map((coupon) => (
                                <tr key={coupon.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-6 text-left">{coupon.code}</td>
                                    <td className="py-3 px-6 text-left">{coupon.discountType === 'percentage' ? 'Yüzde' : 'Sabit'}</td>
                                    <td className="py-3 px-6 text-left">
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${parseFloat(coupon.discountValue).toFixed(2)}`}
                                    </td>
                                    <td className="py-3 px-6 text-left">${parseFloat(coupon.minPurchaseAmount).toFixed(2)}</td>
                                    <td className="py-3 px-6 text-left">{coupon.maxDiscountAmount ? `$${parseFloat(coupon.maxDiscountAmount).toFixed(2)}` : 'Yok'}</td>
                                    <td className="py-3 px-6 text-left">{coupon.usageLimit || 'Yok'}</td>
                                    <td className="py-3 px-6 text-left">{coupon.timesUsed}</td>
                                    <td className="py-3 px-6 text-left">
                                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Yok'}
                                    </td>
                                    <td className="py-3 px-6 text-left">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {coupon.isActive ? 'Evet' : 'Hayır'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex item-center justify-center space-x-2">
                                            <button
                                                onClick={() => openEditModal(coupon)}
                                                className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center tooltip"
                                                data-tooltip-content="Kuponu Düzenle"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center tooltip"
                                                data-tooltip-content="Kuponu Sil"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredCoupons.length > couponsPerPage && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Yeni Kupon Oluşturma Modalı */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-3 right-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                        >
                            <FaTimes size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Yeni Kupon Oluştur</h2>
                        <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Kupon Kodu:</label>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={newCouponData.code}
                                    onChange={handleNewCouponChange}
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">İndirim Türü:</label>
                                <select
                                    id="discountType"
                                    name="discountType"
                                    value={newCouponData.discountType}
                                    onChange={handleNewCouponChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="percentage">Yüzde İndirimi (%)</option>
                                    <option value="fixed_amount">Sabit Miktar İndirimi ($)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">İndirim Değeri:</label>
                                <input
                                    type="number"
                                    id="discountValue"
                                    name="discountValue"
                                    value={newCouponData.discountValue}
                                    onChange={handleNewCouponChange}
                                    min={newCouponData.discountType === 'percentage' ? 1 : 0.01}
                                    max={newCouponData.discountType === 'percentage' ? 100 : undefined}
                                    step={newCouponData.discountType === 'percentage' ? 1 : 0.01}
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700">Minimum Alışveriş Tutarı (Opsiyonel):</label>
                                <input
                                    type="number"
                                    id="minPurchaseAmount"
                                    name="minPurchaseAmount"
                                    value={newCouponData.minPurchaseAmount}
                                    onChange={handleNewCouponChange}
                                    min="0"
                                    step="0.01"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700">Maksimum İndirim Tutarı (Opsiyonel):</label>
                                <input
                                    type="number"
                                    id="maxDiscountAmount"
                                    name="maxDiscountAmount"
                                    value={newCouponData.maxDiscountAmount || ''}
                                    onChange={handleNewCouponChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="Yok"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700">Kullanım Limiti (Adet, Opsiyonel):</label>
                                <input
                                    type="number"
                                    id="usageLimit"
                                    name="usageLimit"
                                    value={newCouponData.usageLimit || ''}
                                    onChange={handleNewCouponChange}
                                    min="1"
                                    step="1"
                                    placeholder="Yok"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">Bitiş Tarihi (Opsiyonel):</label>
                                <input
                                    type="date"
                                    id="expiresAt"
                                    name="expiresAt"
                                    value={newCouponData.expiresAt}
                                    onChange={handleNewCouponChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                             <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={newCouponData.isActive}
                                    onChange={handleNewCouponChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">Aktif Mi?</label>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-300"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                                >
                                    Kupon Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Kupon Düzenleme Modalı */}
            {showEditModal && currentCouponToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-3 right-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                        >
                            <FaTimes size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Kuponu Düzenle: {currentCouponToEdit.code}</h2>
                        <form onSubmit={handleUpdateCouponSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700">Kupon Kodu:</label>
                                <input
                                    type="text"
                                    id="edit-code"
                                    name="code"
                                    value={editCouponData.code}
                                    onChange={handleEditCouponChange}
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-discountType" className="block text-sm font-medium text-gray-700">İndirim Türü:</label>
                                <select
                                    id="edit-discountType"
                                    name="discountType"
                                    value={editCouponData.discountType}
                                    onChange={handleEditCouponChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="percentage">Yüzde İndirimi (%)</option>
                                    <option value="fixed_amount">Sabit Miktar İndirimi ($)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="edit-discountValue" className="block text-sm font-medium text-gray-700">İndirim Değeri:</label>
                                <input
                                    type="number"
                                    id="edit-discountValue"
                                    name="discountValue"
                                    value={editCouponData.discountValue}
                                    onChange={handleEditCouponChange}
                                    min={editCouponData.discountType === 'percentage' ? 1 : 0.01}
                                    max={editCouponData.discountType === 'percentage' ? 100 : undefined}
                                    step={editCouponData.discountType === 'percentage' ? 1 : 0.01}
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-minPurchaseAmount" className="block text-sm font-medium text-gray-700">Minimum Alışveriş Tutarı (Opsiyonel):</label>
                                <input
                                    type="number"
                                    id="edit-minPurchaseAmount"
                                    name="minPurchaseAmount"
                                    value={editCouponData.minPurchaseAmount || ''}
                                    onChange={handleEditCouponChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="Yok"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-maxDiscountAmount" className="block text-sm font-medium text-gray-700">Maksimum İndirim Tutarı (Opsiyonel):</label>
                                <input
                                    type="number"
                                    id="edit-maxDiscountAmount"
                                    name="maxDiscountAmount"
                                    value={editCouponData.maxDiscountAmount || ''}
                                    onChange={handleEditCouponChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="Yok"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-usageLimit" className="block text-sm font-medium text-gray-700">Kullanım Limiti (Adet, Opsiyonel):</label>
                                <input
                                    type="number"
                                    id="edit-usageLimit"
                                    name="usageLimit"
                                    value={editCouponData.usageLimit || ''}
                                    onChange={handleEditCouponChange}
                                    min="1"
                                    step="1"
                                    placeholder="Yok"
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-expiresAt" className="block text-sm font-medium text-gray-700">Bitiş Tarihi (Opsiyonel):</label>
                                <input
                                    type="date"
                                    id="edit-expiresAt"
                                    name="expiresAt"
                                    value={editCouponData.expiresAt}
                                    onChange={handleEditCouponChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="edit-isActive"
                                    name="isActive"
                                    checked={editCouponData.isActive}
                                    onChange={handleEditCouponChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="edit-isActive" className="ml-2 block text-sm font-medium text-gray-700">Aktif Mi?</label>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-300"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                                >
                                    Güncelle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManagement;