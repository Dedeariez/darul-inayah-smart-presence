
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Student, AttendanceRecord } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';

interface StudentData {
    student: Student;
    attendance: AttendanceRecord[];
}

const AttendanceStat: React.FC<{ label: string; value: number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className={`p-4 rounded-lg text-center ${colorClass}`}>
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
    </div>
);

const ParentView: React.FC = () => {
    const [searchMode, setSearchMode] = useState<'nisn' | 'biodata'>('nisn');
    const [nisn, setNisn] = useState('');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');

    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStudentData(null);
        setSearched(true);

        const params = searchMode === 'nisn' 
            ? { nisn } 
            : { name, dateOfBirth: dob };

        try {
            const data = await api.public.findStudentAttendance(params);
            if (data) {
                setStudentData(data);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };
    
    const calculateStats = () => {
        if (!studentData) return { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
        return studentData.attendance.reduce((acc, record) => {
            if (record.status === 'Hadir') acc.hadir++;
            if (record.status === 'Sakit') acc.sakit++;
            if (record.status === 'Izin') acc.izin++;
            if (record.status === 'Alpa') acc.alpa++;
            return acc;
        }, { hadir: 0, sakit: 0, izin: 0, alpa: 0 });
    };

    const stats = calculateStats();

    const resetForm = () => {
      setNisn('');
      setName('');
      setDob('');
      setError('');
      setSearched(false);
      setStudentData(null);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
            <div className="w-full max-w-2xl space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <img src="https://picsum.photos/seed/schoollogo/80/80" className="h-20 w-20 rounded-full" alt="MA Darul Inayah Logo" />
                        </div>
                        <CardTitle className="text-2xl text-center">Cek Absensi Siswa</CardTitle>
                        <CardDescription className="text-center">
                            Pilih metode pencarian untuk melihat rekap absensi anak Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 border-b">
                          <nav className="-mb-px flex space-x-4 justify-center" aria-label="Tabs">
                            <button
                              onClick={() => { setSearchMode('nisn'); resetForm(); }}
                              className={cn(
                                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                                searchMode === 'nisn'
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              )}
                            >
                              Cari dengan NISN
                            </button>
                             <button
                              onClick={() => { setSearchMode('biodata'); resetForm(); }}
                              className={cn(
                                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                                searchMode === 'biodata'
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              )}
                            >
                              Cari dengan Nama & Tgl. Lahir
                            </button>
                          </nav>
                        </div>
                        <form onSubmit={handleSearch} className="space-y-4">
                            {searchMode === 'nisn' ? (
                                <div>
                                    <label htmlFor="nisn" className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                                    <Input
                                        id="nisn"
                                        type="text"
                                        value={nisn}
                                        onChange={(e) => setNisn(e.target.value)}
                                        placeholder="Masukkan NISN..."
                                        required
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Siswa</label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Masukkan nama lengkap..."
                                            required
                                        />
                                    </div>
                                     <div>
                                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            <Button type="submit" isLoading={loading} className="w-full">
                                Cek Absensi
                            </Button>
                        </form>
                         <div className="mt-4 text-center text-sm">
                            <Link to="/login" className="font-medium text-primary-600 hover:underline">
                                &larr; Kembali ke Halaman Login Guru
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {loading && (
                    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                        <p>Mencari data...</p>
                    </div>
                )}
                
                {error && <p className="text-sm text-red-600 text-center p-4 bg-red-50 rounded-md">{error}</p>}
                
                {searched && !loading && !studentData && !error && (
                    <Card>
                        <CardContent className="p-6 text-center">
                             <p className="text-gray-600">Siswa tidak ditemukan. Pastikan data yang Anda masukkan sudah benar.</p>
                        </CardContent>
                    </Card>
                )}

                {studentData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Hasil Pencarian</CardTitle>
                            <CardDescription>Nama: <span className="font-semibold">{studentData.student.name}</span> | Kelas: <span className="font-semibold">{studentData.student.grade}{studentData.student.classLetter}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-4 text-center">Rekapitulasi Total Absensi</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                               <AttendanceStat label="Hadir" value={stats.hadir} colorClass="bg-green-100 text-green-800" />
                               <AttendanceStat label="Sakit" value={stats.sakit} colorClass="bg-yellow-100 text-yellow-800" />
                               <AttendanceStat label="Izin" value={stats.izin} colorClass="bg-blue-100 text-blue-800" />
                               <AttendanceStat label="Alpa" value={stats.alpa} colorClass="bg-red-100 text-red-800" />
                            </div>

                             <h3 className="text-lg font-semibold mb-2">10 Riwayat Absensi Terakhir</h3>
                             <div className="overflow-x-auto border rounded-lg">
                                 <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Tanggal</th>
                                            <th className="px-6 py-3">Jam Ke-</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentData.attendance.length > 0 ? (
                                            studentData.attendance.slice(0, 10).map(record => (
                                                <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium">{record.date}</td>
                                                    <td className="px-6 py-4">{record.classPeriod}</td>
                                                    <td className="px-6 py-4 font-semibold">{record.status}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center px-6 py-4">Belum ada data absensi.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                 </table>
                             </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ParentView;