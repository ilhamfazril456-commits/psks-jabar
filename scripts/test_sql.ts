import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zwjbjmafxixudhlvaxef.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_gfED-uLm3fHFdjb9yseJfw_4U33m83N';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function testSql() {
  console.log('Testing SQL execution options on Supabase...');

  // Method 1: Check if an rpc function exists or test endpoint
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    console.log('RPC endpoint status:', res.status);
  } catch (e) {
    console.log('RPC error:', e);
  }

  // Method 2: Check pg_meta or management endpoint
  try {
    const res = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('PG query status:', res.status);
    const text = await res.text();
    console.log('PG query body:', text);
  } catch (e) {
    console.log('PG query error:', e);
  }
}

testSql();
