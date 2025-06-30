// src/pages/User/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Düzeltme: getUserProfile ve updateUserProfile artık authSlice'dan export ediliyor
import { getUserProfile, updateUserProfile, clearAuthError, clearAuthMessage } from '../../features/auth/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // LoadingSpinner'ı import et
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, message } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
  });

  useEffect(() => {
    // Kullanıcı bilgisi Redux state'inde yoksa veya `loading` false ise (yükleme bittiyse)
    // ve user hala null ise, profil bilgilerini çek.
    // Bu, hem ilk yüklemede hem de login sonrası user objesi henüz ayarlanmamışsa tetiklenir.
    if (!user && !loading) {
      dispatch(getUserProfile());
    } else if (user) {
      // Kullanıcı bilgisi varsa formu doldur
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.first_name || '', // Backend'den gelen alan adlarına dikkat
        lastName: user.last_name || '',   // Backend'den gelen alan adlarına dikkat
        address: user.address || '',
        phoneNumber: user.phone_number || '', // Backend'den gelen alan adlarına dikkat
      });
    }
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [user, loading, dispatch]); // loading bağımlılığı eklendi

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());
    
    // Backend'e gönderilecek veri formatını ayarla
    const updateData = {
      username: formData.username,
      first_name: formData.firstName, // Backend'e uygun isim
      last_name: formData.lastName,   // Backend'e uygun isim
      address: formData.address,
      phone_number: formData.phoneNumber, // Backend'e uygun isim
    };

    dispatch(updateUserProfile(updateData));
  };

  // Yükleme durumunda spinner göster
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Profil yükleniyor..." />
      </div>
    );
  }

  // Hata durumunda veya kullanıcı objesi yoksa (yükleme bittiğinde)
  if (error && !user) {
    return <div className="text-center py-8 text-red-500">Profil bilgileri yüklenirken hata oluştu: {error}</div>;
  }

  // Kullanıcı objesi hala yoksa (yükleme bittikten sonra bile), giriş yapmaya yönlendir
  if (!user) {
    return (
      <div className="container mx-auto p-4 my-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Profilinizi görüntülemek için lütfen giriş yapın.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Giriş Yap
        </Link>
      </div>
    );
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
            <LoadingSpinner message="Güncelleniyor..." className="mt-4" /> // Spinner bileşenini kullan
          ) : (
            <Button type="submit" className="w-full mt-4">
              Profili Güncelle
            </Button>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Şifrenizi değiştirmek için{' '}
          <button
            onClick={() => navigate('/forgot-password')}
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