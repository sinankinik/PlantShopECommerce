// src/pages/Auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Başarılı girişten sonra ana sayfaya yönlendir
    }
    // Component mount edildiğinde veya ayrıldığında hataları/mesajları temizle
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError()); // Yeni istekten önce hatayı temizle
    dispatch(loginUser(formData));
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Giriş Yap</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="E-posta"
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Şifre"
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          {loading ? (
            <p className="text-center text-blue-600 mt-4">Yükleniyor...</p>
          ) : (
            <Button type="submit" className="w-full mt-4">
              Giriş Yap
            </Button>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Hesabınız yok mu?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Kayıt Ol
          </button>
        </p>
        <p className="text-center text-sm text-gray-600 mt-2">
          <button
            onClick={() => navigate('/forgot-password')} // Bu sayfayı sonra oluşturacağız
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Şifremi Unuttum
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;