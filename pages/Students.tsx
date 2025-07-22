
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Student, Gender, Grade } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

const icons = {
    edit: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
    upload: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
    add: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
};


const StudentForm: React.FC<{ student: Partial<Student> | null, onSave: (student: Omit<Student, 'id' | 'classLetter'>) => void, onCancel: () => void }> = ({ student, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: student?.name || '',
        nisn: student?.nisn || '',
        grade: student?.grade || '10',
        gender: student?.gender || 'L',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Student, 'id' | 'classLetter'>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NISN (Opsional)</label>
                <Input name="nisn" value={formData.nisn} onChange={handleChange} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select name="grade" value={formData.grade} onChange={handleChange} className="w-full h-10 border border-gray-300 rounded-md px-3">
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-10 border border-gray-300 rounded-md px-3">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>
                <Button type="submit">Simpan</Button>
            </div>
        </form>
    );
};


const Students: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [filter, setFilter] = useState('all');
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.students.getStudents();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isTeacher) {
            fetchStudents();
        } else if (user) {
            // Parent view
            setLoading(true);
            api.students.getStudentForParent(user.id).then(student => {
                setStudents(student ? [student] : []);
            }).finally(() => setLoading(false));
        }
    }, [fetchStudents, user, isTeacher]);
    
    const handleOpenModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleSaveStudent = async (data: Omit<Student, 'id' | 'classLetter'>) => {
        if (editingStudent) {
            await api.students.updateStudent(editingStudent.id, data);
        } else {
            await api.students.addStudent(data);
        }
        fetchStudents();
        handleCloseModal();
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = (window as any).XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = (window as any).XLSX.utils.sheet_to_json(worksheet);

            const newStudents = json.map((row: any) => ({
                name: row.Nama,
                grade: String(row.Kelas) as Grade,
                gender: row['Jenis Kelamin'] as Gender,
                nisn: row.NISN ? String(row.NISN) : undefined,
            }));
            
            await api.students.bulkAddStudents(newStudents);
            alert(`${newStudents.length} siswa berhasil di-upload!`);
            fetchStudents();
        };
        reader.readAsArrayBuffer(file);
    };

    const filteredStudents = students.filter(s => {
        if (filter === 'all') return true;
        return `${s.grade}${s.classLetter}` === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Data Siswa</h1>
                {isTeacher && (
                <div className="flex space-x-2">
                     <label className="cursor-pointer">
                        <Button as="span" variant="secondary" className="flex items-center space-x-2">
                           {icons.upload} <span>Upload Excel</span>
                        </Button>
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </label>
                    <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        {icons.add} <span>Tambah Siswa</span>
                    </Button>
                </div>
                )}
            </div>

            {isTeacher && (
                <div className="flex space-x-2">
                    <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>Semua</Button>
                    {['10A', '10B', '11A', '11B', '12A', '12B'].map(c => (
                        <Button key={c} variant={filter === c ? 'primary' : 'secondary'} onClick={() => setFilter(c)}>{c}</Button>
                    ))}
                </div>
            )}
            
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama</th>
                                <th scope="col" className="px-6 py-3">NISN</th>
                                <th scope="col" className="px-6 py-3">Kelas</th>
                                <th scope="col" className="px-6 py-3">Jenis Kelamin</th>
                                {isTeacher && <th scope="col" className="px-6 py-3">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-6">Loading...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-6">Tidak ada data siswa.</td></tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{student.name}</td>
                                        <td className="px-6 py-4">{student.nisn || '-'}</td>
                                        <td className="px-6 py-4">{student.grade}{student.classLetter}</td>
                                        <td className="px-6 py-4">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                                        {isTeacher && (
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleOpenModal(student)} className="text-primary-600 hover:text-primary-800">
                                                    {icons.edit}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}>
                <StudentForm student={editingStudent} onSave={handleSaveStudent} onCancel={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default Students;
