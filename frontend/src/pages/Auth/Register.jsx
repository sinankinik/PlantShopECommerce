// src/pages/Auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Zaten giriş yapmışsa ana sayfaya yönlendir
    }
    // Component mount edildiğinde veya ayrıldığında hataları/mesajları temizle
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    if (message && message.includes('Kayıt başarılı!')) {
      // Kayıt başarılıysa, kullanıcıyı giriş sayfasına yönlendir veya mesaj göster
      alert(message); // Basit bir uyarı, Toastify gibi kütüphaneler daha iyidir
      navigate('/login');
    }
  }, [message, navigate]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError()); // Yeni istekten önce hatayı temizle
    dispatch(clearAuthMessage());

    if (formData.password !== formData.confirmPassword) {
      alert('Şifreler eşleşmiyor!'); // Basit doğrulama
      return;
    }

    const { username, email, password } = formData;
    dispatch(registerUser({ username, email, password }));
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Kayıt Ol</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Kullanıcı Adı"
            id="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
          />
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
          <Input
            label="Şifreyi Onayla"
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          {loading ? (
            <p className="text-center text-blue-600 mt-4">Yükleniyor...</p>
          ) : (
            <Button type="submit" className="w-full mt-4">
              Kayıt Ol
            </Button>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Zaten bir hesabınız var mı?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Giriş Yap
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;