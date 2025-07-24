
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { Student, StudentExcelRow } from '../types';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { PlusCircleIcon, UploadIcon, Trash2Icon, EditIcon, SearchIcon } from '../components/Icons';

declare const XLSX: any;

const PAGE_SIZE = 15;

const StudentForm = ({ student, onSave, onCancel }: { student?: Student | null, onSave: () => void, onCancel: () => void }) => {
    const [namaLengkap, setNamaLengkap] = useState(student?.nama_lengkap || '');
    const [kelas, setKelas] = useState(student?.kelas_final.split('-')[0] || '10');
    const [gender, setGender] = useState<'L' | 'P'>(student?.gender || 'L');
    const [nisn, setNisn] = useState(student?.nisn || '');
    const [tanggalLahir, setTanggalLahir] = useState(student?.tanggal_lahir || '');
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const kelas_final = `${kelas}-${gender === 'L' ? 'A' : 'B'}`;
        const studentData = {
            nama_lengkap: namaLengkap,
            kelas_final,
            gender,
            nisn: nisn || null,
            tanggal_lahir: tanggalLahir
        };

        try {
            if (student?.id) {
                await api.updateStudent(student.id, studentData);
            } else {
                await api.addStudent([studentData]);
            }
            
            const action = student?.id ? `memperbarui data siswa ${namaLengkap}` : `menambahkan siswa baru ${namaLengkap}`;
            if (user?.id) await api.addActivityLog(user.id, action);
            toast.success(`Siswa berhasil ${student?.id ? 'diperbarui' : 'ditambahkan'}`);
            onSave();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input type="text" value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kelas</label>
                    <select value={kelas} onChange={e => setKelas(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        <option>10</option>
                        <option>11</option>
                        <option>12</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                    <select value={gender} onChange={e => setGender(e.target.value as 'L' | 'P')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">NISN (Opsional)</label>
                <input type="text" value={nisn} onChange={e => setNisn(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                <input type="date" value={tanggalLahir} onChange={e => setTanggalLahir(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-50">
                    {isSaving ? <Spinner size="5" color="white"/> : 'Simpan'}
                </button>
            </div>
        </form>
    );
};

const UploadStudents = ({ onUpload, onCancel }: { onUpload: () => void, onCancel: () => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useAuth();
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file || !user) {
            toast.error("Pilih file Excel dan pastikan Anda sudah login.");
            return;
        }
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: StudentExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    throw new Error("File Excel kosong atau format tidak sesuai.");
                }
                
                const result = await api.uploadStudents(json, user.id);
                
                // Enhanced user feedback
                if (result.successCount > 0 && result.errorCount === 0) {
                    toast.success(`${result.successCount} siswa berhasil diunggah.`);
                } else if (result.successCount > 0 && result.errorCount > 0) {
                    toast.success(`${result.successCount} siswa berhasil diunggah.`, { duration: 5000 });
                    toast.error(`${result.errorCount} baris data gagal diunggah. Cek konsol untuk detail.`, { duration: 10000 });
                     console.error("Kesalahan Unggah Excel:", result.errors);
                } else if (result.errorCount > 0) {
                    toast.error(`Semua ${result.errorCount} baris data gagal diunggah. Cek konsol untuk detail.`, { duration: 10000 });
                    console.error("Kesalahan Unggah Excel:", result.errors);
                } else {
                    toast("Tidak ada data baru untuk diunggah.", { icon: 'ℹ️' });
                }

                onUpload();

            } catch (err: any) {
                toast.error("Gagal memproses file: " + err.message);
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div>
            <p className="text-sm text-gray-600 mb-4">Pastikan file Excel memiliki kolom: NAMA_LENGKAP, KELAS (10/11/12), JENIS_KELAMIN ('L'/'P'), NISN (opsional), TANGGAL_LAHIR (YYYY-MM-DD).</p>
            <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            <div className="flex justify-end gap-2 pt-6">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleUpload} disabled={isUploading || !file} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-50">
                    {isUploading ? <><Spinner size="5" color="white" /> Mengunggah...</> : 'Unggah File'}
                </button>
            </div>
        </div>
    )
}

const StudentsManagementPage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const { user } = useAuth();

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const { students: data, count } = await api.getStudents(searchTerm, currentPage);
            setStudents(data);
            setTotalStudents(count);
        } catch(error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setCurrentPage(1);
            fetchStudents();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        fetchStudents();
    }, [currentPage, fetchStudents]);


    const handleAddStudent = () => {
        setEditingStudent(null);
        setIsFormModalOpen(true);
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setIsFormModalOpen(true);
    };

    const handleDeleteStudent = async (student: Student) => {
        if (window.confirm(`Anda yakin ingin menghapus siswa ${student.nama_lengkap}?`)) {
            try {
                if(!user) throw new Error("User tidak terautentikasi");
                await api.deleteStudent(student.id);
                await api.addActivityLog(user.id, `menghapus data siswa ${student.nama_lengkap}`);
                toast.success('Siswa berhasil dihapus.');
                // Refresh data
                if (students.length === 1 && currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                } else {
                  fetchStudents();
                }
            } catch(error: any) {
                toast.error(error.message);
            }
        }
    };
    
    const totalPages = Math.ceil(totalStudents / PAGE_SIZE);

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manajemen Siswa</h1>
                    <p className="mt-2 text-sm text-gray-600">Tambah, ubah, hapus, dan unggah data siswa secara massal.</p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-2">
                    <button onClick={() => setIsUploadModalOpen(true)} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <UploadIcon className="h-5 w-5" />
                        Unggah Excel
                    </button>
                    <button onClick={handleAddStudent} type="button" className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">
                        <PlusCircleIcon className="h-5 w-5" />
                        Tambah Siswa
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama siswa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    />
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Lahir</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8"><Spinner /></td></tr>
                            ) : students.length > 0 ? (
                                students.map(student => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.nama_lengkap}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.kelas_final}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.nisn || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.tanggal_lahir}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-4">
                                                <button onClick={() => handleEditStudent(student)} className="text-primary-600 hover:text-primary-900"><EditIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleDeleteStudent(student)} className="text-red-600 hover:text-red-900"><Trash2Icon className="h-5 w-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data siswa ditemukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalStudents > PAGE_SIZE && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Menampilkan <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> - <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalStudents)}</span> dari <span className="font-medium">{totalStudents}</span> hasil
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingStudent ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}>
                <StudentForm student={editingStudent} onSave={() => { setIsFormModalOpen(false); fetchStudents(); }} onCancel={() => setIsFormModalOpen(false)} />
            </Modal>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Unggah Data Siswa Massal">
                <UploadStudents onUpload={() => { setIsUploadModalOpen(false); fetchStudents(); }} onCancel={() => setIsUploadModalOpen(false)} />
            </Modal>

        </div>
    );
};

export default StudentsManagementPage;
