// src/pages/Admin/CategoryManagement.jsx
import React from 'react';
// Import yollarını düzeltildi: bileşenler 'components' klasöründe olduğundan '../components/Admin' kullanıyoruz
import CategoryForm from './CategoryForm'; 
import CategoryTable from './CategoryTable'; 

const CategoryManagement = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center my-8">Kategori Yönetimi (Admin)</h1>
            
            {/* Kategori Ekle/Düzenle Formu */}
            <CategoryForm />

            {/* Kategori Listesi Tablosu */}
            <CategoryTable /> {/* Yorum satırını kaldırıldı ve bileşen eklendi */}
        </div>
    );
};

export default CategoryManagement;