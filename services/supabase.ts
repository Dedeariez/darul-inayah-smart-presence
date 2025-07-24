import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Ambil variabel dari environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// PENTING: Lakukan pengecekan sebelum membuat klien
if (!supabaseUrl || !supabaseAnonKey) {
  // Berikan pesan error yang jelas jika variabel tidak ditemukan
  // Ini akan sangat membantu saat debugging di lingkungan mana pun
  throw new Error("Variabel Supabase (VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY) tidak ditemukan. Pastikan sudah diatur di Secrets atau .env.local");
}

// Buat dan ekspor klien hanya jika variabel sudah ada
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);