import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zwjbjmafxixudhlvaxef.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_gfED-uLm3fHFdjb9yseJfw_4U33m83N';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
  console.log('Testing Supabase connection...');
  try {
    // Check if we can query or test
    const { data, error } = await supabase.from('test').select('*').limit(1);
    console.log('Result:', { data, error });
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      console.error('Unexpected error:', error);
    } else {
      console.log('Successfully connected to Supabase! (Table test does not exist yet as expected)');
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();
