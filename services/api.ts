
import { createClient } from '@supabase/supabase-js';
import { User, Student, AttendanceRecord, HistoryLog } from '../types';

// --- Supabase Setup ---
const supabaseUrl = 'https://eqohwhrliqnouukkvkzq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxb2h3aHJsaXFub3V1a2t2a3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mzc2NzksImV4cCI6MjA2ODQxMzY3OX0.fiIKlH9M9fhKlC60eAXvffkZqmZKY4vCJ5vK5KvM4OI';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helper Functions ---
const fromSupabase = (data: any) => {
    if (!data) return data;
    const { class_letter, parent_id, student_id, user_name, class_period, ...rest } = data;
    const result: any = { ...rest };
    if (class_letter !== undefined) result.classLetter = class_letter;
    if (parent_id !== undefined) result.parentId = parent_id;
    if (student_id !== undefined) result.studentId = student_id;
    if (user_name !== undefined) result.user = user_name;
    if (class_period !== undefined) result.classPeriod = class_period;
    return result;
};

const toSupabase = (data: any) => {
    if (!data) return data;
    const { classLetter, parentId, studentId, user, classPeriod, ...rest } = data;
    const result: any = { ...rest };
    if (classLetter !== undefined) result.class_letter = classLetter;
    if (parentId !== undefined) result.parent_id = parentId;
    if (studentId !== undefined) result.student_id = studentId;
    if (user !== undefined) result.user_name = user;
    if (classPeriod !== undefined) result.class_period = classPeriod;
    return result;
};

const addHistory = async (userName: string, action: string) => {
    try {
        await supabase.from('history_logs').insert({ user_name: userName, action });
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
    
    if (profileError || !profile) throw new Error("Gagal mengambil profil pengguna.");

    return { id: data.user.id, email: data.user.email!, name: profile.name, role: profile.role as User['role'] };
  },
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
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

    if (error || !profile) {
        console.error("Error fetching profile for current user:", error);
        return null;
    }

    return { id: user.id, email: user.email!, name: profile.name, role: profile.role as User['role'] };
  }
};

const studentService = {
  getStudents: async (): Promise<Student[]> => {
      const { data, error } = await supabase.from('students').select('*').order('name');
      if (error) throw error;
      return data.map(fromSupabase);
  },
  getStudentForParent: async (parentId: string): Promise<Student | null> => {
      const { data, error } = await supabase.from('students').select('*').eq('parent_id', parentId).maybeSingle();
      if (error) throw error;
      return data ? fromSupabase(data) : null;
  },
  addStudent: async (studentData: Omit<Student, 'id' | 'classLetter'>): Promise<Student> => {
    const newStudentData = { ...studentData, class_letter: studentData.gender === 'L' ? 'A' : 'B' };
    const { data, error } = await supabase.from('students').insert(toSupabase(newStudentData)).select().single();
    if (error) throw error;
    addHistory(await getUserNameFromState(), `Menambahkan siswa baru: ${data.name}.`);
    return fromSupabase(data);
  },
  bulkAddStudents: async (studentsData: Omit<Student, 'id' | 'classLetter'>[]): Promise<void> => {
    const newStudents = studentsData.map(s => ({ ...s, class_letter: s.gender === 'L' ? 'A' : 'B' }));
    const { error } = await supabase.from('students').insert(newStudents.map(toSupabase));
    if (error) throw error;
    addHistory(await getUserNameFromState(), `Mengupload ${studentsData.length} siswa baru dari Excel.`);
  },
  updateStudent: async (id: string, updateData: Partial<Omit<Student, 'id'>>): Promise<Student> => {
    let supabaseUpdateData: any = toSupabase(updateData);
    if (updateData.gender) {
        supabaseUpdateData.class_letter = updateData.gender === 'L' ? 'A' : 'B';
    }
    const { data, error } = await supabase.from('students').update(supabaseUpdateData).eq('id', id).select().single();
    if (error) throw error;
    addHistory(await getUserNameFromState(), `Mengupdate data siswa: ${data.name}.`);
    return fromSupabase(data);
  },
};

const attendanceService = {
  getAttendanceRecords: async (): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase.from('attendance_records').select('*, students(name)');
      if (error) throw error;
      return data.map(r => ({ ...fromSupabase(r), studentName: r.students.name }));
  },
  getAttendanceForClass: async (className: string, date: string, period: number): Promise<AttendanceRecord[]> => {
    const grade = className.substring(0, 2);
    const classLetter = className.substring(2);
    const { data: studentsInClass, error: studentError } = await supabase.from('students').select('id').eq('grade', grade).eq('class_letter', classLetter);
    if(studentError) throw studentError;
    const studentIds = studentsInClass.map(s => s.id);

    const { data, error } = await supabase.from('attendance_records').select('*').in('student_id', studentIds).eq('date', date).eq('class_period', period);
    if (error) throw error;
    return data.map(fromSupabase);
  },
  saveAttendance: async (records: Omit<AttendanceRecord, 'id' | 'studentName'>[]): Promise<void> => {
    const recordsToSave = records.map(r => toSupabase({ student_id: r.studentId, date: r.date, class_period: r.classPeriod, status: r.status }));
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

export const api = {
  auth: authService,
  students: studentService,
  attendance: attendanceService,
  getHistory: async (): Promise<HistoryLog[]> => {
    const { data, error } = await supabase.from('history_logs').select('*').order('timestamp', { ascending: false }).limit(20);
    if (error) throw error;
    return data.map(fromSupabase);
  },
};
