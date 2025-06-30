// src/components/layout/MainLayout.jsx
import React, { useEffect } from 'react'; // useEffect'i import et
import Header from './Header'; 
import Footer from './Footer'; 
import Sidebar from '../sidebar/Sidebar'; 
import { Outlet } from 'react-router-dom'; // Nested rotalar için Outlet'i import et

const MainLayout = ({ children }) => {
    // Console log ekleyelim
    useEffect(() => {
    }, []);

    return (
        <div className="App min-h-screen flex flex-col">
            <Header /> 
            <main className="flex flex-1">
                <Sidebar /> 
                <div className="flex-1 p-4">
                    {/* children yerine Outlet kullanıyoruz çünkü App.jsx'te nested route yapısı var */}
                    <Outlet /> 
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;