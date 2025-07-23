import { createClient } from '@supabase/supabase-js';
import { User, Student, AttendanceRecord, HistoryLog, RegisterCredentials } from '../types';

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
        Update: {
          id?: string
          student_id?: string
          date?: string
          class_period?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          timestamp?: string
          user_name?: string
          action?: string
        }
        Relationships: []
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
        Update: {
          id?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          name?: string
          nisn?: string | null
          date_of_birth?: string | null
          grade?: string
          class_letter?: string
          gender?: string
          parent_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


// --- Supabase Setup ---
const supabaseUrl = 'https://wliodivdqqeorbpniimv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaW9kaXZkcXFlb3JicG5paW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjQwNDQsImV4cCI6MjA2ODg0MDA0NH0.D-hJVhXPNLpexdenZU5QyCcewfWrqYXDCwMAQN8QEW8';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// --- Helper Functions ---
const addHistory = async (userName: string, action: string) => {
    try {
        await supabase.from('history_logs').insert([{ user_name: userName, action }]);
    } catch (error) {
        console.error("Failed to add history:", error);
    }
};

const getUserNameFromState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        return profile?.name || 'Pengguna';
    }
    return 'Sistem';
};


// --- API Service ---

const authService = {
  login: async (email: string, pass: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error('Email atau password salah.');
    if (!data.user) throw new Error("Login gagal, pengguna tidak ditemukan.");

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', data.user.id)
        .single();
    
    if (profileError || !profile) throw new Error("Gagal mengambil profil pengguna. Pastikan email Anda sudah terverifikasi.");
    if (profile.role !== 'teacher') throw new Error("Hanya guru yang dapat login.");

    return { id: data.user.id, email: data.user.email!, name: profile.name, role: profile.role as User['role'] };
  },
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },
  register: async (credentials: RegisterCredentials): Promise<void> => {
    const { name, email, password } = credentials;
    const role = 'teacher';

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        throw new Error("Email ini sudah terdaftar.");
      }
      console.error("Signup Error:", error);
      if (error.message.includes("Database error saving new user")) {
          throw new Error("Pendaftaran gagal karena kesalahan konfigurasi basis data. Silakan hubungi administrator.");
      }
      throw new Error(`Pendaftaran gagal: ${error.message}`);
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
      if (error || !data) throw error || new Error('No students found');
      return data.map(mapToStudent);
  },
  addStudent: async (studentData: Omit<Student, 'id' | 'classLetter'>): Promise<Student> => {
    const studentToInsert: Database['public']['Tables']['students']['Insert'] = {
      name: studentData.name,
      nisn: studentData.nisn,
      date_of_birth: studentData.dateOfBirth,
      grade: studentData.grade,
      gender: studentData.gender,
      parent_id: studentData.parentId,
      class_letter: studentData.gender === 'L' ? 'A' : 'B'
    };
    const { data, error } = await supabase.from('students').insert(studentToInsert).select().single();
    if (error || !data) throw error || new Error('Failed to add student');
    addHistory(await getUserNameFromState(), `Menambahkan siswa baru: ${data.name}.`);
    return mapToStudent(data);
  },
  bulkAddStudents: async (studentsData: Omit<Student, 'id' | 'classLetter'>[]): Promise<void> => {
    const newStudents: Database['public']['Tables']['students']['Insert'][] = studentsData.map(s => ({ 
        name: s.name,
        nisn: s.nisn,
        date_of_birth: s.dateOfBirth,
        grade: s.grade,
        gender: s.gender,
        parent_id: s.parentId,
        class_letter: s.gender === 'L' ? 'A' : 'B' 
    }));
    const { error } = await supabase.from('students').insert(newStudents);
    if (error) throw error;
    addHistory(await getUserNameFromState(), `Mengupload ${studentsData.length} siswa baru dari Excel.`);
  },
  updateStudent: async (id: string, updateData: Partial<Omit<Student, 'id'>>): Promise<Student> => {
    const supabaseUpdateData: Database['public']['Tables']['students']['Update'] = {};
    if (updateData.name !== undefined) supabaseUpdateData.name = updateData.name;
    if (updateData.nisn !== undefined) supabaseUpdateData.nisn = updateData.nisn;
    if (updateData.dateOfBirth !== undefined) supabaseUpdateData.date_of_birth = updateData.dateOfBirth;
    if (updateData.grade !== undefined) supabaseUpdateData.grade = updateData.grade;
    if (updateData.parentId !== undefined) supabaseUpdateData.parent_id = updateData.parentId;
    if (updateData.gender !== undefined) {
        supabaseUpdateData.gender = updateData.gender;
        supabaseUpdateData.class_letter = updateData.gender === 'L' ? 'A' : 'B';
    }
    
    const { data, error } = await supabase.from('students').update(supabaseUpdateData).eq('id', id).select().single();
    if (error || !data) throw error || new Error('Failed to update student.');
    addHistory(await getUserNameFromState(), `Mengupdate data siswa: ${data.name}.`);
    return mapToStudent(data);
  },
};

const attendanceService = {
  getAttendanceRecords: async (): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase.from('attendance_records').select('*, students(name)');
      if (error || !data) throw error || new Error('Could not fetch attendance records.');
      return data.map(r => ({
          id: r.id,
          studentId: r.student_id,
          date: r.date,
          classPeriod: r.class_period,
          status: r.status as AttendanceRecord['status'],
          studentName: (r as any).students?.name || 'Unknown'
      }));
  },
  getAttendanceForClass: async (className: string, date: string, period: number): Promise<AttendanceRecord[]> => {
    const grade = className.substring(0, 2);
    const classLetter = className.substring(2);
    const { data: studentsInClass, error: studentError } = await supabase.from('students').select('id').eq('grade', grade).eq('class_letter', classLetter);
    if(studentError) throw studentError;
    const studentIds = studentsInClass.map(s => s.id);

    const { data, error } = await supabase.from('attendance_records').select('*').in('student_id', studentIds).eq('date', date).eq('class_period', period);
    if (error || !data) throw error || new Error('Could not fetch attendance for class');
    return data.map(r => ({
        id: r.id,
        studentId: r.student_id,
        date: r.date,
        classPeriod: r.class_period,
        status: r.status as AttendanceRecord['status'],
        studentName: '' // Name is not fetched here, so default to empty
    }));
  },
  saveAttendance: async (records: Omit<AttendanceRecord, 'id' | 'studentName'>[]): Promise<void> => {
    const recordsToSave: Database['public']['Tables']['attendance_records']['Insert'][] = records.map(r => ({ 
        student_id: r.studentId, 
        date: r.date, 
        class_period: r.classPeriod, 
        status: r.status 
    }));
    const { error } = await supabase.from('attendance_records').upsert(recordsToSave, { onConflict: 'student_id,date,class_period' });
    if (error) throw error;

    const firstRecord = records[0];
    if (firstRecord) {
        const { data: student } = await supabase.from('students').select('grade, class_letter').eq('id', firstRecord.studentId).single();
        const className = student ? `${student.grade}${student.class_letter}` : '';
        addHistory(await getUserNameFromState(), `Menyimpan absensi untuk kelas ${className} pada jam ke-${firstRecord.classPeriod}.`);
    }
  }
};

interface StudentSearchParams {
    nisn?: string;
    name?: string;
    dateOfBirth?: string;
}

const publicService = {
  findStudentAttendance: async (params: StudentSearchParams): Promise<{ student: Student, attendance: AttendanceRecord[] } | null> => {
      let query = supabase.from('students').select('*');

      if (params.nisn) {
          query = query.eq('nisn', params.nisn);
      } else if (params.name && params.dateOfBirth) {
          query = query.eq('name', params.name).eq('date_of_birth', params.dateOfBirth);
      } else {
          return null;
      }
      
      const { data: studentData, error: studentError } = await query.single();

      if (studentError || !studentData) {
          if (studentError && studentError.code !== 'PGRST116') {
             console.error('Error fetching student:', studentError);
             throw new Error('Gagal mengambil data siswa.');
          }
          return null; // Not found, but not an API error
      }

      const student: Student = mapToStudent(studentData);
      
      const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', student.id)
          .order('date', { ascending: false });

      if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
          throw new Error('Gagal mengambil data absensi.');
      }
      
      const attendance: AttendanceRecord[] = attendanceData.map(r => ({
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
    if (error || !data) throw error || new Error('Could not fetch history');
    return data.map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        user: log.user_name,
        action: log.action
    }));
  },
};