
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { Student, AttendanceStatus } from '../types';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

const AttendanceManagementPage = () => {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectHour, setSubjectHour] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const uniqueClasses = await api.getClasses();
        setClasses(uniqueClasses);
        if (uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0]);
        }
      } catch (error: any) {
        toast.error(error.message);
      }
    };
    fetchClasses();
  }, []);

  const fetchStudentsAndAttendance = useCallback(async () => {
    if (!selectedClass || !date) return;
    setLoading(true);

    try {
      const { students, attendance } = await api.getAttendanceDataForClass(selectedClass, date, subjectHour);
      setStudents(students);
      setAttendance(attendance);
    } catch(error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  }, [selectedClass, date, subjectHour]);

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [fetchStudentsAndAttendance]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };
  
  const handleSaveAttendance = async () => {
      if (!user) {
          toast.error("Tidak bisa menyimpan, user tidak ditemukan.");
          return;
      }
      setIsSaving(true);
      
      try {
          await api.saveAttendance(attendance, {date, subjectHour, teacherId: user.id});
          await api.addActivityLog(user.id, `memperbarui absensi kelas ${selectedClass} untuk tanggal ${date}`);
          toast.success("Absensi berhasil disimpan.");
      } catch(error: any) {
          toast.error(`Gagal menyimpan absensi: ${error.message}`);
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manajemen Absensi</h1>
      <p className="mt-2 text-sm text-gray-600">Pilih kelas dan tanggal untuk mengisi absensi harian.</p>

      <div className="mt-8 p-4 bg-white rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">Kelas</label>
          <select id="class-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700">Tanggal</label>
          <input type="date" id="date-picker" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="subject-hour" className="block text-sm font-medium text-gray-700">Jam Ke-</label>
          <input type="number" id="subject-hour" value={subjectHour} min="1" max="10" onChange={e => setSubjectHour(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
      </div>

      <div className="mt-8 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Kehadiran</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                          <tr><td colSpan={2} className="text-center py-8"><Spinner /></td></tr>
                      ) : students.length > 0 ? (
                          students.map(student => (
                              <tr key={student.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.nama_lengkap}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <fieldset>
                                          <legend className="sr-only">Status</legend>
                                          <div className="flex items-center space-x-4">
                                              {ATTENDANCE_STATUSES.map(status => (
                                                  <div key={status} className="flex items-center">
                                                      <input
                                                          id={`${student.id}-${status}`}
                                                          name={`attendance-${student.id}`}
                                                          type="radio"
                                                          checked={attendance[student.id] === status}
                                                          onChange={() => handleStatusChange(student.id, status)}
                                                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                      />
                                                      <label htmlFor={`${student.id}-${status}`} className="ml-2 block text-sm text-gray-900">{status}</label>
                                                  </div>
                                              ))}
                                          </div>
                                      </fieldset>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr><td colSpan={2} className="text-center py-8 text-gray-500">Pilih kelas untuk menampilkan siswa.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
       {students.length > 0 && (
          <div className="mt-6 flex justify-end">
              <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                  {isSaving ? <Spinner size="5" color="white"/> : 'Simpan Absensi'}
              </button>
          </div>
        )}
    </div>
  );
};

export default AttendanceManagementPage;
