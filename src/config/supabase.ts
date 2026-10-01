/* supabase.ts */
import { createClient } from '@supabase/supabase-js';
import { Logger } from '../services/Logger';

// Safely retrieve Supabase credentials from Vite environment or project defaults
const supabaseUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  'https://ngsudgrpwssbfpdpbjud.supabase.co';

const supabaseAnonKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nc3VkZ3Jwd3NzYmZwZHBianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTM1MDgsImV4cCI6MjEwNDA2OTUwOH0.d5gKgQkpGfOpcQgHDQ-RdTFwO-zy05MkKkv0m5bgbdA';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
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

