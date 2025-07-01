// src/components/Admin/CategoryTable.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchCategories,
    fetchCategoryById, // Düzenleme için kategoriyi çekmek için
    deleteCategory // Kategoriyi silmek için
} from '../../features/category/categorySlice';
import { toast } from 'react-toastify'; // Toast bildirimleri için

const CategoryTable = () => {
    const dispatch = useDispatch();
    const { items: categories, loading, error } = useSelector((state) => state.categories);

    // Kategorileri ilk yüklendiğinde ve başarılı bir işlem sonrası tekrar çek
    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Hata durumunda toast mesajı göster (sadece bu bileşene özgü hatalar için)
    useEffect(() => {
        if (error) {
            toast.error(error);
            // Burada clearCategoryError çağırmıyoruz çünkü bu genel bir hata ve form tarafında temizlenecek.
            // Sadece hata çıktısını sağlıyoruz.
        }
    }, [error]);

    // Düzenleme butonuna tıklandığında
    const handleEdit = (categoryId) => {
        dispatch(fetchCategoryById(categoryId)); // Seçilen kategoriyi Redux state'ine yükle
        // Form bu selectedCategory state'ini izleyecek ve kendini dolduracaktır.
    };

    // Silme butonuna tıklandığında
    const handleDelete = async (categoryId) => {
        if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            try {
                await dispatch(deleteCategory(categoryId)).unwrap(); // Silme işlemini başlat
                toast.success('Kategori başarıyla silindi!');
            } catch (err) {
                // Hata toast'ı zaten useEffect içinde gösteriliyor
                console.error('Kategori silme başarısız:', err);
            }
        }
    };

    if (loading && categories.length === 0) {
        return <div className="text-center py-4">Kategoriler yükleniyor...</div>;
    }

    if (error && categories.length === 0) {
        return <div className="text-center py-4 text-red-600">Kategoriler yüklenirken bir hata oluştu: {error}</div>;
    }

    if (categories.length === 0 && !loading) {
        return <div className="text-center py-4 text-gray-600">Henüz hiç kategori bulunmamaktadır.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Mevcut Kategoriler</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Adı
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Açıklama
                            </th>
                            <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {category.id}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {category.name}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                                    {category.description || 'Yok'}
                                </td>
                                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                                    <button
                                        onClick={() => handleEdit(category.id)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs mr-2"
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
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
        </div>
    );
};

export default CategoryTable;