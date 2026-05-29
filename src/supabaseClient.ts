import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://nakimhiiqwcyymqpsizy.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2ltaGlpcXdjeXltcXBzaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTYxMDIsImV4cCI6MjA5NTA3MjEwMn0.zb6SwR3DKem0evfazxSZBoq_IjX74cF8a_BcKkU5cG8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
