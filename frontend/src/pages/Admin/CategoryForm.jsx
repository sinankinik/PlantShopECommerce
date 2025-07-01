// src/components/Admin/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    // categorySlice.js dosyasındaki export isimleriyle eşleştirildi:
    createCategory, // createCategory olarak import edildi
    updateCategory, // updateCategory olarak import edildi
    fetchCategoryById, // Yeni eklenen thunk'ı da import etmeyi unutmayın
    clearSelectedCategory,
    clearCategoryError
} from '../../features/category/categorySlice';
import { toast } from 'react-toastify'; // Toast bildirimleri için

const CategoryForm = () => {
    const dispatch = useDispatch();
    const { loading, error, selectedCategory } = useSelector((state) => state.categories);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // selectedCategory değiştiğinde formu doldur
    useEffect(() => {
        if (selectedCategory) {
            setName(selectedCategory.name);
            setDescription(selectedCategory.description || ''); // Açıklama olmayabilir
            setIsEditing(true);
        } else {
            // selectedCategory temizlendiğinde formu sıfırla
            setName('');
            setDescription('');
            setIsEditing(false);
        }
    }, [selectedCategory]);

    // Hata durumunda toast mesajı göster
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearCategoryError()); // Hatayı gösterdikten sonra temizle
        }
    }, [error, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Kategori adı boş olamaz!');
            return;
        }

        const categoryData = { name: name.trim(), description: description.trim() };

        try {
            if (isEditing) {
                // updateCategory thunk'ı doğru isimle çağrıldı
                await dispatch(updateCategory({ categoryId: selectedCategory.id, categoryData })).unwrap();
                toast.success('Kategori başarıyla güncellendi!');
            } else {
                // createCategory thunk'ı doğru isimle çağrıldı
                await dispatch(createCategory(categoryData)).unwrap();
                toast.success('Kategori başarıyla eklendi!');
            }
            // Başarılı işlem sonrası formu temizle ve düzenleme modundan çık
            setName('');
            setDescription('');
            setIsEditing(false);
            dispatch(clearSelectedCategory()); // Redux store'daki seçili kategoriyi temizle
        } catch (err) {
            // Hata toast'ı zaten useEffect içinde gösteriliyor
            console.error('Kategori işlemi başarısız:', err);
        }
    };

    // Formu temizle ve düzenleme modundan çık
    const handleCancelEdit = () => {
        dispatch(clearSelectedCategory());
        setName('');
        setDescription('');
        setIsEditing(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
            </h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                        Kategori Adı:
                    </label>
                    <input
                        type="text"
                        id="name"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading} // İşlem devam ederken devre dışı bırak
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                        Açıklama: (Opsiyonel)
                    </label>
                    <textarea
                        id="description"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading} // İşlem devam ederken devre dışı bırak
                    ></textarea>
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'İşleniyor...' : isEditing ? 'Kategoriyi Güncelle' : 'Kategori Ekle'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className={`ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={loading}
                        >
                            İptal
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;