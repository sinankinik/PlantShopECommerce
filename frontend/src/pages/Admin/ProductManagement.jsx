// src/pages/Admin/ProductManagement.jsx
import React from 'react';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable'; // ProductTable'ı import edin

const ProductManagement = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center my-8">Ürün Yönetimi (Admin)</h1>
            
            {/* Ürün Ekle/Düzenle Formu */}
            <ProductForm />

            {/* Ürün Listesi Tablosu */}
            <ProductTable /> {/* Yorum satırını kaldırıldı ve bileşen eklendi */}
        </div>
    );
};

export default ProductManagement;