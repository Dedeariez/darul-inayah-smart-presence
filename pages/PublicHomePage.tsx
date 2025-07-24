
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Student } from '../types';
import toast from 'react-hot-toast';
import * as api from '../services/api';
import { GraduationCap } from '../components/Icons';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../App';

const PublicHomePage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showParentForm, setShowParentForm] = useState(false);

  // Teacher login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Parent access state
  const [nisn, setNisn] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');

  const handleParentAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn && (!namaLengkap || !tanggalLahir)) {
      toast.error('Silakan isi NISN atau Nama Lengkap dan Tanggal Lahir.');
      return;
    }
    setLoading(true);

    try {
      const studentData = await api.findStudentForParent({ nisn, namaLengkap, tanggalLahir });
      navigate('/parent-portal', { state: { student: studentData } });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await signIn(email, password);
        if (error) {
            toast.error(error.message || 'Email atau kata sandi salah.');
        } else {
            toast.success('Login berhasil!');
            navigate('/dashboard');
        }
    } catch (err: any) {
        toast.error(err.message || 'Terjadi kesalahan tak terduga saat login.');
    } finally {
        setLoading(false);
    }
  };

  const TeacherLogin = () => (
    <form className="space-y-6" onSubmit={handleLogin}>
       <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Alamat Email Guru
          </label>
          <div className="mt-1">
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
        </div>

        <div>
          <label htmlFor="password"className="block text-sm font-medium text-gray-700">
            Kata Sandi
          </label>
          <div className="mt-1">
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="text-sm">
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  Daftar akun baru
                </Link>
            </div>
            <div className="text-sm">
                <Link to="/forgot-password"className="font-medium text-primary-600 hover:text-primary-500">
                Lupa kata sandi?
                </Link>
            </div>
        </div>

        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
            {loading ? <Spinner size="5" color="white" /> : 'Masuk'}
          </button>
        </div>
    </form>
  );

  const ParentAccess = () => (
     <form className="space-y-6" onSubmit={handleParentAccess}>
        <div>
          <label htmlFor="nisn" className="block text-sm font-medium text-gray-700">
            Nomor Induk Siswa Nasional (NISN)
          </label>
          <div className="mt-1">
            <input id="nisn" name="nisn" type="text" value={nisn} onChange={(e) => setNisn(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
        </div>
        
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">atau</span>
            </div>
        </div>

        <div>
          <label htmlFor="nama_lengkap" className="block text-sm font-medium text-gray-700">
            Nama Lengkap Anak
          </label>
          <div className="mt-1">
            <input id="nama_lengkap" name="nama_lengkap" type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
        </div>

        <div>
          <label htmlFor="tanggal_lahir" className="block text-sm font-medium text-gray-700">
            Tanggal Lahir Anak
          </label>
          <div className="mt-1">
            <input id="tanggal_lahir" name="tanggal_lahir" type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
        </div>

        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {loading ? <Spinner size="5" color="white" /> : 'Cek Kehadiran'}
          </button>
        </div>
      </form>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <GraduationCap className="mx-auto h-16 w-auto text-primary-600" />
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Darul Inayah Smart-Presence</h2>
        <p className="mt-2 text-sm text-gray-600">
          {showParentForm ? 'Portal Orang Tua: Cek kehadiran putra/i Anda.' : 'Portal Guru: Silakan login untuk melanjutkan.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          
          {showParentForm ? <ParentAccess /> : <TeacherLogin />}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <button
                onClick={() => setShowParentForm(!showParentForm)}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                {showParentForm ? 'Masuk sebagai Guru' : 'Orang Tua? Cek absen di sini'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicHomePage;