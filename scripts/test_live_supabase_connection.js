import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ngsudgrpwssbfpdpbjud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nc3VkZ3Jwd3NzYmZwZHBianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTM1MDgsImV4cCI6MjEwNDA2OTUwOH0.d5gKgQkpGfOpcQgHDQ-RdTFwO-zy05MkKkv0m5bgbdA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing connection to Supabase:', SUPABASE_URL);
  
  // 1. Auth test
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth check status:', authError ? `Error: ${authError.message}` : 'Success (No active session)');
  } catch (err) {
    console.error('Auth check threw:', err);
  }

  // 2. Table query tests
  const tables = ['shops', 'shop_memberships', 'profiles', 'customers', 'products', 'financial_transactions', 'stock_movements'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}': NOT FOUND or ERROR (${error.code}: ${error.message})`);
      } else {
        console.log(`Table '${table}': READY (found ${data ? data.length : 0} rows)`);
      }
    } catch (e) {
      console.log(`Table '${table}': Exception ${e.message}`);
    }
  }
}

testConnection();
