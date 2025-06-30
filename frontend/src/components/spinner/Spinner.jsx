// frontend/src/components/Spinner.jsx

import React from 'react';

/**
 * Yükleme durumunu belirtmek için kullanılan basit bir spinner bileşeni.
 * Tailwind CSS ile stilize edilmiştir.
 */
const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div
        className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"
        role="status"
      >
        {/* Ekran okuyucular için görsel olarak gizlenmiş metin */}
        <span className="sr-only">Yükleniyor...</span>
      </div>
    </div>
  );
};

export default Spinner;
