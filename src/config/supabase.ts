/* supabase.ts */
import { createClient } from '@supabase/supabase-js';
import { Logger } from '../services/Logger';

const env = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    supabaseUrl !== 'your_supabase_url' &&
    supabaseAnonKey !== 'your_supabase_anon_key'
  );
};

// Create client conditionally to prevent crashes when environment variables are missing
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (isSupabaseConfigured()) {
  Logger.info('Supabase: Client initialized successfully.');
} else {
  Logger.warn('Supabase: Environment variables missing or placeholder. Running in Local-First Fallback Mode.');
}
