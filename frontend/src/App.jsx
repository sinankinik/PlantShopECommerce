// frontend/src/App.jsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './features/auth/authSlice';

// Toast kütüphanesini import edin
import { ToastContainer } from 'react-toastify';
// Toast CSS stilini import edin (önemli!)
import 'react-toastify/dist/ReactToastify.css';

// Genel Sayfalar
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// Ürün Sayfaları
import ProductsPage from './pages/Product/ProductList';
import ProductDetail from './pages/Product/ProductDetail';

// Kimlik Doğrulama (Auth) Sayfaları
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';

// Kullanıcı Sayfaları (Korunan Rotalar)
import UserProfile from './pages/User/UserProfile';
import OrdersPage from './pages/User/OrdersPage';
import OrderDetailPage from './pages/Order/OrderDetailPage';
import CartPage from './pages/Cart/CartPage';

// Ödeme ve Sipariş Sayfaları (Korunan Rotalar)
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderSuccessPage from './pages/Order/OrderSuccessPage';

// Admin Sayfaları (Admin Rotaları)
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductManagement from './pages/Admin/ProductManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import UserManagement from './pages/Admin/UserManagement';
import ReportDashboard from './pages/Admin/ReportDashboard';
import OrderManagement from './pages/Admin/OrderManagement';
import CouponManagement from './pages/Admin/CouponManagement';
import PromotionManagement from './pages/Admin/PromotionManagement';
import CartManagement from './pages/Admin/CartManagement';
import EmailMarketingPage from './pages/Admin/EmailMarketingPage';
import ReviewManagementPage from './pages/Admin/ReviewManagementPage';

// Layout Bileşenleri
import MainLayout from './components/layout/MainLayout'; // Yeni MainLayout bileşenini import edin
import AdminDashboardLayout from './components/layout/AdminDashboardLayout'; // <-- YOL GÜNCELLENDİ

// Koruma Bileşenleri
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute'; // Eğer özel bir AdminRoute kullanıyorsanız
import AuthGuard from './guards/AuthGuard';

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    return (
        <Router>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/:productId" element={<ProductDetail />} />
                    <Route path="cart" element={<CartPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/my-orders" element={<OrdersPage />} />
                        <Route path="/my-orders/:id" element={<OrderDetailPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                    </Route>
                </Route>

                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                {/* Adminler İçin Korunan Rotalar */}
                <Route element={<AuthGuard allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminDashboardLayout />}> {/* <-- YOL GÜNCELLENDİ */}
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<ProductManagement />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="categories" element={<CategoryManagement />} />
                        <Route path="reports" element={<ReportDashboard />} />
                        <Route path="orders" element={<OrderManagement />} />
                        <Route path="coupons" element={<CouponManagement />} />
                        <Route path="promotion" element={<PromotionManagement />} />
                        <Route path="cart-management" element={<CartManagement />} />
                        <Route path="email-marketing" element={<EmailMarketingPage />} />
                        <Route path="reviews" element={<ReviewManagementPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;