import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

/**
 * Komponen Header untuk menampilkan informasi pengguna dan tombol logout.
 * Perbaikan: Menggunakan deklarasi "function" standar, bukan React.FC,
 * untuk konsistensi dengan praktik React modern.
 */
function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 z-30 w-full border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:ml-64">
            <div className="flex items-center justify-between">
                <div>
                    {/* Komponen Breadcrumbs atau judul halaman bisa ditambahkan di sini nanti */}
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                        <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{user?.role}</p>
                    </div>
                    <Button onClick={logout} variant="secondary">
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}

export default Header;