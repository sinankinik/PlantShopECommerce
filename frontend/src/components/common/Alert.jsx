// src/components/common/Alert.jsx
import React, { useEffect } from 'react';

const Alert = ({ message, type = 'info', onClose }) => {
  let bgColor = '';
  let textColor = '';
  let borderColor = '';

  switch (type) {
    case 'success':
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      borderColor = 'border-green-400';
      break;
    case 'error':
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      borderColor = 'border-red-400';
      break;
    case 'warning':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      borderColor = 'border-yellow-400';
      break;
    default:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
      borderColor = 'border-blue-400';
  }

  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5 saniye sonra otomatik kapanır
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`relative ${bgColor} ${textColor} border ${borderColor} px-4 py-3 rounded-lg shadow-md mb-4`} role="alert">
      <span className="block sm:inline">{message}</span>
      {onClose && (
        <span onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer">
          <svg className={`fill-current h-6 w-6 ${textColor}`} role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
        </span>
      )}
    </div>
  );
};

export default Alert;