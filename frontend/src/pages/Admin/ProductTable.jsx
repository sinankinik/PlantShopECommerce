// src/components/Admin/ProductTable.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    fetchProducts,
    fetchProductById, // Düzenleme için ürünü çekmek için
    deleteProduct, // Ürünü silmek için
    clearProductError // Hataları temizlemek için
} from '../../features/product/productSlice';
import { fetchCategories } from '../../features/category/categorySlice'; // Kategori filtrelemesi için kategorileri çekmek için

const ProductTable = () => {
    const dispatch = useDispatch();
    // Redux state'ten ürün verilerini çekiyoruz
    const { items: products, loading, error, pagination } = useSelector((state) => state.products);
    // Redux state'ten kategorileri çekiyoruz (filtreleme için)
    const { items: categories } = useSelector((state) => state.categories);

    // Filtreleme ve arama için yerel state'ler
    const [currentPage, setCurrentPage] = useState(pagination.page);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(''); // Kategori ID'si

    // Ürünleri ve kategorileri çek
    useEffect(() => {
        // Ürünleri mevcut sayfa, limit, arama ve kategori filtreleriyle çek
        dispatch(fetchProducts({ 
            page: currentPage, 
            limit: pagination.limit, 
            search: searchQuery, 
            category: selectedCategory 
        }));
    }, [dispatch, currentPage, pagination.limit, searchQuery, selectedCategory]);

    // Kategoriler henüz çekilmediyse çek
    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    // Hata durumunda toast mesajı göster
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearProductError());
        }
    }, [error, dispatch]);

    // Düzenleme butonuna tıklandığında
    const handleEdit = (productId) => {
        dispatch(fetchProductById(productId)); // Seçilen ürünü Redux state'ine yükle
        // ProductForm, selectedProduct state'ini izleyecek ve kendini dolduracaktır.
    };

    // Silme butonuna tıklandığında
    const handleDelete = async (productId) => {
        if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            try {
                await dispatch(deleteProduct(productId)).unwrap(); // Silme işlemini başlat
                toast.success('Ürün başarıyla silindi!');
                // Silme sonrası, mevcut sayfadaki ürün sayısının azalması durumunda 
                // sayfalama mantığını kontrol etmek ve gerekirse önceki sayfaya geçmek iyi olabilir.
                // Basitçe mevcut sayfayı yeniden yüklüyoruz.
                dispatch(fetchProducts({ 
                    page: currentPage, 
                    limit: pagination.limit, 
                    search: searchQuery, 
                    category: selectedCategory 
                }));
            } catch (err) {
                // Hata toast'ı zaten useEffect içinde gösteriliyor
                console.error('Ürün silme başarısız:', err);
            }
        }
    };

    // Sayfa değiştirme işlemleri
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Arama kutusu değiştiğinde
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    };

    // Kategori filtresi değiştiğinde
    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1); // Kategori değiştiğinde ilk sayfaya dön
    };

    if (loading && products.length === 0) {
        return <div className="text-center py-4">Ürünler yükleniyor...</div>;
    }

    if (error && products.length === 0) {
        return <div className="text-center py-4 text-red-600">Ürünler yüklenirken bir hata oluştu: {error}</div>;
    }

    if (products.length === 0 && !loading) {
        return <div className="text-center py-4 text-gray-600">Henüz hiç ürün bulunmamaktadır.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold mb-4">Mevcut Ürünler</h2>

            {/* Arama ve Kategori Filtresi */}
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                <input
                    type="text"
                    placeholder="Ürün Ara..."
                    className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                <select
                    className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline md:w-auto"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Resim
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Adı
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Fiyat
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Stok
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Varyantlı
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {product.id}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                                    {product.image_url ? (
                                        <img 
                                            src={`http://localhost:5000/${product.image_url}`} 
                                            alt={product.name} 
                                            className="w-12 h-12 object-cover rounded" 
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xs text-gray-500 rounded">
                                            Resim Yok
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {product.name}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    ${parseFloat(product.price).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {product.stock_quantity}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {product.categoryName || 'Belirtilmemiş'}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {product.has_variants ? 'Evet' : 'Hayır'}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                                    <button
                                        onClick={() => handleEdit(product.id)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs mr-2"
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs"
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Sayfalama Kontrolleri */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-6">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l ${currentPage === 1 || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Önceki
                    </button>
                    {[...Array(pagination.totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            disabled={loading}
                            className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 ${currentPage === index + 1 ? 'bg-blue-500 text-white' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages || loading}
                        className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r ${currentPage === pagination.totalPages || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Sonraki
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductTable;