// src/components/admin/OrderDetailModal.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// DİKKAT: orderSlice yerine orderManagementSlice'tan import ediyoruz.
// clearOrderError yerine clearOrderManagementError kullanıyoruz.
import { fetchOrderById, clearOrderManagementError } from '../../features/order/orderManagementSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { FaTimes } from 'react-icons/fa'; // React Icons'tan kapatma simgesi

const OrderDetailModal = ({ orderId, onClose, onUpdateOrder, onUpdateOrderStatus, orderStatusOptions }) => {
    const dispatch = useDispatch();
    // DİKKAT: state.orders yerine state.orderManagement'ı seçiyoruz.
    const { currentOrder, loading, error, message } = useSelector((state) => state.orderManagement);

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        status: '',
        total_amount: '',
        shipping_address_street: '', // Backend'den gelen alan adlarına dikkat etmeliyiz
        shipping_address_city: '',
        shipping_address_zip: '',
        shipping_address_country: '',
        payment_method: '',
        // Diğer düzenlenebilir alanlar buraya eklenebilir
    });

    // Modal açıldığında veya orderId değiştiğinde sipariş detaylarını çek
    useEffect(() => {
        if (orderId) {
            dispatch(fetchOrderById(orderId));
        }
        // Temizlik: component unmount edildiğinde veya orderId değiştiğinde eski hatayı temizle
        return () => {
            dispatch(clearOrderManagementError());
        };
    }, [dispatch, orderId]);

    // currentOrder yüklendiğinde veya güncellendiğinde formu doldur
    useEffect(() => {
        if (currentOrder) {
            // currentOrder.shipping_address tek bir string ise bu şekilde ayrıştırman gerekebilir,
            // veya backend'den adres alanları ayrı ayrı geliyorsa direkt kullanabilirsin.
            // Önceki OrderDetailModal'da 'shipping_address_street', 'shipping_address_city' gibi alanları kullanmıştık.
            // Eğer tek bir string olarak geliyorsa, düzenleme formunda sadece tek bir textarea gösterebiliriz.
            // Şimdilik backend'in ayrı ayrı alanlar döndürdüğünü varsayarak ilerleyelim.
            setFormData({
                status: currentOrder.status || '',
                total_amount: currentOrder.total_amount || 0,
                shipping_address_street: currentOrder.shipping_address_street || '',
                shipping_address_city: currentOrder.shipping_address_city || '',
                shipping_address_zip: currentOrder.shipping_address_zip || '',
                shipping_address_country: currentOrder.shipping_address_country || '',
                payment_method: currentOrder.payment_method || '',
            });
            setEditMode(false); // Yeni sipariş yüklendiğinde düzenleme modundan çık
        }
    }, [currentOrder]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Sadece durum değiştiyse onUpdateOrderStatus'ı çağır (daha spesifik bir API çağrısı olabilir)
        // Aksi takdirde, diğer alanlar değiştiyse veya durum ile birlikte değiştiyse onUpdateOrder'ı çağır
        const isStatusOnlyChange = formData.status !== currentOrder.status &&
                                !Object.keys(formData).some(key => 
                                    key !== 'status' && 
                                    // float karşılaştırmalarında toFixed kullanmak doğru olmaz, direkt sayı karşılaştırılmalı
                                    // string olanlar için de boşlukları trimleyebiliriz
                                    (String(formData[key]).trim() !== String(currentOrder[key]).trim())
                                );

        if (isStatusOnlyChange && onUpdateOrderStatus) {
            await onUpdateOrderStatus(orderId, formData.status);
        } else if (onUpdateOrder) {
            await onUpdateOrder(orderId, formData); // Tüm form verisini gönder
        }
        
        // Güncelleme sonrası modaldaki verileri yeniden çekerek güncel kalmasını sağla
        dispatch(fetchOrderById(orderId));
        setEditMode(false); // Güncelleme sonrası düzenleme modundan çık
    };

    // Modalın dışına tıklanınca kapanması için
    const handleOverlayClick = (e) => {
        if (e.target.id === "order-detail-modal-overlay") {
            onClose();
        }
    };

    // Yükleme durumu veya hata mesajları için kontroller
    if (loading && !currentOrder) { // İlk yüklemede ve currentOrder boşken spinner göster
        return (
            <div id="order-detail-modal-overlay" className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50" onClick={handleOverlayClick}>
                <LoadingSpinner />
            </div>
        );
    }

    if (error) { // Hata durumunda hata mesajı göster
        return (
            <div id="order-detail-modal-overlay" className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
                    <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold">
                        <FaTimes size={20} /> {/* Kapatma simgesi */}
                    </button>
                    <Alert type="error" message={error} onClose={() => dispatch(clearOrderManagementError())} />
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Kapat</button>
                </div>
            </div>
        );
    }

    if (!currentOrder) { // Eğer sipariş verisi yoksa (örneğin ID yanlış veya silinmişse)
        return null;
    }

    return (
        <div id="order-detail-modal-overlay" className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                    <FaTimes size={20} /> {/* Kapatma simgesi */}
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">Sipariş Detayları: #{currentOrder.id}</h2>

                {/* Başarı mesajı için Alert eklendi, hataları temizleme action'ı da doğru slice'tan */}
                {message && <Alert type="success" message={message} onClose={() => dispatch(clearOrderManagementError())} />}

                {editMode ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Durum:</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                                {orderStatusOptions.map(status => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="total_amount" className="block text-gray-700 text-sm font-bold mb-2">Toplam Tutar:</label>
                            <input
                                type="number"
                                id="total_amount"
                                name="total_amount"
                                value={formData.total_amount}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                step="0.01"
                            />
                        </div>
                        {/* Adres alanlarının backend'den ayrı ayrı geldiğini varsayarak input'ları ekliyoruz */}
                        <div>
                            <label htmlFor="shipping_address_street" className="block text-gray-700 text-sm font-bold mb-2">Sokak/Cadde:</label>
                            <input
                                type="text"
                                id="shipping_address_street"
                                name="shipping_address_street"
                                value={formData.shipping_address_street}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                        <div>
                            <label htmlFor="shipping_address_city" className="block text-gray-700 text-sm font-bold mb-2">Şehir:</label>
                            <input
                                type="text"
                                id="shipping_address_city"
                                name="shipping_address_city"
                                value={formData.shipping_address_city}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                        <div>
                            <label htmlFor="shipping_address_zip" className="block text-gray-700 text-sm font-bold mb-2">Posta Kodu:</label>
                            <input
                                type="text"
                                id="shipping_address_zip"
                                name="shipping_address_zip"
                                value={formData.shipping_address_zip}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                        <div>
                            <label htmlFor="shipping_address_country" className="block text-gray-700 text-sm font-bold mb-2">Ülke:</label>
                            <input
                                type="text"
                                id="shipping_address_country"
                                name="shipping_address_country"
                                value={formData.shipping_address_country}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                        <div>
                            <label htmlFor="payment_method" className="block text-gray-700 text-sm font-bold mb-2">Ödeme Yöntemi:</label>
                            <input
                                type="text"
                                id="payment_method"
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleFormChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditMode(false);
                                    // Formu orijinal değerlere sıfırla
                                    if (currentOrder) {
                                        setFormData({
                                            status: currentOrder.status || '',
                                            total_amount: currentOrder.total_amount || 0,
                                            shipping_address_street: currentOrder.shipping_address_street || '',
                                            shipping_address_city: currentOrder.shipping_address_city || '',
                                            shipping_address_zip: currentOrder.shipping_address_zip || '',
                                            shipping_address_country: currentOrder.shipping_address_country || '',
                                            payment_method: currentOrder.payment_method || '',
                                        });
                                    }
                                }}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Kaydet
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 mb-6">
                            <div>
                                <p><strong className="font-semibold">Kullanıcı:</strong> {currentOrder.user_username || currentOrder.user_email}</p>
                                <p><strong className="font-semibold">Toplam Tutar:</strong> ${parseFloat(currentOrder.total_amount).toFixed(2)}</p>
                                <p><strong className="font-semibold">Durum:</strong>
                                    <span className={`ml-2 px-2 py-1 rounded-md text-sm font-semibold
                                        ${currentOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                                        ${currentOrder.status === 'cancelled' || currentOrder.status === 'refunded' ? 'bg-red-100 text-red-800' : ''}
                                        ${currentOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${currentOrder.status === 'processing' || currentOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
                                    `}>
                                        {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                                    </span>
                                </p>
                                <p><strong className="font-semibold">Ödeme Yöntemi:</strong> {currentOrder.payment_method}</p>
                                <p><strong className="font-semibold">Sipariş Tarihi:</strong> {new Date(currentOrder.order_date).toLocaleDateString()} {new Date(currentOrder.order_date).toLocaleTimeString()}</p>
                                {currentOrder.updated_at && <p><strong className="font-semibold">Son Güncelleme:</strong> {new Date(currentOrder.updated_at).toLocaleDateString()} {new Date(currentOrder.updated_at).toLocaleTimeString()}</p>}
                            </div>
                            <div>
                                <p><strong className="font-semibold">Teslimat Adresi:</strong></p>
                                <p>{currentOrder.shipping_address_street}, {currentOrder.shipping_address_city}, {currentOrder.shipping_address_zip}, {currentOrder.shipping_address_country}</p>
                            </div>
                        </div>

                        <div className="flex justify-end mb-4">
                             <button
                                onClick={() => setEditMode(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Sipariş Bilgilerini Düzenle
                            </button>
                        </div>

                        {/* Sipariş Kalemleri */}
                        <div className="border-t pt-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Sipariş Kalemleri:</h3>
                            {currentOrder.items && currentOrder.items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                        <thead>
                                            <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                                                <th className="py-2 px-4 text-left">Ürün Adı</th>
                                                <th className="py-2 px-4 text-left">Miktar</th>
                                                <th className="py-2 px-4 text-left">Fiyat</th>
                                                <th className="py-2 px-4 text-left">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-700 text-sm font-light">
                                            {currentOrder.items.map(item => (
                                                <tr key={item.id} className="border-b border-gray-200">
                                                    <td className="py-2 px-4 flex items-center">
                                                        <img src={item.product_image_url || 'https://via.placeholder.com/40'} alt={item.product_name} className="w-10 h-10 object-cover rounded-md mr-2" />
                                                        {item.product_name}
                                                    </td>
                                                    <td className="py-2 px-4">{item.quantity}</td>
                                                    <td className="py-2 px-4">${parseFloat(item.price_at_order).toFixed(2)}</td>
                                                    <td className="py-2 px-4">${(item.quantity * parseFloat(item.price_at_order)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600">Bu sipariş için kalem bulunamadı.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetailModal;