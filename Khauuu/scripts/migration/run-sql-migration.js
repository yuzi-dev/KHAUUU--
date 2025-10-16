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

async function runSqlMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}...`);
    
    // Read the SQL file
    const migrationPath = path.join(__dirname, '..', '..', 'migration', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments and empty lines for cleaner execution
    const cleanedSql = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');
    
    console.log('Executing migration SQL...');
    
    try {
      const { error } = await supabase.rpc('sql', { 
        query: cleanedSql
      });
      
      if (error) {
        console.error('Error executing migration:', error);
        throw error;
      }
      
      console.log('Migration executed successfully');
    } catch (sqlError) {
      console.error('Failed to execute migration:', sqlError);
      throw sqlError;
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
  console.error('Usage: node run-sql-migration.js <migration-file.sql>');
  process.exit(1);
}

runSqlMigration(migrationFile);