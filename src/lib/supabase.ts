import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vaabpnxwmqeonvuvvirx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYWJwbnh3bXFlb252dXZ2aXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODk3MTYsImV4cCI6MjA4ODQ2NTcxNn0.gis3iTTjuQ-6pJ91easRAtOfw44Wc9xs9NBx3fW89q0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
