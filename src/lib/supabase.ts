import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
  console.warn('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.warn('The app will continue but database features will not work.');
}

// Validate URL format
if (supabaseUrl) {
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('Invalid VITE_SUPABASE_URL format. It should be like: https://your-project-id.supabase.co');
  }
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'buddy-hunt-web'
    }
  }
}) : null;

// Test connection on initialization
if (supabase) {
  supabase.from('user_profiles').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('Supabase connection test failed:', error.message);
        if (error.message.includes('permission')) {
          console.error('Permission denied. Please check:');
          console.error('1. Your Supabase project URL and anon key are correct');
          console.error('2. Row Level Security (RLS) policies are properly configured');
          console.error('3. The user_profiles table exists and has proper permissions');
        }
      } else {
        console.log('✅ Supabase connection successful');
      }
    })
    .catch(error => {
      console.error('Supabase connection error:', error);
    });
} else {
  console.warn('Supabase client not initialized due to missing environment variables');
}