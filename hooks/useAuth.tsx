
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await api.auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        if ((error as Error).message === 'RLS_RECURSION_ERROR') {
          setStartupError("Gagal memuat sesi pengguna karena kesalahan konfigurasi database (rekursi RLS). Silakan jalankan script SQL terbaru dari file README.md di editor SQL Supabase Anda untuk memperbaikinya.");
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const loggedInUser = await api.auth.login(email, pass);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  if (startupError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
            <svg className="mx-auto mb-4 h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Kesalahan Konfigurasi Database</h1>
            <p className="text-gray-600 dark:text-gray-300">
                {startupError}
            </p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-6 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
                Coba Lagi
            </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
