import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { GraduationCap } from '../../components/Icons';

const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Kata sandi harus terdiri dari minimal 6 karakter.');
            return;
        }
        setLoading(true);
        const { error } = await signUp(email, password, fullName);
        if (error) {
            toast.error(error.message);
        } else {
            navigate('/registration-success');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link to="/">
                    <GraduationCap className="mx-auto h-12 w-auto text-primary-600" />
                </Link>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Buat Akun Guru Baru</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleRegister}>
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <div className="mt-1">
                                <input id="full_name" name="full_name" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Alamat Email</label>
                            <div className="mt-1">
                                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700">Kata Sandi</label>
                            <div className="mt-1">
                                <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Minimal 6 karakter.</p>
                        </div>

                        <div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                                {loading ? <Spinner size="5" color="white" /> : 'Daftar'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6">
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Sudah punya akun?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
