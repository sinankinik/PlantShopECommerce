// src/components/Layout.jsx (Yeni dosya)

import React from 'react';
import Navbar from './Navbar'; // Eğer bir Navbar'ınız varsa
import Sidebar from './Sidebar'; // Yeni oluşturduğumuz Sidebar

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* <Navbar /> -- Eğer bir navbar'ınız varsa buraya ekleyin */}
            <main className="flex-1 flex"> {/* flex-1 ile dikeyde tüm boşluğu kapla */}
                <Sidebar />
                <div className="flex-1 p-4"> {/* İçeriğin olduğu ana alan */}
                    {children}
                </div>
            </main>
            {/* Footer vb. buraya gelebilir */}
        </div>
    );
};

export default Layout;