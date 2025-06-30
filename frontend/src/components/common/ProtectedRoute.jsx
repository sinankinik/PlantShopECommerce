// src/components/common/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { fetchCurrentUser } from '../../features/auth/authSlice'; // Yeni thunk'ı import edin

const ProtectedRoute = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Eğer kimlik doğrulanmışsa (token var) ama kullanıcı objesi yoksa ve yükleme devam etmiyorsa, çek
    // loading kontrolü, zaten fetchCurrentUser çalışıyorsa tekrar tetiklemeyi önler.
    if (isAuthenticated && !user && !loading) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, loading, dispatch]);

  // Eğer `authSlice` yükleme durumundaysa (kullanıcı bilgileri çekiliyor olabilir), spinner göster
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Kullanıcı bilgileri yükleniyor..." />
      </div>
    );
  }

  // Kimlik doğrulanmamışsa (token yok veya geçersizse) login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kimlik doğrulanmış ancak user objesi hala null ise (beklenmedik bir durum, ama olası)
  // Bu durum, `fetchCurrentUser`'ın başarısız olduğu veya henüz tamamlanmadığı anlamına gelebilir.
  // Bu noktada spinner göstermek veya login'e yönlendirmek mantıklı olabilir.
  // Güvenli bir varsayım olarak, eğer isAuthenticated true ama user null ise, henüz hazır değiliz demektir.
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Kullanıcı verileri hazırlanıyor..." />
      </div>
    );
  }

  // Her şey yolundaysa, alt rotaları render et (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;