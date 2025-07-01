// src/components/Admin/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    createProduct,
    updateProduct,
    clearSelectedProduct,
    clearProductError
} from '../../features/product/productSlice';
import { fetchCategories } from '../../features/category/categorySlice'; // Kategorileri çekmek için

const ProductForm = () => {
    const dispatch = useDispatch();
    // Redux state'ten gerekli verileri çekiyoruz
    const { loading, error, selectedProduct } = useSelector((state) => state.products);
    const { items: categories } = useSelector((state) => state.categories); // Kategorileri çekiyoruz

    // Form alanları için state'ler
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [image, setImage] = useState(null); // Dosya objesini tutmak için
    const [imageUrlPreview, setImageUrlPreview] = useState(''); // Resim önizlemesi için
    const [hasVariants, setHasVariants] = useState(false); // Varyant desteği için

    const [isEditing, setIsEditing] = useState(false);

    // Bileşen yüklendiğinde veya categories değiştiğinde kategorileri çek
    useEffect(() => {
        if (categories.length === 0) { // Kategoriler henüz çekilmediyse çek
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    // selectedProduct değiştiğinde formu doldur
    useEffect(() => {
        if (selectedProduct) {
            setName(selectedProduct.name);
            setDescription(selectedProduct.description || '');
            setPrice(selectedProduct.price);
            setStockQuantity(selectedProduct.stock_quantity);
            setCategoryId(selectedProduct.category_id || ''); // category_id null olabilir
            setImageUrlPreview(selectedProduct.image_url || ''); // Mevcut resmin URL'ini göster
            setHasVariants(selectedProduct.has_variants === 1); // Backend'den 1 veya 0 gelebilir
            setIsEditing(true);
        } else {
            // selectedProduct temizlendiğinde formu sıfırla
            setName('');
            setDescription('');
            setPrice('');
            setStockQuantity('');
            setCategoryId('');
            setImage(null);
            setImageUrlPreview('');
            setHasVariants(false);
            setIsEditing(false);
        }
    }, [selectedProduct]);

    // Hata durumunda toast mesajı göster
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearProductError()); // Hatayı gösterdikten sonra temizle
        }
    }, [error, dispatch]);

    // Resim seçildiğinde önizleme oluştur
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImageUrlPreview(URL.createObjectURL(file)); // Yeni resmin önizlemesini oluştur
        } else {
            setImage(null);
            if (!selectedProduct || !selectedProduct.image_url) { // Eğer düzenleme modunda değilsek veya eski resim yoksa
                 setImageUrlPreview('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !price || !stockQuantity) {
            toast.error('Ürün adı, fiyatı ve stok miktarı zorunludur!');
            return;
        }
        if (isNaN(price) || price <= 0) {
            toast.error('Geçerli bir fiyat giriniz!');
            return;
        }
        if (isNaN(stockQuantity) || stockQuantity < 0) {
            toast.error('Geçerli bir stok miktarı giriniz!');
            return;
        }

        // FormData oluşturuyoruz çünkü dosya (resim) göndereceğiz
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', description.trim());
        formData.append('price', price);
        formData.append('stock_quantity', stockQuantity);
        
        // Kategori seçildiyse ekle
        if (categoryId) {
            formData.append('category_id', categoryId);
        } else {
            formData.append('category_id', ''); // Kategori seçilmediyse boş string gönder
        }

        // has_variants'ı boolean olarak ekle (backend 1/0 bekliyor olabilir)
        formData.append('has_variants', hasVariants ? 'true' : 'false'); // Backend'deki has_variants alanı için

        // Yeni bir resim seçildiyse FormData'ya ekle
        if (image) {
            formData.append('image', image);
        }
        // Eğer düzenleme modundayız ve yeni resim seçilmediyse ama eski resim varsa,
        // eski resmin URL'ini tekrar göndermeye gerek yok, backend zaten tutuyor.
        // Backend'deki updateProduct controller'ı sadece güncellenen alanları bekliyor.
        // Eğer resim güncellenmeyecekse image alanı FormData'ya eklenmez.

        try {
            if (isEditing) {
                // updateProduct thunk'ı: productId ve FormData
                await dispatch(updateProduct({ productId: selectedProduct.id, productData: formData })).unwrap();
                toast.success('Ürün başarıyla güncellendi!');
            } else {
                // createProduct thunk'ı: FormData
                await dispatch(createProduct(formData)).unwrap();
                toast.success('Ürün başarıyla eklendi!');
            }
            // Başarılı işlem sonrası formu temizle ve düzenleme modundan çık
            handleCancelEdit(); // Formu sıfırlayan fonksiyonu çağır
        } catch (err) {
            // Hata toast'ı zaten useEffect içinde gösteriliyor
            console.error('Ürün işlemi başarısız:', err);
        }
    };

    // Formu temizle ve düzenleme modundan çık
    const handleCancelEdit = () => {
        dispatch(clearSelectedProduct()); // Redux store'daki seçili ürünü temizle
        setName('');
        setDescription('');
        setPrice('');
        setStockQuantity('');
        setCategoryId('');
        setImage(null);
        setImageUrlPreview('');
        setHasVariants(false);
        setIsEditing(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
            </h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data"> {/* Resim yüklerken bu önemlidir */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                            Ürün Adı:
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">
                            Fiyat:
                        </label>
                        <input
                            type="number"
                            id="price"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            min="0.01" // Minimum fiyat
                            step="0.01" // 2 ondalık basamak
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="stockQuantity" className="block text-gray-700 text-sm font-bold mb-2">
                            Stok Miktarı:
                        </label>
                        <input
                            type="number"
                            id="stockQuantity"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            required
                            min="0" // Minimum stok miktarı
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
                            Kategori:
                        </label>
                        <select
                            id="category"
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={loading || categories.length === 0} // Kategoriler yüklenirken veya yoksa devre dışı bırak
                        >
                            <option value="">Kategori Seçin</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {categories.length === 0 && !loading && (
                            <p className="text-red-500 text-xs italic mt-1">
                                Hiç kategori bulunamadı. Lütfen önce kategori ekleyin.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-4 mt-4">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                        Açıklama:
                    </label>
                    <textarea
                        id="description"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                    ></textarea>
                </div>

                <div className="mb-4">
                    <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">
                        Ürün Resmi:
                    </label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*" // Sadece resim dosyalarını kabul et
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        onChange={handleImageChange}
                        disabled={loading}
                    />
                    {imageUrlPreview && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600">Resim Önizlemesi:</p>
                            <img src={imageUrlPreview} alt="Ürün Önizleme" className="w-32 h-32 object-cover rounded mt-1" />
                        </div>
                    )}
                </div>

                <div className="mb-6 flex items-center">
                    <input
                        type="checkbox"
                        id="hasVariants"
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        disabled={loading}
                    />
                    <label htmlFor="hasVariants" className="text-gray-700 text-sm font-bold">
                        Bu ürünün varyantları var (örn: renk, beden)
                    </label>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'İşleniyor...' : isEditing ? 'Ürünü Güncelle' : 'Ürün Ekle'}
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

export default ProductForm;