
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const Login: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
        // Navigation will happen automatically via AuthProvider
      } else {
        // Mock registration
        alert('Pendaftaran berhasil! Silakan login.');
        setIsLoginView(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src="https://picsum.photos/seed/schoollogo/80/80" className="h-20 w-20 rounded-full" alt="MA Darul Inayah Logo" />
          </div>
          <CardTitle className="text-2xl text-center">{isLoginView ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</CardTitle>
          <CardDescription className="text-center">
            {isLoginView ? 'Login ke sistem absensi MA Darul Inayah' : 'Daftar sebagai guru atau orang tua siswa'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
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
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                placeholder="********"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoginView ? 'Login' : 'Daftar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLoginView ? (
              <>
                Belum punya akun?{' '}
                <button onClick={() => setIsLoginView(false)} className="font-medium text-primary-600 hover:underline">
                  Daftar
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button onClick={() => setIsLoginView(true)} className="font-medium text-primary-600 hover:underline">
                  Login
                </button>
              </>
            )}
          </div>
           <div className="mt-2 text-center text-sm">
              <a href="#" className="font-medium text-gray-500 hover:underline">
                Lupa password?
              </a>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
