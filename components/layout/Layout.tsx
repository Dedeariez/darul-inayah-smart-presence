
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <Header />
            <main className="p-4 sm:ml-64 mt-16">
                {children}
            </main>
        </div>
    );
};

export default Layout;
