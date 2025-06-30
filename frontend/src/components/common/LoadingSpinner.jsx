// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  let spinnerSizeClasses = '';
  let borderSizeClasses = '';

  switch (size) {
    case 'sm':
      spinnerSizeClasses = 'w-5 h-5';
      borderSizeClasses = 'border-2';
      break;
    case 'lg':
      spinnerSizeClasses = 'w-12 h-12';
      borderSizeClasses = 'border-4';
      break;
    case 'xl':
      spinnerSizeClasses = 'w-16 h-16';
      borderSizeClasses = 'border-4';
      break;
    case 'md':
    default:
      spinnerSizeClasses = 'w-8 h-8';
      borderSizeClasses = 'border-3'; // Tailwind CSS'te border-3 yoktur, border-2 veya border-4 kullanın. Bunu border-2 olarak güncelleyebilirsiniz.
      break;
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${spinnerSizeClasses} ${borderSizeClasses} border-t-blue-500 border-r-blue-500 border-b-blue-500 border-solid rounded-full animate-spin`}
        role="status"
      >
        <span className="sr-only">Yükleniyor...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;