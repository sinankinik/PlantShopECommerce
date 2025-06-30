// src/components/common/AdminRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // Yükleniyor durumu
  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  // Kullanıcı giriş yapmamışsa veya admin değilse, giriş sayfasına veya ana sayfaya yönlendir
  // Backend'den gelen user objesinde `is_admin` veya `role` alanını kontrol edin.
  // SQL dosyanızda `is_admin` ve `role` alanları var, ikisini de kontrol edebiliriz.
  const isAdmin = user && (user.is_admin === 1 || user.role === 'admin');

  if (!isAuthenticated || !isAdmin) {
    // Eğer giriş yapmamışsa login'e, giriş yapmış ama admin değilse ana sayfaya yönlendirilebilir.
    // Bu örnekte direkt login'e yönlendiriyoruz, isterseniz ana sayfaya yönlendirebilirsiniz.
    return <Navigate to="/login" replace />;
  }

  // Kullanıcı giriş yapmış ve admin ise, alt bileşenleri (Outlet) render et
  return <Outlet />;
};

export default AdminRoute;