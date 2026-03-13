import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // Try to select user_full_name from inquiries to see if it exists
    const { data, error } = await supabase.from('inquiries').select('*').limit(1);
    if (error) {
        console.error('Error fetching inquiries:', error);
    } else {
        console.log('Inquiry columns:', Object.keys(data[0] || {}));
    }

    // Check inquiry_status enum values (by trying to insert a dummy one or checking types)
    // Actually, we can just try to fetch some inquiries and see their statuses.
    console.log('Sample inquiries:', data);
}

check();
