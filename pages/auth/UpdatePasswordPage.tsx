
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { GraduationCap } from '../../components/Icons';
import * as api from '../../services/api';

const UpdatePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { session, updatePassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!session) {
            toast.error("Sesi tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.", { duration: 5000 });
            navigate('/forgot-password');
        }
    }, [session, navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error("Kata sandi baru harus minimal 6 karakter.");
            return;
        }
        setLoading(true);
        const { error } = await updatePassword(password);
        if (error) {
            toast.error(error.message);
        } else {
            // Sign out to force re-login with the new password
            await api.signOut();
            navigate('/password-changed-success');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <GraduationCap className="mx-auto h-12 w-auto text-primary-600" />
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Atur Ulang Kata Sandi</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleUpdate}>
                        <div>
                            <label htmlFor="new-password"className="block text-sm font-medium text-gray-700">
                                Kata Sandi Baru
                            </label>
                            <div className="mt-1">
                                <input id="new-password" name="new-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                            </div>
                             <p className="mt-2 text-xs text-gray-500">Minimal 6 karakter.</p>
                        </div>
                        <div>
                            <button type="submit" disabled={loading || !session} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                                {loading ? <Spinner size="5" color="white" /> : 'Simpan Kata Sandi Baru'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
