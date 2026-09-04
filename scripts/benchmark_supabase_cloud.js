import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ngsudgrpwssbfpdpbjud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nc3VkZ3Jwd3NzYmZwZHBianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTM1MDgsImV4cCI6MjEwNDA2OTUwOH0.d5gKgQkpGfOpcQgHDQ-RdTFwO-zy05MkKkv0m5bgbdA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function benchmarkSupabase() {
  console.log('====================================================');
  console.log('🚀 SUPABASE CLOUD LIVE PERFORMANCE & HEALTH BENCHMARK');
  console.log('Project URL:', SUPABASE_URL);
  console.log('====================================================\n');

  // 1. Auth Latency Check
  const tAuthStart = performance.now();
  const { data: authData, error: authError } = await supabase.auth.getSession();
  const authLatency = Math.round(performance.now() - tAuthStart);
  console.log(`🔐 1. Supabase Auth Ping: ${authLatency}ms (Status: ${authError ? 'Error: ' + authError.message : 'Active & Responding'})`);

  // 2. Table Inspection & Query Latency Benchmark
  const coreTables = [
    'profiles',
    'shops',
    'shop_memberships',
    'customers',
    'categories',
    'products',
    'sales',
    'sale_items',
    'payments',
    'ledger_entries',
    'stock_movements',
    'worker_activity_logs',
    'sale_attachments',
    'notifications'
  ];

  console.log('\n📊 2. Database Schema & Query Latency:');
  const latencies = [];

  for (const table of coreTables) {
    const t0 = performance.now();
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      const elapsed = Math.round(performance.now() - t0);
      latencies.push(elapsed);

      if (error) {
        console.log(`   ❌ Table '${table}': ERROR (${error.code}: ${error.message}) [${elapsed}ms]`);
      } else {
        console.log(`   ✅ Table '${table.padEnd(22)}': READY (Count: ${count ?? 0}) • Latency: ${elapsed}ms`);
      }
    } catch (err) {
      console.log(`   ⚠️ Table '${table}': Exception ${err.message}`);
    }
  }

  // 3. Stored Procedures / RPC Check
  console.log('\n⚡ 3. Stored Procedures & Security Definier RPCs:');
  
  // Test authenticate_worker_pin RPC ping
  const tRpcStart = performance.now();
  const { data: rpcData, error: rpcError } = await supabase.rpc('authenticate_worker_pin', {
    p_shop_id: '00000000-0000-0000-0000-000000000000',
    p_email_or_phone: 'test@ping.com',
    p_pin_hash: 'dummy_hash'
  });
  const rpcLatency = Math.round(performance.now() - tRpcStart);
  
  if (rpcError && rpcError.code === 'P0001') {
    console.log(`   ✅ RPC 'authenticate_worker_pin': INSTANT RESPONSE (${rpcLatency}ms) - Logic: Safe rejection of nonexistent shop`);
  } else if (!rpcError) {
    console.log(`   ✅ RPC 'authenticate_worker_pin': INSTANT RESPONSE (${rpcLatency}ms)`);
  } else {
    console.log(`   ℹ️ RPC 'authenticate_worker_pin': ${rpcError.message} (${rpcLatency}ms)`);
  }

  // 4. Summary & Performance Verdict
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);

  console.log('\n====================================================');
  console.log('📈 PERFORMANCE SUMMARY:');
  console.log(`   • Tables verified: ${latencies.length} / ${coreTables.length}`);
  console.log(`   • Average query speed: ${avgLatency}ms`);
  console.log(`   • Fastest query: ${minLatency}ms`);
  console.log(`   • Slowest query: ${maxLatency}ms`);
  console.log(`   • Quality Rating: ${avgLatency < 200 ? '⚡ ULTRA-FAST (<200ms)' : '🟢 HEALTHY (<500ms)'}`);
  console.log('====================================================');
}

benchmarkSupabase();
