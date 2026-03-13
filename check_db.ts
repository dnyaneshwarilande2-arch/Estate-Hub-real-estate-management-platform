import { createClient } from '@supabase/supabase-js';

// Note: To run this, use: npx tsx --env-file=.env check_db.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('properties').select('id, title, status');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Properties:', data);
}

check();

