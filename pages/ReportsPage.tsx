
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { Student, AttendanceRecord } from '../types';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { DownloadIcon } from '../components/Icons';

declare const XLSX: any;
declare const jspdf: any;

type ReportData = (Student & { attendance_records: AttendanceRecord[] })[];

const ReportsPage = () => {
    const [reportData, setReportData] = useState<ReportData>([]);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const uniqueClasses = await api.getClasses();
                setClasses(['Semua Kelas', ...uniqueClasses]);
                setSelectedClass('Semua Kelas');
            } catch (error: any) {
                toast.error(error.message);
            }
        };
        fetchClasses();
    }, []);

    const generateReport = useCallback(async () => {
        if (!startDate || !endDate) {
            toast.error("Silakan tentukan rentang tanggal.");
            return;
        }
        setLoading(true);
        
        try {
            const data = await api.getReportData({ selectedClass, startDate, endDate });
            setReportData(data);
            if (data.length === 0) {
              toast('Tidak ada data yang ditemukan untuk filter yang dipilih.', { icon: 'ℹ️' });
            }
        } catch(error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedClass, startDate, endDate]);
    
    const downloadExcel = () => {
        const processedData = reportData.map(student => {
            const summary = student.attendance_records.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            return {
                'Nama Siswa': student.nama_lengkap,
                'Kelas': student.kelas_final,
                'Total Hadir': summary['Hadir'] || 0,
                'Total Sakit': summary['Sakit'] || 0,
                'Total Izin': summary['Izin'] || 0,
                'Total Alfa': summary['Alfa'] || 0,
                'Total Pertemuan': student.attendance_records.length
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(processedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
        XLSX.writeFile(workbook, `laporan_absensi_${selectedClass}_${startDate}_${endDate}.xlsx`);
    };

    const downloadPdf = () => {
        const doc = new jspdf.jsPDF();
        doc.text(`Laporan Absensi - ${selectedClass}`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 22);

        const tableColumn = ["Nama Siswa", "Kelas", "Hadir", "Sakit", "Izin", "Alfa", "Total"];
        const tableRows: any[] = [];

        reportData.forEach(student => {
            const summary = student.attendance_records.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const studentData = [
                student.nama_lengkap,
                student.kelas_final,
                summary['Hadir'] || 0,
                summary['Sakit'] || 0,
                summary['Izin'] || 0,
                summary['Alfa'] || 0,
                student.attendance_records.length
            ];
            tableRows.push(studentData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });
        doc.save(`laporan_absensi_${selectedClass}_${startDate}_${endDate}.pdf`);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Laporan Absensi</h1>
            <p className="mt-2 text-sm text-gray-600">Filter dan unduh rekapitulasi data absensi siswa.</p>

            <div className="mt-8 p-4 bg-white rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kelas</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <button onClick={generateReport} disabled={loading} className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-50">
                    {loading ? <Spinner size="5" color="white" /> : 'Buat Laporan'}
                </button>
            </div>
            
            {reportData.length > 0 && !loading && (
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={downloadExcel} className="inline-flex items-center gap-2 rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800"><DownloadIcon className="h-4 w-4"/> Excel</button>
                    <button onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"><DownloadIcon className="h-4 w-4"/> PDF</button>
                </div>
            )}
            
            <div className="mt-4 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hadir</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sakit</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Izin</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Alfa</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kehadiran (%)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-8"><Spinner /></td></tr>
                            ) : reportData.length > 0 ? (
                                reportData.map(student => {
                                    const total = student.attendance_records.length;
                                    const hadir = student.attendance_records.filter(r => r.status === 'Hadir').length;
                                    const sakit = student.attendance_records.filter(r => r.status === 'Sakit').length;
                                    const izin = student.attendance_records.filter(r => r.status === 'Izin').length;
                                    const alfa = student.attendance_records.filter(r => r.status === 'Alfa').length;
                                    const percentage = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.nama_lengkap}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.kelas_final}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{hadir}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{sakit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{izin}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{alfa}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{percentage}%</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Tidak ada data untuk laporan ini. Klik "Buat Laporan" untuk memulai.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
