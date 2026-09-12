import { createClient } from '@supabase/supabase-js';

// Supabase project credentials for E-Kabad Setu
const SUPABASE_URL = 'https://wnrzuuscipsilzlzrsvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inducnp1dXNjaXBzbGl6bHpyc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTAwMjYsImV4cCI6MjEwNDc4NjAyNn0.NI7DlhDwY-HBurKfu3l_5R9U1qpPRIctXoyuVRU2_Vw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Health check helper to test active connectivity to Supabase.
 */
export async function checkSupabaseHealth(): Promise<{ online: boolean; message: string }> {
  try {
    const { error } = await supabase.from('materials').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { online: false, message: error.message };
    }
    return { online: true, message: 'Connected to Supabase PostgreSQL' };
  } catch (err: any) {
    return { online: false, message: err?.message || 'Network unreachable' };
  }
}

export default supabase;
