// frontend/src/pages/Admin/AdminDashboard.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaShoppingCart, FaUsers, FaTag, FaClipboardList, FaMoneyBillWave, FaBoxOpen } from 'react-icons/fa';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

// İlgili Redux slice action'larını import edin
import { getAllOrders } from '../../features/order/orderManagementSlice';
import { fetchUsers } from '../../features/user/userSlice';
import { fetchProducts } from '../../features/product/productSlice';
import { getAllCoupons } from '../../features/coupon/couponManagementSlice'; // Kupon slice'ını dahil edelim.

const AdminDashboard = () => {
    const dispatch = useDispatch();

    // Redux store'dan ilgili slice'ların state'lerini çekiyoruz.
    // Her slice'ın kendi yükleme (loading) ve hata (error) durumlarını izliyoruz.
    const { orders, loading: ordersLoading, error: ordersError } = useSelector((state) => state.orderManagement || {});
    const { items: users, loading: usersLoading, error: usersError } = useSelector((state) => state.users || {});
    const { items: products, loading: productsLoading, error: productsError } = useSelector((state) => state.products || {});
    // Kuponlar için CORRECTED useSelector yolu: state.couponManagement'tan çekiyoruz.
    // Console çıktınızda 'couponManagement: Object { coupons: [], ... }' olduğunu görmüştük.
    // Bu, 'couponManagement' state'inin altında 'coupons' dizisinin olduğunu gösterir.
    const { coupons, loading: couponsLoading, error: couponsError } = useSelector((state) => state.couponManagement || {});


    // Bileşen yüklendiğinde ve sadece bir kez tüm verileri çekecek.
    useEffect(() => {
        dispatch(getAllOrders({}));
        dispatch(fetchUsers({}));
        dispatch(fetchProducts({}));
        dispatch(getAllCoupons()); // Kuponları da çek
    }, [dispatch]);

    // Hata durumlarını kontrol et ve kullanıcıya toast bildirimleriyle göster.
    useEffect(() => {
        if (ordersError) toast.error(`Siparişler yüklenirken hata: ${ordersError.message || ordersError}`);
        if (usersError) toast.error(`Kullanıcılar yüklenirken hata: ${usersError.message || usersError}`);
        if (productsError) toast.error(`Ürünler yüklenirken hata: ${productsError.message || productsError}`);
        if (couponsError) toast.error(`Kuponlar yüklenirken hata: ${couponsError.message || couponsError}`);
    }, [ordersError, usersError, productsError, couponsError]);

    // Tüm verilerin yüklenip yüklenmediğini kontrol etmek için genel bir yükleme durumu.
    const isLoading = ordersLoading || usersLoading || productsLoading || couponsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[80vh]">
                <LoadingSpinner />
                <p className="ml-3 text-gray-600">Veriler yükleniyor...</p>
            </div>
        );
    }

    // --- Dashboard İstatistiklerini Hesaplama ---
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCoupons = Array.isArray(coupons) ? coupons : []; // 'coupons' artık doğru yoldan geliyor


    const totalOrders = safeOrders.length;
    const totalRevenue = safeOrders
        .filter(order => order.isPaid)
        .reduce((acc, order) => acc + (order.totalPrice || 0), 0);
    const totalUsers = safeUsers.length;
    const totalProducts = safeProducts.length;

    // Kupon objenizdeki aktiflik durumunu belirten alana göre filtrelemeyi yapın.
    // Önceki paylaşımlarınızda 'isActive' alanının olduğunu varsayıyorum.
    const activeCoupons = safeCoupons.filter(coupon => coupon.isActive).length;

    const pendingOrders = safeOrders.filter(order => order.orderStatus === 'Pending').length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newOrdersLast7Days = safeOrders
        .filter(order => new Date(order.createdAt) >= sevenDaysAgo)
        .length;

    const dashboardStats = [
        { id: 1, title: 'Toplam Sipariş', value: totalOrders, icon: <FaShoppingCart className="text-blue-500" />, description: 'Sistemdeki toplam sipariş sayısı' },
        { id: 2, title: 'Toplam Kullanıcı', value: totalUsers, icon: <FaUsers className="text-green-500" />, description: 'Kayıtlı toplam kullanıcı sayısı' },
        { id: 3, title: 'Toplam Gelir (TL)', value: `₺${Number(totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <FaMoneyBillWave className="text-purple-500" />, description: 'Ödenmiş siparişlerden elde edilen toplam gelir' },
        { id: 4, title: 'Aktif Kupon', value: activeCoupons, icon: <FaTag className="text-yellow-500" />, description: 'Şu an aktif olan indirim kuponu' },
        { id: 5, title: 'Bekleyen Sipariş', value: pendingOrders, icon: <FaClipboardList className="text-red-500" />, description: 'Gönderilmeyi bekleyen siparişler' },
        { id: 6, title: 'Toplam Ürün', value: totalProducts, icon: <FaBoxOpen className="text-indigo-500" />, description: 'Sistemdeki toplam ürün sayısı' },
        { id: 7, title: 'Yeni Sipariş (Son 7 Gün)', value: newOrdersLast7Days, icon: <FaShoppingCart className="text-teal-500" />, description: 'Son 7 günde gelen yeni siparişler' },
    ];

    if (!isLoading && totalOrders === 0 && totalUsers === 0 && totalProducts === 0 && activeCoupons === 0) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh] flex justify-center items-center text-gray-600">
                <p>Dashboard verileri şu an için boş. Lütfen backend'inizde veri olup olmadığını ve API çağrılarınızın başarılı olduğunu kontrol edin.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-[80vh]">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Yönetici Paneli Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {dashboardStats.map((stat) => (
                    <div key={stat.id} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg shadow-lg flex items-center space-x-4 border border-gray-100 transform transition duration-300 hover:scale-[1.02] hover:shadow-xl">
                        <div className="text-4xl p-3 bg-gray-100 rounded-full flex items-center justify-center">
                            {stat.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Hızlı Bağlantılar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button onClick={() => alert('Sipariş Yönetimi sayfasına git')} className="bg-blue-100 text-blue-800 p-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-200 transition duration-300">
                        <FaClipboardList /> <span>Siparişleri Görüntüle</span>
                    </button>
                    <button onClick={() => alert('Ürün Yönetimi sayfasına git')} className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-200 transition duration-300">
                        <FaBoxOpen /> <span>Ürünleri Yönet</span>
                    </button>
                    <button onClick={() => alert('Kullanıcıları Yönet sayfasına git')} className="bg-purple-100 text-purple-800 p-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-200 transition duration-300">
                        <FaUsers /> <span>Kullanıcıları Yönet</span>
                    </button>
                    <button onClick={() => alert('Kupon Yönetimi sayfasına git')} className="bg-yellow-100 text-yellow-800 p-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-yellow-200 transition duration-300">
                        <FaTag /> <span>Kuponları Yönet</span>
                    </button>
                </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Son Aktiviteler</h2>
                <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center space-x-2"><span className="text-green-500">•</span> Yeni sipariş #202400123 alındı.</li>
                    <li className="flex items-center space-x-2"><span className="text-blue-500">•</span> "Nike Air Max 270" ürünü güncellendi.</li>
                    <li className="flex items-center space-x-2"><span className="text-yellow-500">•</span> "BAYRAM25" kupon kodu oluşturuldu.</li>
                    <li className="flex items-center space-x-2"><span className="text-red-500">•</span> Kullanıcı "ali.veli@example.com" askıya alındı.</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;