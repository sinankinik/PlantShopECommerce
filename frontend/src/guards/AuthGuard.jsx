// src/guards/AuthGuard.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; // Toast bildirimleri için

const AuthGuard = ({ allowedRoles }) => {
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
    const location = useLocation(); // Kullanıcının gelmek istediği orijinal yolu kaydetmek için

    // Kimlik doğrulama durumu yüklenirken bir yükleme göstergesi veya boş bir şey dönebiliriz.
    // Bu, sayfa yüklenirken anlık yönlendirmelerin önüne geçer.
    if (loading) {
        // İsterseniz burada bir LoadingSpinner bileşeni döndürebilirsiniz.
        // return <LoadingSpinner />;
        return null; // Şimdilik boş döndürelim
    }

    // Kullanıcı giriş yapmış mı?
    if (!isAuthenticated) {
        // Giriş yapmamışsa, giriş sayfasına yönlendir ve orijinal hedefi kaydet
        toast.error('Bu sayfaya erişmek için giriş yapmalısınız.');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Rol kontrolü: allowedRoles boş değilse ve kullanıcının rolü bu rollerden biri değilse
    if (allowedRoles && allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
        // Kullanıcının rolü izin verilen roller arasında değilse
        toast.warn('Bu sayfaya erişim yetkiniz yok.');
        // Kullanıcıyı yetkisiz sayfasına (veya ana sayfaya) yönlendir
        return <Navigate to="/" replace />; // Ana sayfaya veya özel bir "yetkisiz" sayfasına yönlendirilebilir.
    }

    // Tüm kontrollerden geçerse, hedef bileşeni render et
    return <Outlet />;
};

export default AuthGuard;