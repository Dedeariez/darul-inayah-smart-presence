import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '../../components/Icons';

const PasswordChangedSuccessPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center px-4">
            <CheckCircleIcon className="h-20 w-20 text-green-500" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Kata Sandi Berhasil Diubah!</h1>
            <p className="mt-2 text-base text-gray-600">
                Anda sekarang dapat masuk dengan kata sandi baru Anda.
            </p>
            <div className="mt-8">
                <Link to="/login" className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    Lanjutkan ke Halaman Login
                </Link>
            </div>
        </div>
    );
};

export default PasswordChangedSuccessPage;
