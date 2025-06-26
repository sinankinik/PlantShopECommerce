// src/pages/Auth/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());
    dispatch(forgotPassword(email));
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Şifremi Unuttum</h2>
        <p className="text-center text-gray-600 mb-4">
          Şifrenizi sıfırlamak için e-posta adresinizi girin.
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            label="E-posta"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
          {loading ? (
            <p className="text-center text-blue-600 mt-4">Gönderiliyor...</p>
          ) : (
            <Button type="submit" className="w-full mt-4">
              Şifre Sıfırlama Bağlantısı Gönder
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;