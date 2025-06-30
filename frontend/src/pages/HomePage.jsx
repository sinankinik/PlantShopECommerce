// src/pages/HomePage.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom'; // Ürün detay sayfalarına yönlendirmek için
import { fetchProducts, clearProductError } from '../features/product/productSlice'; // Ürünleri çekmek için Redux slice'ı

const HomePage = () => {
  const dispatch = useDispatch();
  // Redux store'dan ürün state'ini seçiyoruz
  // `items` ürün dizisini, `loading` yüklenme durumunu, `error` hata mesajını tutar.
  const { items: products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);

  useEffect(() => {
    // Bileşen ilk yüklendiğinde (veya dispatch değiştiğinde) ürünleri çek.
    // Ana sayfa için genellikle belirli sayıda (örneğin ilk 8) popüler veya yeni ürünü çekmek yaygındır.
    // Eğer tüm ürünleri görmek isterseniz 'limit' parametresini kaldırabilirsiniz.
    dispatch(fetchProducts({ page: 1, limit: 8 }));

    // Bileşen unmount olduğunda veya yeniden render edildiğinde Redux'taki ürün hata durumunu temizle.
    return () => {
      dispatch(clearProductError());
    };
  }, [dispatch]); // `dispatch` dependency olarak eklenmeli.

  // Ürünler yüklenirken görüntülenecek kısım
  if (productsLoading && products.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center py-8">
        <p className="text-xl text-gray-700">Ürünler yükleniyor...</p>
        {/* İsterseniz buraya bir spinner veya yüklenme animasyonu ekleyebilirsiniz */}
      </div>
    );
  }

  // Ürün yüklenirken bir hata oluşursa görüntülenecek kısım
  if (productsError) {
    return (
      <div className="container mx-auto p-4 text-center py-8">
        <p className="text-xl text-red-600">Ürünler yüklenirken bir hata oluştu: {productsError}</p>
        <p className="text-md text-gray-600">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-extrabold text-center my-10 text-gray-900">Bitki Mağazasına Hoş Geldiniz!</h1>
      <p className="text-center text-lg text-gray-700 mb-12">
        En taze ve canlı bitkileri keşfedin. Evinizi veya ofisinizi yeşillendirin!
      </p>

      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 pb-2">Öne Çıkan Ürünler</h2>

      {/* Eğer ürün yoksa ve yükleme tamamlandıysa mesaj göster */}
      {products.length === 0 && !productsLoading ? (
        <p className="text-center text-xl text-gray-600 mt-10">Şu anda gösterilecek ürün bulunmamaktadır.</p>
      ) : (
        // Ürünler varsa grid yapısında listele
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 ease-in-out"
            >
              <Link to={`/products/${product.id}`} className="block">
                <img
                  src={product.image_url || 'https://via.placeholder.com/300x200?text=Ürün+Görseli+Yok'} // Eğer görsel yoksa placeholder kullan
                  alt={product.name}
                  className="w-full h-56 object-cover object-center"
                />
              </Link>
              <div className="p-5">
                <Link
                  to={`/products/${product.id}`}
                  className="block text-xl font-semibold text-gray-800 hover:text-blue-700 truncate mb-2"
                >
                  {product.name}
                </Link>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description ? product.description.substring(0, 80) + '...' : 'Açıklama mevcut değil.'}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-green-700">{product.price} TL</p>
                  {/* İsteğe bağlı olarak buraya "Sepete Ekle" butonu eklenebilir */}
                  {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
                                        Sepete Ekle
                                    </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tüm ürünleri görmek için bir CTA (Call to Action) butonu */}
      <div className="text-center mt-16 mb-8">
        <Link
          to="/products"
          className="inline-block bg-blue-600 text-white font-semibold text-lg py-3 px-10 rounded-full shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          Tüm Ürünlerimizi Keşfedin
        </Link>
      </div>
    </div>
  );
};

export default HomePage;