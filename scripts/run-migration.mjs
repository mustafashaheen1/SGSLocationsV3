import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Running migration to make projects.property_id nullable...');

const sql = `ALTER TABLE projects ALTER COLUMN property_id DROP NOT NULL;`;

const { error } = await supabase.rpc('query', { query_text: sql });

if (error) {
  console.error('Error running migration:', error);
  console.log('\nAlternatively, run this SQL directly in Supabase SQL Editor:');
  console.log(sql);
  process.exit(1);
} else {
  console.log('✓ Migration completed successfully!');
  console.log('property_id column in projects table is now nullable');
}
