// src/components/common/Pagination.jsx
import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Sayfa numaralarını oluştur
    const pageNumbers = [];
    // Çok fazla sayfa varsa, sadece belirli bir aralığı gösterelim
    const maxPagesToShow = 5; // Gösterilecek maksimum sayfa sayısı

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Eğer son sayfalardaysak, başlangıcı ayarlayalım
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav className="flex justify-center items-center space-x-2 mt-6">
            {/* Önceki Sayfa Butonu */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Önceki
            </button>

            {/* İlk sayfa (...) durumu */}
            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        1
                    </button>
                    {startPage > 2 && (
                        <span className="px-4 py-2 text-gray-700">...</span>
                    )}
                </>
            )}

            {/* Sayfa Numaraları */}
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-4 py-2 rounded-md transition-colors
                        ${currentPage === number 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {number}
                </button>
            ))}

            {/* Son sayfa (...) durumu */}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="px-4 py-2 text-gray-700">...</span>
                    )}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        {totalPages}
                    </button>
                </>
            )}

            {/* Sonraki Sayfa Butonu */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Sonraki
            </button>
        </nav>
    );
};

export default Pagination;