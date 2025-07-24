
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 fixed w-full top-0 z-30 sm:ml-64">
            <div className="flex justify-between items-center">
                <div>
                    {/* Can add breadcrumbs or page title here later */}
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                    <Button onClick={logout} variant="secondary">
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;