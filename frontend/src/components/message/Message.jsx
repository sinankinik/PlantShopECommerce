// frontend/src/components/Message.jsx

import React from 'react';

/**
 * Kullanıcılara farklı türde mesajlar (başarı, hata, bilgi) göstermek için kullanılan bileşen.
 * Tailwind CSS ile stilize edilmiştir.
 *
 * @param {object} props - Bileşen özellikleri.
 * @param {'info' | 'success' | 'warning' | 'danger'} [props.variant='info'] - Mesajın türünü belirler.
 * - 'info': Mavi arka plan (varsayılan)
 * - 'success': Yeşil arka plan
 * - 'warning': Sarı arka plan
 * - 'danger': Kırmızı arka plan
 * @param {React.ReactNode} props.children - Mesaj içeriği.
 * @param {string} [props.className] - Ekstra Tailwind CSS sınıfları için.
 */
const Message = ({ variant = 'info', children, className }) => {
  // Mesaj türüne göre dinamik arka plan ve metin renkleri
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-400';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-400';
    }
  };

  return (
    <div
      className={`p-4 rounded-md border ${getVariantClasses()} ${className || ''}`}
      role="alert"
    >
      {children}
    </div>
  );
};

export default Message;
