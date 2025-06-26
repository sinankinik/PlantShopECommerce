// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // Auth kontrolü yapılırken yükleniyor durumunu gösterebiliriz.
  // Gerçek uygulamalarda bu kısım daha detaylı spinner vb. içerebilir.
  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>; // Veya bir Spinner bileşeni
  }

  // Eğer kullanıcı giriş yapmamışsa, login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kullanıcı giriş yapmışsa, alt bileşenleri (Outlet) render et
  return <Outlet />;
};

export default ProtectedRoute;