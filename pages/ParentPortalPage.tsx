
import React from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { Student, AttendanceStatus } from '../types';
import { GraduationCap, ArrowRightIcon } from '../components/Icons';

const statusStyles: Record<AttendanceStatus, string> = {
    Hadir: 'bg-green-100 text-green-800',
    Sakit: 'bg-yellow-100 text-yellow-800',
    Izin: 'bg-blue-100 text-blue-800',
    Alfa: 'bg-red-100 text-red-800',
    Tidur: 'bg-gray-100 text-gray-800',
};

const ParentPortalPage = () => {
    const location = useLocation();
    const student = location.state?.student as Student;

    if (!student) {
        return <Navigate to="/" replace />;
    }

    const records = student.attendance_records || [];
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'Hadir').length;
    const sickCount = records.filter(r => r.status === 'Sakit').length;
    const permitCount = records.filter(r => r.status === 'Izin').length;
    const alfaCount = records.filter(r => r.status === 'Alfa').length;
    const sleepCount = records.filter(r => r.status === 'Tidur').length;
    const attendancePercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 'N/A';
    
    // Sort records by date descending
    const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <GraduationCap className="mx-auto h-16 w-auto text-primary-600" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Portal Kehadiran Siswa</h1>
                </div>

                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-primary-700 p-6">
                        <h2 className="text-2xl font-bold text-white">{student.nama_lengkap}</h2>
                        <p className="text-primary-200 mt-1">Kelas: {student.kelas_final} | NISN: {student.nisn || 'Tidak ada'}</p>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900">Ringkasan Kehadiran</h3>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                             <div className="bg-gray-100 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Persentase Hadir</p>
                                <p className="mt-1 text-3xl font-semibold text-primary-600">{attendancePercentage}%</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-green-600">Hadir</p>
                                <p className="mt-1 text-3xl font-semibold text-green-700">{presentCount}</p>
                            </div>
                             <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-yellow-600">Sakit</p>
                                <p className="mt-1 text-3xl font-semibold text-yellow-700">{sickCount}</p>
                            </div>
                             <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-blue-600">Izin</p>
                                <p className="mt-1 text-3xl font-semibold text-blue-700">{permitCount}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-red-600">Alfa</p>
                                <p className="mt-1 text-3xl font-semibold text-red-700">{alfaCount}</p>
                            </div>
                             <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">Tidur</p>
                                <p className="mt-1 text-3xl font-semibold text-gray-700">{sleepCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        <h3 className="text-lg font-medium text-gray-900">Riwayat Absensi Terbaru</h3>
                        <div className="mt-4 border-t border-gray-200">
                             <ul role="list" className="divide-y divide-gray-100">
                                {sortedRecords.length > 0 ? sortedRecords.slice(0, 10).map(record => (
                                    <li key={record.id} className="flex items-center justify-between gap-x-6 py-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">Tanggal: {record.date}</p>
                                            <p className="mt-1 truncate text-xs leading-5 text-gray-500">Jam ke-{record.subject_hour}</p>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                             <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusStyles[record.status]}`}>{record.status}</span>
                                        </div>
                                    </li>
                                )) : <p className="text-center py-8 text-gray-500">Belum ada catatan absensi.</p> }
                            </ul>
                        </div>
                    </div>
                </div>
                
                 <div className="mt-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
                        Kembali ke Halaman Utama
                        <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default ParentPortalPage;
