import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { GraduationCap } from '../../components/Icons';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const { resetPasswordForEmail } = useAuth();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await resetPasswordForEmail(email);
        if (error) {
            toast.error(error.message);
        } else {
            setMessageSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                 <Link to="/">
                    <GraduationCap className="mx-auto h-12 w-auto text-primary-600" />
                </Link>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Lupa Kata Sandi</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {messageSent ? (
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">Periksa Email Anda</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Jika akun dengan email tersebut ada, kami telah mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                            </p>
                            <div className="mt-6">
                                <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                                  Kembali ke Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleReset}>
                            <p className="text-sm text-gray-600">
                                Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                            </p>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Alamat Email
                                </label>
                                <div className="mt-1">
                                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                                    {loading ? <Spinner size="5" color="white" /> : 'Kirim Tautan Reset'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
