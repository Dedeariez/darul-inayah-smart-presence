import { createClient } from '@supabase/supabase-js';
import { User, Student, AttendanceRecord, HistoryLog, RegisterCredentials } from '../types';

/**
 * Tipe Database ini sebaiknya digenerate secara otomatis menggunakan Supabase CLI
 * untuk memastikan akurasi dan kemudahan maintenance.
 * Jalankan perintah: `npx supabase gen types typescript --project-id <ID_PROYEK_ANDA> > types/supabase.ts`
 * * Saya telah memperbarui tipe ini secara manual untuk mencerminkan struktur yang ada.
 */
export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          id: string
          student_id: string
          date: string
          class_period: number
          status: string
        }
        Insert: {
          id?: string
          student_id: string
          date: string
          class_period: number
          status: string
        }
        Update: Partial<Database['public']['Tables']['attendance_records']['Row']>
      }
      history_logs: {
        Row: {
          id: string
          timestamp: string
          user_name: string
          action: string
        }
        Insert: {
          id?: string
          timestamp?: string
          user_name: string
          action: string
        }
        Update: Partial<Database['public']['Tables']['history_logs']['Row']>
      }
      profiles: {
        Row: {
          id: string
          name: string
          role: string
        }
        Insert: {
          id: string
          name: string
          role: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      students: {
        Row: {
          id: string
          name: string
          nisn: string | null
          date_of_birth: string | null
          grade: string
          class_letter: string
          gender: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          name: string
          nisn?: string | null
          date_of_birth?: string | null
          grade: string
          class_letter: string
          gender: string
          parent_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['students']['Row']>
      }
    }
    Views: {
      // REKOMENDASI PERFORMA: Buat VIEW di Supabase untuk menggabungkan data absensi dan siswa.
      // SQL untuk membuat VIEW ada di penjelasan.
      attendance_details: {
        Row: {
          id: string | null
          student_id: string | null
          student_name: string | null
          date: string | null
          class_period: number | null
          status: string | null
          grade: string | null
          class_letter: string | null
        }
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}


// --- [PERBAIKAN KEAMANAN] Supabase Setup ---
// Ambil kredensial dari environment variables, bukan hardcode di sini.
// Buat file .env di root folder proyek Anda.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env file");
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);


// --- [PERBAIKAN EFISIENSI] Helper Functions ---
// Cache nama pengguna agar tidak perlu query berulang kali ke database.
let cachedUserName: string | null = null;

const getUserNameFromState = async (): Promise<string> => {
  if (cachedUserName) {
    return cachedUserName;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    if (error || !profile) {
      console.error("Failed to get user name for history log:", error);
      return 'Pengguna'; // Default
    }
    cachedUserName = profile.name;
    return profile.name;
  }
  return 'Sistem'; // Jika tidak ada user yang login
};

// Fungsi untuk membersihkan cache saat logout
const clearUserCache = () => {
  cachedUserName = null;
};

const addHistory = async (action: string) => {
    try {
        const userName = await getUserNameFromState();
        await supabase.from('history_logs').insert([{ user_name: userName, action }]);
    } catch (error) {
        console.error("Failed to add history:", error);
    }
};


// --- API Service ---

const authService = {
  login: async (email: string, pass: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      throw new Error('Email atau password salah.');
    }
    if (!data.user) throw new Error("Login gagal, pengguna tidak ditemukan.");

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', data.user.id)
        .single();
    
    if (profileError) {
        if (profileError.code === 'PGRST116') {
            throw new Error("Gagal mengambil profil. Pastikan akun Anda telah diaktifkan oleh administrator.");
        }
        throw new Error(`Kesalahan database: ${profileError.message}`);
    }

    if (profile.role !== 'teacher') throw new Error("Hanya guru yang dapat login.");
    
    // Simpan nama pengguna di cache setelah login berhasil
    cachedUserName = profile.name;

    return { id: data.user.id, email: data.user.email!, name: profile.name, role: profile.role as User['role'] };
  },
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    clearUserCache(); // Hapus cache saat logout
  },
  register: async (credentials: RegisterCredentials): Promise<void> => {
    const { name, email, password } = credentials;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'teacher' },
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        throw new Error("Email ini sudah terdaftar.");
      }
      if (error.message.includes("Database error saving new user")) {
          throw new Error("Pendaftaran gagal karena kesalahan konfigurasi basis data. Hubungi administrator.");
      }
      throw new Error(`Pendaftaran gagal: ${error.message}`);
    }
  },
  resendVerification: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      throw new Error(`Gagal mengirim ulang verifikasi: ${error.message}`);
    }
  },
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    const { user } = session;
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

    if (error || !profile || profile.role !== 'teacher') {
        return null;
    }
    
    // Simpan nama pengguna di cache
    cachedUserName = profile.name;

    return { id: user.id, email: user.email!, name: profile.name, role: profile.role as User['role'] };
  }
};

const mapToStudent = (s: Database['public']['Tables']['students']['Row']): Student => ({
    id: s.id,
    name: s.name,
    nisn: s.nisn || undefined,
    dateOfBirth: s.date_of_birth || undefined,
    grade: s.grade as Student['grade'],
    classLetter: s.class_letter as Student['classLetter'],
    gender: s.gender as Student['gender'],
    parentId: s.parent_id || undefined
});

const studentService = {
  getStudents: async (): Promise<Student[]> => {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error) throw new Error(`Gagal mengambil data siswa: ${error.message}`);
      return data.map(mapToStudent);
  },
  addStudent: async (studentData: Omit<Student, 'id' | 'classLetter'>): Promise<Student> => {
    const studentToInsert = {
      ...studentData,
      date_of_birth: studentData.dateOfBirth,
      class_letter: studentData.gender === 'L' ? 'A' : 'B'
    };
    const { data, error } = await supabase.from('students').insert(studentToInsert).select().single();
    if (error || !data) throw new Error(`Gagal menambah siswa: ${error?.message}`);
    addHistory(`Menambahkan siswa baru: ${data.name}.`);
    return mapToStudent(data);
  },
  bulkAddStudents: async (studentsData: Omit<Student, 'id' | 'classLetter'>[]): Promise<void> => {
    const newStudents = studentsData.map(s => ({ 
        ...s,
        date_of_birth: s.dateOfBirth,
        class_letter: s.gender === 'L' ? 'A' : 'B' 
    }));
    const { error } = await supabase.from('students').insert(newStudents);
    if (error) throw new Error(`Gagal mengupload siswa: ${error.message}`);
    addHistory(`Mengupload ${studentsData.length} siswa baru dari Excel.`);
  },
  updateStudent: async (id: string, updateData: Partial<Omit<Student, 'id'>>): Promise<Student> => {
    const supabaseUpdateData: Partial<Database['public']['Tables']['students']['Row']> = {
        name: updateData.name,
        nisn: updateData.nisn,
        date_of_birth: updateData.dateOfBirth,
        grade: updateData.grade,
        parent_id: updateData.parentId,
        gender: updateData.gender,
        // Logika penentuan kelas otomatis
        ...(updateData.gender && { class_letter: updateData.gender === 'L' ? 'A' : 'B' }),
    };
    
    const { data, error } = await supabase.from('students').update(supabaseUpdateData).eq('id', id).select().single();
    if (error || !data) throw new Error(`Gagal mengupdate siswa: ${error?.message}`);
    addHistory(`Mengupdate data siswa: ${data.name}.`);
    return mapToStudent(data);
  },
};

const attendanceService = {
  // [PERBAIKAN PERFORMA] Menggunakan VIEW untuk mengambil data absensi
  getAttendanceRecords: async (): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase.from('attendance_details').select('*');
      if (error) {
          console.error("Error fetching attendance details view:", error);
          throw new Error('Gagal mengambil data absensi. Pastikan VIEW "attendance_details" sudah dibuat di database.');
      }
      
      return (data || []).map(r => ({
          id: r.id!,
          studentId: r.student_id!,
          date: r.date!,
          classPeriod: r.class_period!,
          status: r.status as AttendanceRecord['status'],
          studentName: r.student_name || 'Siswa tidak dikenal'
      }));
  },
  getAttendanceForClass: async (className: string, date: string, period: number): Promise<AttendanceRecord[]> => {
    const grade = className.substring(0, 2);
    const classLetter = className.substring(2);
    const { data: studentsInClass, error: studentError } = await supabase.from('students').select('id').eq('grade', grade).eq('class_letter', classLetter);
    if(studentError) throw new Error(`Gagal mengambil data siswa kelas: ${studentError.message}`);

    const studentIds = studentsInClass.map(s => s.id);
    if (studentIds.length === 0) return [];

    const { data, error } = await supabase.from('attendance_records').select('*').in('student_id', studentIds).eq('date', date).eq('class_period', period);
    if (error) throw new Error(`Gagal mengambil absensi kelas: ${error.message}`);
    
    return data.map(r => ({
        id: r.id,
        studentId: r.student_id,
        date: r.date,
        classPeriod: r.class_period,
        status: r.status as AttendanceRecord['status'],
        studentName: '' // Nama tidak diperlukan di halaman ini
    }));
  },
  saveAttendance: async (records: Omit<AttendanceRecord, 'id' | 'studentName'>[]): Promise<void> => {
    const recordsToSave = records.map(r => ({ 
        student_id: r.studentId, 
        date: r.date, 
        class_period: r.classPeriod, 
        status: r.status 
    }));
    const { error } = await supabase.from('attendance_records').upsert(recordsToSave, { onConflict: 'student_id,date,class_period' });
    if (error) throw new Error(`Gagal menyimpan absensi: ${error.message}`);

    const firstRecord = records[0];
    if (firstRecord) {
        const { data: student } = await supabase.from('students').select('grade, class_letter').eq('id', firstRecord.studentId).single();
        const className = student ? `${student.grade}${student.class_letter}` : '';
        addHistory(`Menyimpan absensi untuk kelas ${className} pada jam ke-${firstRecord.classPeriod}.`);
    }
  }
};

interface StudentSearchParams {
    nisn?: string;
    name?: string;
    dateOfBirth?: string;
}

const publicService = {
  // Fungsi ini sebaiknya dijadikan RPC Function di Supabase untuk keamanan yang lebih baik
  findStudentAttendance: async (params: StudentSearchParams): Promise<{ student: Student, attendance: AttendanceRecord[] } | null> => {
      let query = supabase.from('students').select('*');

      if (params.nisn) {
          query = query.eq('nisn', params.nisn);
      } else if (params.name && params.dateOfBirth) {
          query = query.eq('name', params.name).eq('date_of_birth', params.dateOfBirth);
      } else {
          return null; // Tidak ada parameter yang cukup untuk mencari
      }
      
      const { data: studentData, error: studentError } = await query.single();

      if (studentError || !studentData) {
          if (studentError && studentError.code !== 'PGRST116') { // PGRST116 = not found, itu bukan error
             console.error('Error fetching student:', studentError);
             throw new Error('Gagal mengambil data siswa.');
          }
          return null;
      }

      const student: Student = mapToStudent(studentData);
      
      const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', student.id)
          .order('date', { ascending: false })
          .limit(10); // Ambil 10 data terakhir saja untuk efisiensi

      if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
          throw new Error('Gagal mengambil data absensi.');
      }
      
      const attendance = (attendanceData || []).map(r => ({
          id: r.id,
          studentId: r.student_id,
          date: r.date,
          classPeriod: r.class_period,
          status: r.status as AttendanceRecord['status'],
          studentName: student.name
      }));
      
      return { student, attendance };
  }
};

export const api = {
  auth: authService,
  students: studentService,
  attendance: attendanceService,
  public: publicService,
  getHistory: async (): Promise<HistoryLog[]> => {
    const { data, error } = await supabase.from('history_logs').select('*').order('timestamp', { ascending: false }).limit(20);
    if (error) throw new Error(`Gagal mengambil riwayat: ${error.message}`);
    return (data || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        user: log.user_name,
        action: log.action
    }));
  },
};