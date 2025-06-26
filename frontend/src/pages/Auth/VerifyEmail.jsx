// src/pages/Auth/VerifyEmail.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';

const VerifyEmail = () => {
  const { token } = useParams(); // URL'den token'ı al
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(verifyEmail(token));
    } else {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
      // Geçersiz token veya token yoksa hata göster
      // dispatch(setError('Doğrulama bağlantısı geçersiz veya eksik.'));
    }
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [token, dispatch]);

  useEffect(() => {
    if (message && message.includes('E-posta başarıyla doğrulandı!')) {
      alert(message);
      navigate('/login'); // Doğrulama sonrası giriş sayfasına yönlendir
    }
  }, [message, navigate]);


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">E-posta Doğrulama</h2>
        {loading && <p className="text-blue-600">E-posta doğrulanıyor...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-600">{message}</p>}
        {!loading && !error && !message && token && (
          <p className="text-gray-700">E-posta doğrulama linkiniz işleniyor...</p>
        )}
        {!token && !loading && <p className="text-red-500">Doğrulama bağlantısı bulunamadı.</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;