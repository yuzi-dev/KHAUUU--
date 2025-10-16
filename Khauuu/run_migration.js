const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration(filename) {
  try {
    console.log(`\n=== Running migration: ${filename} ===`);
    const migrationSQL = fs.readFileSync(`./migration/${filename}`, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the REST API to execute raw SQL
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Statement ${i + 1} failed:`, errorText);
          console.error(`Failed statement: ${statement.substring(0, 200)}...`);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err.message);
        console.error(`Failed statement: ${statement.substring(0, 200)}...`);
      }
    }
    
    console.log(`=== Completed migration: ${filename} ===\n`);
  } catch (err) {
    console.error(`Error reading migration file ${filename}:`, err.message);
  }
}

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Please provide a migration file name');
    console.error('Usage: node run_migration.js <filename>');
    process.exit(1);
  }
  
  await runMigration(migrationFile);
}

main();