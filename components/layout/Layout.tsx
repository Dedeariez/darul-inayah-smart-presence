import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

/**
 * Komponen Layout utama yang membungkus halaman-halaman yang memerlukan
 * Sidebar dan Header.
 * Perbaikan: Menggunakan deklarasi "function" standar, bukan React.FC,
 * untuk konsistensi dengan praktik React modern.
 */
function Layout({ children }: LayoutProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Melewatkan state dan fungsi ke komponen anak */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <Header toggleSidebar={toggleSidebar} />
            
            {/* Menyesuaikan margin konten utama berdasarkan status sidebar */}
            <main className={`p-4 mt-16 transition-all duration-300 ${isSidebarOpen ? 'sm:ml-64' : 'sm:ml-0'}`}>
                {children}
            </main>
        </div>
    );
}

export default Layout;
