// src/pages/Auth/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ResetPassword = () => {
  const { token } = useParams(); // URL'den token'ı al
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.auth);

  useEffect(() => {
    // Component mount edildiğinde veya ayrıldığında hataları/mesajları temizle
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [dispatch]);

  useEffect(() => {
    if (message && message.includes('Şifreniz başarıyla sıfırlandı!')) {
      alert(message);
      navigate('/login'); // Şifre sıfırlama sonrası giriş sayfasına yönlendir
    }
  }, [message, navigate]);


  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());

    if (newPassword !== confirmPassword) {
      alert('Şifreler eşleşmiyor!');
      return;
    }

    dispatch(resetPassword({ token, newPassword }));
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Şifreyi Sıfırla</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Yeni Şifre"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Yeni Şifreyi Onayla"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          {loading ? (
            <p className="text-center text-blue-600 mt-4">Sıfırlanıyor...</p>
          ) : (
            <Button type="submit" className="w-full mt-4">
              Şifreyi Sıfırla
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;