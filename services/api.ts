
import { supabase } from './supabase';
import { Student, StudentExcelRow, ActivityLog, AttendanceStatus, Database, UserProfile } from '../types';

type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];
type AttendanceRecordInsert = Database['public']['Tables']['attendance_records']['Insert'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

const PAGE_SIZE = 15;

// --- Authentication ---

export const signUp = async (email: string, password: string, fullName: string) => {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });
};

export const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
    await supabase.auth.signOut();
};

export const resetPasswordForEmail = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/',
    });
};

export const updatePassword = async (password: string) => {
    return await supabase.auth.updateUser({ password });
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();
    if (error || !data) {
      if (error?.code === 'PGRST116') {
         throw new Error("Profil pengguna belum siap. Silakan coba lagi sesaat.");
      }
      throw new Error("Gagal memuat profil pengguna.");
    }
    return data;
};

// --- Student Management ---

export const getStudents = async (searchTerm: string, page: number = 1): Promise<{ students: Student[], count: number }> => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('students')
      .select('id, created_at, nama_lengkap, kelas_final, nisn, tanggal_lahir, gender', { count: 'exact' });
    
    if (searchTerm) {
        query = query.ilike('nama_lengkap', `%${searchTerm}%`);
    }

    const { data, error, count } = await query
        .order('nama_lengkap')
        .range(from, to);

    if (error) throw new Error("Gagal memuat data siswa.");
    return { students: data || [], count: count || 0 };
};


export const addStudent = async (students: StudentInsert[]) => {
    const { error } = await supabase.from('students').insert(students);
    if (error) throw new Error("Gagal menambahkan siswa.");
};

export const updateStudent = async (id: number, studentData: StudentUpdate) => {
    const { error } = await supabase.from('students').update(studentData).eq('id', id);
    if (error) throw new Error("Gagal memperbarui siswa.");
};

export const deleteStudent = async (id: number) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw new Error("Gagal menghapus siswa.");
};

export const uploadStudents = async (rows: StudentExcelRow[], userId: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
    const validStudents: StudentInsert[] = [];
    const uploadErrors: string[] = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2; // Excel rows are 1-based, +1 for header
        if (!row.NAMA_LENGKAP || typeof row.NAMA_LENGKAP !== 'string') {
            uploadErrors.push(`Baris ${rowNum}: NAMA_LENGKAP kosong atau tidak valid.`);
            return;
        }
        if (!row.KELAS || typeof row.KELAS !== 'number' || ![10, 11, 12].includes(row.KELAS)) {
            uploadErrors.push(`Baris ${rowNum}: KELAS harus 10, 11, atau 12.`);
            return;
        }
        if (!row.JENIS_KELAMIN || !['L', 'P'].includes(row.JENIS_KELAMIN)) {
            uploadErrors.push(`Baris ${rowNum}: JENIS_KELAMIN harus 'L' atau 'P'.`);
            return;
        }
        
        let dob: string | null = null;
        try {
            if (row.TANGGAL_LAHIR) { 
                let date: Date;
                if (typeof row.TANGGAL_LAHIR === 'number') {
                    date = new Date(Math.round((row.TANGGAL_LAHIR - 25569) * 86400 * 1000));
                } else {
                     date = new Date(row.TANGGAL_LAHIR);
                }
                if (isNaN(date.getTime())) throw new Error('Invalid date value');
                dob = date.toISOString().split('T')[0];
            }
        } catch(e) {
            uploadErrors.push(`Baris ${rowNum}: Format TANGGAL_LAHIR tidak valid.`);
            return;
        }

        validStudents.push({
            nama_lengkap: row.NAMA_LENGKAP.trim(),
            kelas_final: `${row.KELAS}-${row.JENIS_KELAMIN === 'L' ? 'A' : 'B'}`,
            gender: row.JENIS_KELAMIN,
            nisn: row.NISN ? String(row.NISN).trim() : null,
            tanggal_lahir: dob,
        });
    });
    
    if (validStudents.length > 0) {
        const { error } = await supabase.from('students').insert(validStudents);
        if (error) {
            throw new Error(`Gagal menyimpan data ke database: ${error.message}`);
        }
        await addActivityLog(userId, `mengunggah data ${validStudents.length} siswa baru`);
    }

    return {
        successCount: validStudents.length,
        errorCount: uploadErrors.length,
        errors: uploadErrors,
    };
};


// --- Attendance Management ---

export const getClasses = async (): Promise<string[]> => {
    const { data, error } = await supabase.from('students').select('kelas_final');
    if (error) {
        console.error("Error fetching classes:", error.message);
        throw new Error("Gagal memuat daftar kelas.");
    }
    if (!data) return [];
    const uniqueClasses = [...new Set(data.map(s => s.kelas_final))].sort();
    return uniqueClasses;
};

export const getAttendanceDataForClass = async (className: string, date: string, subjectHour: number) => {
    const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('kelas_final', className)
        .order('nama_lengkap');
    if (studentsError) throw new Error("Gagal memuat data siswa untuk kelas ini.");

    const studentIds = studentsData?.map(s => s.id) || [];
    if (studentIds.length === 0) {
        return { students: [], attendance: {} };
    }

    const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('date', date)
        .eq('subject_hour', subjectHour)
        .in('student_id', studentIds);
    if (attendanceError) throw new Error("Gagal memuat data absensi yang sudah ada.");

    const newAttendance: Record<number, AttendanceStatus> = {};
    if (attendanceData) {
        attendanceData.forEach(record => {
            newAttendance[record.student_id] = record.status as AttendanceStatus;
        });
    }

    studentsData.forEach(s => {
        if (!newAttendance[s.id]) {
            newAttendance[s.id] = 'Hadir'; // Default to 'Hadir'
        }
    });

    return { students: studentsData || [], attendance: newAttendance };
};

export const saveAttendance = async (
    attendance: Record<number, AttendanceStatus>,
    details: { date: string, subjectHour: number, teacherId: string }
) => {
    const recordsToUpsert: AttendanceRecordInsert[] = Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id),
        date: details.date,
        subject_hour: details.subjectHour,
        status,
        recorded_by_teacher_id: details.teacherId,
    }));

    if (recordsToUpsert.length === 0) {
        return;
    }

    const { error } = await supabase.from('attendance_records').upsert(recordsToUpsert, {
        onConflict: 'student_id, date, subject_hour'
    });
    if (error) throw new Error("Gagal menyimpan absensi ke database.");
};

// --- Reports ---
interface ReportFilter {
    selectedClass: string;
    startDate: string;
    endDate: string;
}

export const getReportData = async (filters: ReportFilter) => {
    let studentsQuery = supabase.from('students').select('*');
    if (filters.selectedClass && filters.selectedClass !== 'Semua Kelas') {
        studentsQuery = studentsQuery.eq('kelas_final', filters.selectedClass);
    }
    const { data: students, error: studentError } = await studentsQuery.order('nama_lengkap');

    if (studentError) throw new Error(`Gagal memuat data siswa untuk laporan: ${studentError.message}`);
    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.id);

    const { data: records, error: recordError } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .in('student_id', studentIds)
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);

    if (recordError) throw new Error(`Gagal memuat data absensi untuk laporan: ${recordError.message}`);
    
    const recordsByStudentId = new Map<number, any[]>();
    (records || []).forEach(r => {
        if (!recordsByStudentId.has(r.student_id)) {
            recordsByStudentId.set(r.student_id, []);
        }
        recordsByStudentId.get(r.student_id)!.push(r);
    });

    const reportData = students.map(s => ({
        ...s,
        attendance_records: recordsByStudentId.get(s.id) || [],
    }));

    return reportData;
};

// --- Parent Portal ---

interface ParentAccessInput {
    nisn: string;
    namaLengkap: string;
    tanggalLahir: string;
}
export const findStudentForParent = async ({ nisn, namaLengkap, tanggalLahir }: ParentAccessInput): Promise<Student> => {
    let studentData: Student | null = null;

    // Step 1: Find the student
    if (nisn) {
        const { data, error } = await supabase.from('students').select('*').eq('nisn', nisn.trim()).single();
        if (error || !data) throw new Error('Siswa dengan NISN tersebut tidak ditemukan.');
        studentData = data;
    } else {
        let query = supabase.from('students')
            .select('*')
            .ilike('nama_lengkap', namaLengkap.trim());

        // Only add date filter if it's provided, as it is now optional
        if (tanggalLahir) {
          query = query.eq('tanggal_lahir', tanggalLahir)
        }
        
        const { data, error } = await query;

        if (error) throw new Error(`Gagal mengambil data: ${error.message}`);
        if (!data || data.length === 0) throw new Error('Siswa tidak ditemukan. Periksa kembali nama dan tanggal lahir.');

        if (data.length > 1) {
            throw new Error('Ditemukan lebih dari satu siswa. Silakan gunakan NISN untuk hasil yang lebih akurat.');
        }
        studentData = data[0];
    }
    
    if (!studentData) {
        throw new Error('Siswa tidak ditemukan.');
    }

    const finalStudentData = studentData;
    
    // Step 2: Fetch attendance records for the found student
    const { data: records, error: recordError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', finalStudentData.id);

    if (recordError) {
        throw new Error('Gagal memuat riwayat absensi.');
    }
    
    // Step 3: Attach records to student object and return
    const studentWithRecords: Student = {
      ...finalStudentData,
      attendance_records: records || []
    };
    return studentWithRecords;
};


// --- Activity Logs ---

export const addActivityLog = async (userId: string, action: string) => {
    const payload: ActivityLogInsert = { user_id: userId, action_description: action };
    try {
        const { error } = await supabase.from('activity_logs').insert([payload]);
        if (error) throw error;
    } catch (error: any) {
        console.error("Gagal menambahkan log aktivitas:", error.message);
    }
};

export const getLatestActivityLogs = async (limit: number = 10): Promise<ActivityLog[]> => {
    const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('id, created_at, user_id, action_description')
        .order('created_at', { ascending: false })
        .limit(limit);
        
    if (error) throw new Error("Gagal memuat log aktivitas.");
    if (!logs || logs.length === 0) return [];

    const userIds = [...new Set(logs.map(log => log.user_id))];
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

    if (profileError) {
        console.error("Gagal memuat profil untuk log: ", profileError.message);
        return logs as ActivityLog[];
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    
    const logsWithProfiles = logs.map(log => ({
        ...log,
        profiles: profileMap.get(log.user_id) ? { full_name: profileMap.get(log.user_id)!.full_name } : undefined
    }));
    
    return logsWithProfiles;
};

export const subscribeToActivityLogs = (callback: (log: ActivityLog) => void) => {
    const channel = supabase
        .channel('activity-log-changes')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs'
        }, async (payload) => {
            try {
                const newLog = payload.new as Omit<ActivityLog, 'profiles'>;
                
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', newLog.user_id)
                    .single();

                if (profileError) throw profileError;

                const logWithProfile: ActivityLog = {
                  ...newLog,
                  profiles: profileData ? { full_name: profileData.full_name } : undefined,
                };
                
                callback(logWithProfile);
            } catch (error: any) {
                 console.error("Gagal mengambil detail log baru:", error.message);
            }
        })
        .subscribe();
    return channel;
};
