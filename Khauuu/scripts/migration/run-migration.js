const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration to add status column to follows table...');
    
    // First check if status column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'follows')
      .eq('column_name', 'status');
    
    if (columnError) {
      console.log('Could not check column existence, attempting to add status column...');
    } else if (columns && columns.length > 0) {
      console.log('Status column already exists in follows table');
      return;
    }

    // Try to add the status column using direct SQL
    const { error } = await supabase.rpc('exec', { 
      sql: `ALTER TABLE follows ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected'));`
    });
    
    if (error) {
      console.log('Direct SQL failed, trying alternative approach...');
      
      // Alternative: Use the existing direct-schema-fix approach
      const { error: altError } = await supabase
        .from('follows')
        .select('id')
        .limit(1);
        
      if (altError && altError.message.includes('column "status" does not exist')) {
        console.log('Status column needs to be added. Please run the migration manually in Supabase SQL editor:');
        console.log(`
ALTER TABLE follows ADD COLUMN status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected'));
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);
UPDATE follows SET status = 'accepted' WHERE status IS NULL;
        `);
      } else {
        console.log('Status column appears to exist or there is another issue');
      }
    } else {
      console.log('Status column added successfully!');
      
      // Add index
      await supabase.rpc('exec', { 
        sql: `CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);`
      });
      
      // Update existing records
      await supabase.rpc('exec', { 
        sql: `UPDATE follows SET status = 'accepted' WHERE status IS NULL;`
      });
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Error running migration:', error);
    console.log('Please add the status column manually in Supabase SQL editor');
  }
}

runMigration();