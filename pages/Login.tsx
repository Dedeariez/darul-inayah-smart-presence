
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../services/api';

const Login: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const { login } = useAuth();

  const resetMessages = () => {
    setError('');
    setSuccessMessage('');
    setShowResendVerification(false);
  };

  const toggleView = (view: 'login' | 'register') => {
    resetMessages();
    setIsLoginView(view === 'login');
  };

  const handleResendVerification = async () => {
    resetMessages();
    setIsLoading(true);
    try {
      await api.auth.resendVerification(email);
      setSuccessMessage('Email verifikasi telah dikirim ulang. Silakan periksa kotak masuk Anda.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
        // Navigation will happen automatically via AuthProvider
      } else {
        await api.auth.register({ name, email, password });
        setSuccessMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi sebelum login.');
        toggleView('login');
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'EMAIL_NOT_VERIFIED') {
        setError('Login gagal. Email Anda belum diverifikasi. Silakan cek kotak masuk Anda.');
        setShowResendVerification(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src="favicon.svg" className="h-20 w-20" alt="MA Darul Inayah Logo" />
          </div>
          <CardTitle className="text-2xl text-center">{isLoginView ? 'Login Guru' : 'Buat Akun Guru'}</CardTitle>
          <CardDescription className="text-center">
            {isLoginView ? 'Login ke sistem absensi MA Darul Inayah' : 'Pendaftaran hanya untuk akun Guru.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nama Anda"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="email@anda.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLoginView ? "current-password" : "new-password"}
                placeholder="********"
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}

            {showResendVerification && (
              <Button type="button" variant="secondary" className="w-full" onClick={handleResendVerification} isLoading={isLoading}>
                Kirim Ulang Email Verifikasi
              </Button>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={showResendVerification}>
              {isLoginView ? 'Login' : 'Daftar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLoginView ? (
              <>
                Belum punya akun?{' '}
                <button onClick={() => toggleView('register')} className="font-medium text-primary-600 hover:underline">
                  Daftar
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button onClick={() => toggleView('login')} className="font-medium text-primary-600 hover:underline">
                  Login
                </button>
              </>
            )}
          </div>
           <div className="mt-6 text-center text-sm border-t pt-4">
               Orang Tua Siswa?{' '}
             <Link to="/parent-view" className="font-medium text-primary-600 hover:underline">
               Cek Absensi di Sini
             </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;