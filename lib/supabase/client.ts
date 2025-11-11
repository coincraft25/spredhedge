import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are not configured!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Current URL:', supabaseUrl || 'undefined');
  console.error('Current Key:', supabaseAnonKey ? 'Set (hidden)' : 'undefined');

  if (typeof window !== 'undefined') {
    const message = 'Application configuration error: Supabase connection not configured. Please check deployment environment variables.';
    console.error(message);
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
