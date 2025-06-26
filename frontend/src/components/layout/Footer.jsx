// src/components/layout/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-auto">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} PlantShop E-ticaret. Tüm Hakları Saklıdır.</p>
      </div>
    </footer>
  );
};

export default Footer;