// src/App.jsx - Güncellenmiş ve Tam Hali (Değişiklik olmaması gereken yerlerde notlar var)

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from './features/auth/authSlice';

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
import ProductManagement from './pages/Admin/ProductManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';

// Layout Bileşenleri
import MainLayout from './components/layout/MainLayout'; // Yeni MainLayout bileşenini import et

// Koruma Bileşenleri
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Uygulama yüklendiğinde mevcut kullanıcıyı çek
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/*
          MainLayout bileşenini kullanarak Sidebar, Header ve Footer'ın
          görünmesini istediğimiz rotaları sarmalıyoruz.
          Bu, MainLayout içinde Header, Sidebar, ana içerik (Outlet ile)
          ve Footer'ın render edilmesini sağlar.
        */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} /> {/* Ana sayfa - URL '/' olduğunda HomePage render edilir */}
          <Route path="products" element={<ProductsPage />} /> {/* URL '/products' olduğunda ProductsPage render edilir */}
          <Route path="products/:productId" element={<ProductDetail />} /> {/* URL '/products/123' olduğunda ProductDetail render edilir */}
          <Route path="cart" element={<CartPage />} /> {/* URL '/cart' olduğunda CartPage render edilir */}
          
          {/* Kullanıcılar İçin Korunan Rotalar (Sidebar ile birlikte görünmesini istiyorsanız) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/my-orders" element={<OrdersPage />} />
            <Route path="/my-orders/:id" element={<OrderDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          </Route>
        </Route>

        {/*
          Header ve Footer'ı içermeyen veya farklı bir layout yapısı gerektiren rotalar.
          Örneğin Login, Register gibi tam ekran sayfalar. Bu rotalar MainLayout dışında kalır.
        */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Adminler İçin Korunan Rotalar (AdminRoute içinde kendi layout'u olabilir veya MainLayout dışında kalabilir) */}
        {/* Genellikle admin panellerinin farklı bir layout'u olduğu için MainLayout dışında tutmak iyi bir uygulamadır. */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          {/* Gelecekteki diğer admin rotaları buraya eklenebilir */}
        </Route>

        {/* Eşleşmeyen tüm rotalar için 404 Not Found sayfası */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;