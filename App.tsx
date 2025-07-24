
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './services/supabase';
import * as api from './services/api';
import { AuthContextType, UserProfile } from './types';
import PublicHomePage from './pages/PublicHomePage';
import DashboardPage from './pages/DashboardPage';
import StudentsManagementPage from './pages/StudentsManagementPage';
import AttendanceManagementPage from './pages/AttendanceManagementPage';
import ReportsPage from './pages/ReportsPage';
import ParentPortalPage from './pages/ParentPortalPage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout';
import Spinner from './components/common/Spinner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import UpdatePasswordPage from './pages/auth/UpdatePasswordPage';
import RegistrationSuccessPage from './pages/auth/RegistrationSuccessPage';
import PasswordChangedSuccessPage from './pages/auth/PasswordChangedSuccessPage';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const userProfile = await api.getUserProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error: any) {
        console.error("Error fetching session or profile:", error.message);
        toast.error("Gagal memuat data pengguna.");
      } finally {
        setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
            try {
                const userProfile = await api.getUserProfile(session.user.id);
                setProfile(userProfile);
            } catch(error: any) {
                console.error("Error fetching profile on auth change:", error.message);
                toast.error("Gagal memperbarui profil pengguna.");
                setProfile(null);
            }
        } else {
            setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    return await api.signUp(email, password, fullName);
  };

  const signIn = async (email: string, password: string) => {
    return await api.signIn(email, password);
  };

  const signOut = async () => {
    await api.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    return await api.resetPasswordForEmail(email);
  };

  const updatePassword = async (password: string) => {
      return await api.updatePassword(password);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <HashRouter>
        <AuthHandler />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/parent-portal" element={<ParentPortalPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/registration-success" element={<RegistrationSuccessPage />} />
          <Route path="/password-changed-success" element={<PasswordChangedSuccessPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Layout><StudentsManagementPage /></Layout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Layout><AttendanceManagementPage /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><ReportsPage /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
