
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../services/api';
import { HistoryLog, Student, AttendanceRecord } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={`text-${color}-500`}>{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const icons = {
  pieChart: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  alert: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  activity: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
};


const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ studentCount: 0, attendancePercentage: 0 });
    const [lowAttendanceStudents, setLowAttendanceStudents] = useState<Student[]>([]);
    const [history, setHistory] = useState<HistoryLog[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const students = await api.students.getStudents();
            const attendance = await api.attendance.getAttendanceRecords();
            const historyLogs = await api.getHistory();
            
            // Calculate stats
            const today = new Date().toISOString().split('T')[0];
            const todaysAttendance = attendance.filter(a => a.date === today && a.status === 'Hadir');
            const attendancePercentage = students.length > 0 ? (todaysAttendance.length / students.length) * 100 : 0;
            
            setStats({
                studentCount: students.length,
                attendancePercentage: Math.round(attendancePercentage),
            });

            // Find students with low attendance (mock logic)
            setLowAttendanceStudents(students.slice(0, 2)); 
            
            setHistory(historyLogs);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">Selamat datang kembali, {user?.name}!</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Kehadiran Hari Ini" value={`${stats.attendancePercentage}%`} icon={icons.pieChart} color="green" />
                <StatCard title="Total Siswa" value={stats.studentCount.toString()} icon={icons.users} color="blue" />
                <StatCard title="Peringatan" value={lowAttendanceStudents.length.toString()} icon={icons.alert} color="red" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><span className="mr-2">{icons.alert}</span>Peringatan Kehadiran Rendah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lowAttendanceStudents.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {lowAttendanceStudents.map(student => (
                                    <li key={student.id} className="py-3 flex justify-between items-center">
                                        <span>{student.name}</span>
                                        <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Kehadiran Rendah</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Tidak ada siswa dengan peringatan kehadiran.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><span className="mr-2">{icons.activity}</span>Riwayat Aktivitas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                           {history.map(log => (
                               <li key={log.id} className="flex items-start">
                                   <div className="bg-primary-100 text-primary-700 rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3">{log.user.charAt(0)}</div>
                                   <div>
                                       <p className="text-sm text-gray-800">{log.action}</p>
                                       <p className="text-xs text-gray-500">{log.user} - {new Date(log.timestamp).toLocaleString()}</p>
                                   </div>
                               </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
