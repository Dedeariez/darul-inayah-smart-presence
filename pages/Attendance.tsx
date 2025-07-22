import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const Attendance: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [selectedClass, setSelectedClass] = useState('10A');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPeriod, setSelectedPeriod] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchClassData = async () => {
            setLoading(true);
            try {
                const allStudents = await api.students.getStudents();
                const classStudents = allStudents.filter(s => `${s.grade}${s.classLetter}` === selectedClass);
                setStudents(classStudents);

                const records = await api.attendance.getAttendanceForClass(selectedClass, selectedDate, selectedPeriod);
                const newAttendance: Record<string, AttendanceStatus> = {};
                records.forEach(r => {
                    newAttendance[r.studentId] = r.status;
                });
                classStudents.forEach(s => {
                    if (!newAttendance[s.id]) {
                        newAttendance[s.id] = 'Hadir'; // Default to 'Hadir'
                    }
                });
                setAttendance(newAttendance);

            } catch (error) {
                console.error("Failed to fetch class data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClassData();
    }, [selectedClass, selectedDate, selectedPeriod]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };
    
    const handleSaveAttendance = async () => {
        setSaving(true);
        const recordsToSave: Omit<AttendanceRecord, 'id' | 'studentName'>[] = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            date: selectedDate,
            classPeriod: selectedPeriod,
            status: status as AttendanceStatus,
        }));
        try {
            await api.attendance.saveAttendance(recordsToSave);
            alert('Absensi berhasil disimpan!');
        } catch (error) {
            alert('Gagal menyimpan absensi.');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };
    
    const attendanceStatuses: AttendanceStatus[] = ['Hadir', 'Sakit', 'Izin', 'Alpa'];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Input Absensi</h1>
            
            <Card>
                <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="text-sm font-medium">Kelas</label>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full h-10 border border-gray-300 rounded-md px-3 mt-1">
                            {['10A', '10B', '11A', '11B', '12A', '12B'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Tanggal</label>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full h-10 border border-gray-300 rounded-md px-3 mt-1"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Jam Ke-</label>
                        <input type="number" min="1" max="10" value={selectedPeriod} onChange={e => setSelectedPeriod(parseInt(e.target.value))} className="w-full h-10 border border-gray-300 rounded-md px-3 mt-1"/>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Siswa</th>
                                <th scope="col" className="px-6 py-3 text-center">Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={2} className="text-center p-6">Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={2} className="text-center p-6">Tidak ada siswa di kelas ini.</td></tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{student.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center space-x-1 sm:space-x-2">
                                                {attendanceStatuses.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(student.id, status)}
                                                        className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${
                                                            attendance[student.id] === status
                                                            ? 'text-white bg-primary-600'
                                                            : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                   </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveAttendance} isLoading={saving} disabled={loading || students.length === 0}>
                    Simpan Absensi
                </Button>
            </div>
        </div>
    );
};

export default Attendance;