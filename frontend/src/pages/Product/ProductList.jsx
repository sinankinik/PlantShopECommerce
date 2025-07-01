// src/pages/Product/ProductList.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, clearProductError } from '../../features/product/productSlice';
import { fetchCategories, clearCategoryError } from '../../features/category/categorySlice'; 
import { Link, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ProductList = () => {
    const dispatch = useDispatch();
    const location = useLocation();

    const { items: products, loading: productsLoading, error: productsError, pagination } = useSelector((state) => state.products);
    const { items: categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);

    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchCategories());
        return () => {
            dispatch(clearProductError());
            dispatch(clearCategoryError());
        };
    }, [dispatch]);

    useEffect(() => {
        const params = {
            page: currentPage,
            limit: 10,
        };
        if (categoryParam) {
            params.category = categoryParam;
        }
        if (searchTerm) {
            params.search = searchTerm;
        }
        dispatch(fetchProducts(params));
    }, [dispatch, categoryParam, searchTerm, currentPage]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const currentCategory = categories.find(cat => cat.slug === categoryParam || String(cat.id) === categoryParam);

    const pageTitle = categoryParam 
        ? (currentCategory ? `Kategori: ${currentCategory.name}` : 'Kategori Yükleniyor...')
        : 'Tüm Ürünler';

    if (productsLoading && products.length === 0) {
        return <div className="text-center py-8">Ürünler yükleniyor...</div>;
    }

    if (productsError) {
        return <div className="text-center py-8 text-red-500">Ürünler yüklenirken hata oluştu: {productsError}</div>;
    }

    if (categoriesLoading && !currentCategory && categoryParam) {
        return <div className="text-center py-8">Kategoriler yükleniyor...</div>;
    }

    if (categoriesError) {
        return <div className="text-center py-8 text-red-500">Kategoriler yüklenirken hata oluştu: {categoriesError}</div>;
    }

    return (
        <div className="container mx-auto p-4 flex">
            <div className="flex-1 ml-4">
                <h1 className="text-3xl font-bold text-center my-8">
                    {pageTitle}
                </h1>

                <div className="flex flex-col md:flex-row justify-end items-center mb-6 space-y-4 md:space-y-0">
                    <div className="w-full md:w-1/3">
                        <Input
                            id="search"
                            type="text"
                            placeholder="Ürün ara..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full"
                            label="Ürün Ara:"
                        />
                    </div>
                </div>

                {products.length === 0 && !productsLoading ? (
                    <p className="text-center text-gray-600">Gösterilecek ürün bulunamadı.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <Link to={`/products/${product.id}`}>
                                    <img
                                        src={product.image_url ? `http://localhost:5000/${product.image_url.replace(/\\/g, '/')}` : 'https://via.placeholder.com/250'}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </Link>
                                <div className="p-4">
                                    <Link to={`/products/${product.id}`} className="block text-lg font-semibold text-gray-800 hover:text-blue-600 truncate">
                                        {product.name}
                                    </Link>
                                    <p className="text-gray-600 text-sm mb-2">{product.description?.substring(0, 70)}...</p>
                                    <p className="text-xl font-bold text-green-700">{product.price} TL</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sayfalama (Pagination) */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-8 space-x-2">
                        <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="bg-gray-300 text-gray-800 hover:bg-gray-400"
                        >
                            Önceki
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, index) => (
                            <Button
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}
                            >
                                {index + 1}
                            </Button>
                        ))}
                        <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.totalPages}
                            className="bg-gray-300 text-gray-800 hover:bg-gray-400"
                        >
                            Sonraki
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductList;