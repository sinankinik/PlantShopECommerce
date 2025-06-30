// src/components/layout/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import Button from '../common/Button';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart); // <-- Sepet toplam miktarını al
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = user && (user.is_admin === 1 || user.role === 'admin');

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="bg-green-700 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          PlantShop
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/products" className="hover:text-green-200">
            Ürünler
          </Link>
          <Link to="/cart" className="hover:text-green-200 relative"> {/* <-- Sepet linki */}
            Sepet
            {totalQuantity > 0 && ( // totalQuantity 0'dan büyükse göster
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <span className="text-green-200">Hoş Geldin, {user?.username || 'Kullanıcı'}</span>
              <Link to="/profile" className="hover:text-green-200">
                Profil
              </Link>
              <Link to="/my-orders" className="hover:text-green-200">
                Siparişlerim
              </Link>
              {isAdmin && ( // Sadece admin ise bu linkleri göster
                <>
                  <Link to="/admin/products" className="hover:text-green-200">
                    Ürün Yönetimi
                  </Link>
                  <Link to="/admin/categories" className="hover:text-green-200">
                    Kategori Yönetimi
                  </Link>
                </>
              )}
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 text-sm">
                Çıkış Yap
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-green-200">
                Giriş Yap
              </Link>
              <Link to="/register" className="hover:text-green-200">
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
