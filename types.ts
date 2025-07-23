
export type UserRole = 'teacher' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export type Gender = 'L' | 'P';
export type Grade = '10' | '11' | '12';
export type ClassLetter = 'A' | 'B';

export interface Student {
  id: string;
  name: string;
  nisn?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  grade: Grade;
  classLetter: ClassLetter;
  gender: Gender;
  parentId?: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  classPeriod: number; // 1, 2, 3...
  status: AttendanceStatus;
}

export interface HistoryLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
}