
import { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export interface Student {
  id: number;
  created_at: string;
  nama_lengkap: string;
  kelas_final: string;
  nisn: string | null;
  tanggal_lahir: string;
  gender: 'L' | 'P';
  attendance_records?: AttendanceRecord[];
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

export interface AttendanceRecord {
  id: number;
  created_at: string;
  student_id: number;
  date: string;
  status: AttendanceStatus;
  subject_hour: number;
  recorded_by_teacher_id: string;
}

export interface ActivityLog {
  id: number;
  created_at: string;
  user_id: string;
  action_description: string;
  user_profile?: { full_name: string };
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
}


export type StudentExcelRow = {
  NAMA_LENGKAP: string;
  KELAS: number;
  JENIS_KELAMIN: 'L' | 'P';
  NISN?: string;
  TANGGAL_LAHIR: string | number;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: number;
          created_at: string;
          nama_lengkap: string;
          kelas_final: string;
          nisn: string | null;
          tanggal_lahir: string;
          gender: 'L' | 'P';
        };
        Insert: {
          id?: number;
          created_at?: string;
          nama_lengkap: string;
          kelas_final: string;
          nisn: string | null;
          tanggal_lahir: string;
          gender: 'L' | 'P';
        };
        Update: {
          id?: number;
          created_at?: string;
          nama_lengkap?: string;
          kelas_final?: string;
          nisn?: string | null;
          tanggal_lahir?: string;
          gender?: 'L' | 'P';
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: number;
          created_at: string;
          student_id: number;
          date: string;
          status: AttendanceStatus;
          subject_hour: number;
          recorded_by_teacher_id: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          student_id: number;
          date: string;
          status: AttendanceStatus;
          subject_hour: number;
          recorded_by_teacher_id: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          student_id?: number;
          date?: string;
          status?: AttendanceStatus;
          subject_hour?: number;
          recorded_by_teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_records_recorded_by_teacher_id_fkey',
            columns: ['recorded_by_teacher_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_records_student_id_fkey',
            columns: ['student_id'],
            isOneToOne: false,
            referencedRelation: 'students',
            referencedColumns: ['id']
          }
        ];
      };
      activity_logs: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          action_description: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id: string;
          action_description: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string;
          action_description?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id']
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey',
            columns: ['id'],
            isOneToOne: true,
            referencedRelation: 'users',
            referencedColumns: ['id']
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
