import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debugging for the user to see in their browser console
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Supabase environment variables are missing!');
} else {
  console.log('Supabase client initialized with URL:', supabaseUrl.substring(0, 10) + '...');
}

// Ensure the URL is valid, fallback to empty string if missing
export const supabase = createClient(
  supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : '', 
  supabaseAnonKey || ''
);
