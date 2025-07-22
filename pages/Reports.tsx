
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Student, AttendanceRecord } from '../types';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const Reports: React.FC = () => {
    const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        class: 'all',
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
    });

    useEffect(() => {
        api.students.getStudents().then(setStudents);
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const allRecords = await api.attendance.getAttendanceRecords();
            let filteredRecords = allRecords.filter(r => r.date.startsWith(filters.month));
            
            if(filters.class !== 'all'){
                 const classStudents = students.filter(s => `${s.grade}${s.classLetter}` === filters.class);
                 const classStudentIds = new Set(classStudents.map(s => s.id));
                 filteredRecords = filteredRecords.filter(r => classStudentIds.has(r.studentId));
            }

            const recordsWithNames = filteredRecords.map(r => ({
                ...r,
                studentName: students.find(s => s.id === r.studentId)?.name || 'Unknown Student'
            }));

            setReportData(recordsWithNames);
        } catch (error) {
            console.error('Failed to generate report', error);
            alert('Gagal membuat laporan.');
        } finally {
            setLoading(false);
        }
    };
    
    const downloadExcel = () => {
        const dataToExport = reportData.map(r => ({
            'Nama Siswa': r.studentName,
            'Tanggal': r.date,
            'Jam Ke-': r.classPeriod,
            'Status': r.status,
        }));
        const worksheet = (window as any).XLSX.utils.json_to_sheet(dataToExport);
        const workbook = (window as any).XLSX.utils.book_new();
        (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
        (window as any).XLSX.writeFile(workbook, `Laporan_Absensi_${filters.class}_${filters.month}.xlsx`);
    };
    
    const downloadPdf = () => {
        const doc = new (window as any).jspdf.jsPDF();
        doc.text(`Laporan Absensi - Kelas ${filters.class} - Bulan ${filters.month}`, 14, 16);
        (doc as any).autoTable({
            head: [['Nama Siswa', 'Tanggal', 'Jam Ke-', 'Status']],
            body: reportData.map(r => [r.studentName, r.date, r.classPeriod, r.status]),
            startY: 22,
        });
        doc.save(`Laporan_Absensi_${filters.class}_${filters.month}.pdf`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Laporan Absensi</h1>
            
            <Card>
                <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                     <div>
                        <label className="text-sm font-medium">Kelas</label>
                        <select value={filters.class} onChange={e => setFilters({...filters, class: e.target.value})} className="w-full h-10 border border-gray-300 rounded-md px-3 mt-1">
                            <option value="all">Semua Kelas</option>
                            {['10A', '10B', '11A', '11B', '12A', '12B'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Bulan</label>
                        <input type="month" value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="w-full h-10 border border-gray-300 rounded-md px-3 mt-1"/>
                    </div>
                    <div className="self-end">
                        <Button onClick={handleGenerateReport} isLoading={loading}>
                            Buat Laporan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reportData.length > 0 && (
                <Card>
                     <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Hasil Laporan</h2>
                             <div className="flex space-x-2">
                                <Button onClick={downloadExcel} variant="secondary">Download Excel</Button>
                                <Button onClick={downloadPdf} variant="secondary">Download PDF</Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3">Nama Siswa</th>
                                        <th className="px-6 py-3">Tanggal</th>
                                        <th className="px-6 py-3">Jam Ke-</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(record => (
                                        <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                            <td className="px-6 py-4 font-medium">{record.studentName}</td>
                                            <td className="px-6 py-4">{record.date}</td>
                                            <td className="px-6 py-4">{record.classPeriod}</td>
                                            <td className="px-6 py-4">{record.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Reports;
