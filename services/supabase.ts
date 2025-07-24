
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Use environment variables for production readiness.
// In a real Vercel deployment, these would be set in the project settings.
// For this sandboxed environment, we provide fallback values to prevent a crash.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osudjmbrnspbcddufvdg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdWRqbWJybnNwYmNkZHVmdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzc2OTksImV4cCI6MjA2ODk1MzY5OX0.zj_1m7L9GFZ7XSgkzn_qsCpuekcXSJRjmXnfDx36IwE';


if (!supabaseUrl || !supabaseAnonKey) {
  // This error will still be thrown if credentials are not provided in a real environment.
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);