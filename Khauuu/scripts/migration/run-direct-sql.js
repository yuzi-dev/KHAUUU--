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

async function runDirectSql(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}...`);
    
    // Read the SQL file
    const migrationPath = path.join(__dirname, '..', '..', 'migration', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        
        const { error } = await supabase
          .from('_dummy_table_that_does_not_exist')
          .select('*')
          .limit(0);
        
        // Use the raw query method instead
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error(`Error executing statement: ${errorData}`);
            throw new Error(`HTTP ${response.status}: ${errorData}`);
          }
          
          console.log('Statement executed successfully');
        } catch (fetchError) {
          console.error('Failed to execute statement:', fetchError);
          throw fetchError;
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error running migration:', error);
    console.log('Please run the migration manually in Supabase SQL editor');
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file name');
  console.error('Usage: node run-direct-sql.js <migration-file.sql>');
  process.exit(1);
}

runDirectSql(migrationFile);