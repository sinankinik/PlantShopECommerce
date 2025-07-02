// src/pages/Admin/OrderManagement.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    getAllOrders,
    fetchOrderById,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    clearOrderManagementError,
    clearOrderManagementMessage,
    clearCurrentOrder,
    resetOrderManagementState
} from '../../features/order/orderManagementSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import OrderDetailModal from '../../components/common/OrderDetailModal';

// React Icons'tan gerekli simgeleri import et
import { FaEye, FaTrash } from 'react-icons/fa'; // <-- BURAYI EKLİYORUZ

const OrderManagement = () => {
    const dispatch = useDispatch();
    const {
        orders,
        currentOrder,
        pagination,
        loading,
        error,
        message
    } = useSelector((state) => state.orderManagement);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    const fetchOrders = useCallback(() => {
        const params = {
            page: currentPage,
            limit: pagination.limit,
        };
        if (searchQuery) {
            params.search = searchQuery;
        }
        if (filterStatus !== 'all') {
            params.status = filterStatus;
        }
        dispatch(getAllOrders(params));
    }, [dispatch, currentPage, searchQuery, filterStatus, pagination.limit]);

    useEffect(() => {
        fetchOrders();
        return () => {
            dispatch(resetOrderManagementState());
        };
    }, [fetchOrders, dispatch]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (e) => {
        setFilterStatus(e.target.value);
        setCurrentPage(1);
    };

    const openOrderDetailModal = (orderId) => {
        setSelectedOrderId(orderId);
        setShowOrderModal(true);
    };

    const closeOrderDetailModal = () => {
        setShowOrderModal(false);
        setSelectedOrderId(null);
        dispatch(clearCurrentOrder());
        dispatch(clearOrderManagementError());
        dispatch(clearOrderManagementMessage());
        fetchOrders();
    };

    const handleUpdateOrder = async (orderId, orderData) => {
        await dispatch(updateOrder({ orderId, orderData }));
        dispatch(fetchOrderById(orderId));
    };

    const handleStatusChange = async (orderId, newStatus) => {
        await dispatch(updateOrderStatus({ orderId, status: newStatus }));
        dispatch(fetchOrderById(orderId));
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
            await dispatch(deleteOrder(orderId));
            if (orders.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                fetchOrders();
            }
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Sipariş Yönetimi</h1>

            {error && <Alert type="error" message={error} onClose={() => dispatch(clearOrderManagementError())} />}
            {message && <Alert type="success" message={message} onClose={() => dispatch(clearOrderManagementMessage())} />}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                <input
                    type="text"
                    placeholder="Sipariş ID, kullanıcı adı veya email ile ara..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                    value={filterStatus}
                    onChange={handleStatusFilterChange}
                    className="w-full md:w-1/4 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">Tüm Durumlar</option>
                    {orderStatusOptions.map(status => (
                        <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <LoadingSpinner />}

            {!loading && orders.length === 0 ? (
                <p className="text-gray-600 text-center text-lg mt-10">Henüz sipariş bulunamadı.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Sipariş ID</th>
                                <th className="py-3 px-6 text-left">Kullanıcı</th>
                                <th className="py-3 px-6 text-left">Toplam Tutar</th>
                                <th className="py-3 px-6 text-left">Durum</th>
                                <th className="py-3 px-6 text-left">Sipariş Tarihi</th>
                                <th className="py-3 px-6 text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm font-light">
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        #{order.id ? String(order.id).substring(0, 8) + '...' : 'N/A'}
                                    </td>
                                    <td className="py-3 px-6 text-left">{order.user_username || order.user_email}</td>
                                    <td className="py-3 px-6 text-left">${parseFloat(order.total_amount).toFixed(2)}</td>
                                    <td className="py-3 px-6 text-left">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                                            ${order.status === 'cancelled' || order.status === 'refunded' ? 'bg-red-100 text-red-800' : ''}
                                            ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${order.status === 'processing' || order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
                                        `}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        {new Date(order.order_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex item-center justify-center space-x-2">
                                            <button
                                                onClick={() => openOrderDetailModal(order.id)}
                                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center tooltip"
                                                data-tooltip-content="Detayları Görüntüle"
                                            >
                                                <FaEye size={16} /> {/* <-- BURAYI DEĞİŞTİRDİK */}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center tooltip"
                                                data-tooltip-content="Siparişi Sil"
                                            >
                                                <FaTrash size={16} /> {/* <-- BURAYI DEĞİŞTİRDİK */}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {showOrderModal && selectedOrderId && (
                <OrderDetailModal
                    orderId={selectedOrderId}
                    onClose={closeOrderDetailModal}
                    onUpdateOrder={handleUpdateOrder}
                    onUpdateOrderStatus={handleStatusChange}
                    orderStatusOptions={orderStatusOptions}
                />
            )}
        </div>
    );
};

export default OrderManagement;