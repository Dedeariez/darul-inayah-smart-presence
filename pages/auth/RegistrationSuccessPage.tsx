import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '../../components/Icons';

const RegistrationSuccessPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center px-4">
            <CheckCircleIcon className="h-20 w-20 text-green-500" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Pendaftaran Berhasil!</h1>
            <p className="mt-2 text-base text-gray-600 max-w-md">
                Kami telah mengirimkan tautan konfirmasi ke alamat email Anda.
                <br />
                Silakan periksa kotak masuk Anda (dan folder spam) untuk mengaktifkan akun Anda.
            </p>
            <div className="mt-8">
                <Link to="/" className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                    Kembali ke Halaman Utama
                </Link>
            </div>
        </div>
    );
};

export default RegistrationSuccessPage;
