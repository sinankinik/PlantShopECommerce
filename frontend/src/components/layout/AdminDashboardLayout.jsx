// src/layouts/AdminDashboardLayout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice'; // Çıkış yapmak için
// React Icons'tan gerekli tüm simgeleri import et
import {
    FaUsers,
    FaBox,
    FaTags,
    FaSignOutAlt,
    FaHome,
    FaClipboardList,
    FaChartBar,
    FaTag, // Kuponlar için
    FaBullhorn // Promosyonlar için (gelecekte)
} from 'react-icons/fa';

const AdminDashboardLayout = () => {
    const dispatch = useDispatch();
    const location = useLocation(); // Mevcut yolu almak için
    const { user } = useSelector((state) => state.auth); // Kullanıcı bilgilerini almak için

    // Çıkış yapma fonksiyonu
    const handleLogout = () => {
        dispatch(logoutUser());
    };

    // Yalnızca admin rolüne sahipse dashboard'u göster
    // AuthGuard zaten bu kontrolü yaptığı için, burası genelde null döner.
    // Ancak doğrudan bu layout'a erişim olursa diye kontrolü tutmak iyi olabilir.
    if (!user || user.role !== 'admin') {
        return null;
    }

    // Navigasyon öğeleri listesi, sizin verdiğiniz App.jsx listesine göre ayarlandı.
    const navItems = [
        { name: 'Dashboard', icon: FaHome, path: '/admin' }, // Ana admin yolu
        { name: 'Ürün Yönetimi', icon: FaBox, path: '/admin/products' },
        { name: 'Kullanıcı Yönetimi', icon: FaUsers, path: '/admin/users' },
        { name: 'Kategori Yönetimi', icon: FaTags, path: '/admin/categories' },
        { name: 'Raporlar', icon: FaChartBar, path: '/admin/reports' },
        { name: 'Sipariş Yönetimi', icon: FaClipboardList, path: '/admin/orders' },
        { name: 'İndirim Kuponları', icon: FaTag, path: '/admin/coupons' },
        { name: 'Promosyonlar', icon: FaTag, path: '/admin/promotions' },
        // Gelecekteki diğer admin rotaları için yer tutucular
        // { name: 'Promosyon Yönetimi', icon: FaBullhorn, path: '/admin/promotions' },
    ];

    // Mevcut yola göre başlık belirleme
    const getPageTitle = () => {
        const currentPath = location.pathname;
        // Tam eşleşme veya alt yol eşleşmesi için kontrol
        const activeItem = navItems.find(item => 
            currentPath === item.path || 
            (currentPath.startsWith(item.path) && currentPath.length > item.path.length && currentPath[item.path.length] === '/')
        );
        if (activeItem) {
            return activeItem.name;
        }
        return 'Admin Paneli'; // Varsayılan başlık
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar (Yan Menü) */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-gray-700">
                    Admin Paneli
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                                // `startsWith` kullanarak alt rotaları da kapsa
                                (location.pathname === item.path || 
                                 (location.pathname.startsWith(item.path) && location.pathname.length > item.path.length && location.pathname[item.path.length] === '/'))
                                ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`}
                        >
                            <item.icon className="mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                    >
                        <FaSignOutAlt className="mr-2" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header/Navbar */}
                <header className="flex justify-between items-center p-4 bg-white shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {getPageTitle()} {/* Dinamik başlık */}
                    </h2>
                    <div className="flex items-center">
                        <span className="text-gray-700 mr-2">Hoşgeldin, {user?.username} ({user?.role})</span>
                        {/* Kullanıcı profili veya bildirim ikonları eklenebilir */}
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet /> {/* Nested rotaların içeriği burada render edilecek */}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardLayout;