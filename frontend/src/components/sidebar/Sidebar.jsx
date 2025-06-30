// src/components/Sidebar.jsx

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories } from '../../features/category/categorySlice';
import { Link, useLocation } from 'react-router-dom'; // Link ve useLocation hook'larını import et

const Sidebar = () => {
    const dispatch = useDispatch();
    const { items: categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);
    const location = useLocation(); // Mevcut URL bilgilerini almak için

    useEffect(() => {
        // Kategorileri sadece bir kere yükle
        if (categories.length === 0 && !categoriesLoading && !categoriesError) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories, categoriesLoading, categoriesError]);

    // Aktif kategoriyi URL'den al
    const currentCategoryParam = new URLSearchParams(location.search).get('category');

    return (
        <div className="w-64 bg-gray-100 p-4 shadow-md h-full"> {/* h-full ile tüm yüksekliği kapla */}
            <h3 className="text-xl font-bold mb-4 text-gray-800">Kategoriler</h3>
            {categoriesLoading && <p className="text-gray-600">Kategoriler yükleniyor...</p>}
            {categoriesError && <p className="text-red-500">Kategori yüklenirken hata: {categoriesError}</p>}
            
            <ul className="space-y-2">
                <li>
                    <Link
                        to="/products" // Tüm ürünleri gösteren rota
                        className={`block p-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors duration-200 ${!currentCategoryParam ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                    >
                        Tüm Ürünler
                    </Link>
                </li>
                {categories.map((category) => (
                    <li key={category.id}>
                        <Link
                            to={`/products?category=${category.id}`} // Kategoriye göre filtreleyen URL
                            className={`block p-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors duration-200 ${currentCategoryParam === String(category.id) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                        >
                            {category.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;