// src/pages/User/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, updateUserProfile, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, message } = useSelector((state) => state.auth);

  // Kullanıcının mevcut bilgilerini başlangıç state'i olarak ayarla
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    // Şifre güncelleme için ayrı alanlar eklenebilir
  });

  useEffect(() => {
    // Eğer kullanıcı bilgisi Redux state'inde yoksa veya güncel değilse çek
    if (!user) {
      dispatch(getUserProfile());
    } else {
      // Kullanıcı bilgisi varsa formu doldur
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        address: user.address || '',
        phoneNumber: user.phone_number || '',
      });
    }
    // Component unmount edildiğinde veya yeni bir profil çekme isteği gönderilmeden önce hataları temizle
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [user, dispatch]); // user değiştiğinde veya component mount edildiğinde çalışır

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError()); // Yeni istekten önce hatayı temizle
    dispatch(clearAuthMessage());
    dispatch(updateUserProfile(formData));
  };

  if (loading && !user) {
    return <div className="text-center py-8">Profil yükleniyor...</div>;
  }

  if (error && !user) {
    return <div className="text-center py-8 text-red-500">Profil bilgileri yüklenirken hata oluştu: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Profilim</h2>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

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
            disabled // E-posta genellikle değiştirilemez veya özel bir doğrulama gerektirir
          />
          <Input
            label="Ad"
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
          />
          <Input
            label="Soyad"
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
          />
          <Input
            label="Adres"
            id="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
          />
          <Input
            label="Telefon Numarası"
            id="phoneNumber"
            type="text"
            value={formData.phoneNumber}
            onChange={handleChange}
          />

          {loading ? (
            <p className="text-center text-blue-600 mt-4">Güncelleniyor...</p>
          ) : (
            <Button type="submit" className="w-full mt-4">
              Profili Güncelle
            </Button>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Şifrenizi değiştirmek için{' '}
          <button
            onClick={() => navigate('/forgot-password')} // Şifre sıfırlama akışını kullanabiliriz
            className="text-blue-600 hover:underline focus:outline-none"
          >
            buraya tıklayın
          </button>
          .
        </p>
      </div>
    </div>
  );
};

export default UserProfile;