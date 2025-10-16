#!/usr/bin/env node

/**
 * Apply Permanent Message Delivery Fix Migration
 * 
 * This script applies the permanent fix for message delivery status
 * by running the 006_fix_message_delivery_permanent.sql migration.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyDeliveryFixMigration() {
  try {
    console.log('🚀 Applying permanent message delivery fix migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../../migration/006_fix_message_delivery_permanent.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('🔧 Executing migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not available, trying direct execution...');
      
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase
            .from('_temp_migration_exec')
            .select('*')
            .limit(0); // This will fail, but we'll use the connection

          // Use raw SQL execution
          const { error: sqlError } = await supabase.rpc('exec', {
            sql: statement
          });

          if (sqlError) {
            console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
            console.error(sqlError);
            throw sqlError;
          }
        }
      }
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify the fix by checking message delivery statistics
    console.log('🔍 Verifying migration results...\n');

    const { data: stats, error: statsError } = await supabase
      .rpc('get_message_delivery_stats');

    if (statsError) {
      console.error('⚠️  Could not retrieve delivery statistics:', statsError);
    } else if (stats && stats.length > 0) {
      const stat = stats[0];
      console.log('📊 Message Delivery Statistics:');
      console.log(`   Total messages: ${stat.total_messages}`);
      console.log(`   Delivered messages: ${stat.delivered_messages} (${stat.delivery_percentage}%)`);
      console.log(`   Read messages: ${stat.read_messages} (${stat.read_percentage}%)`);
      
      if (stat.delivery_percentage === 100) {
        console.log('✅ All messages now have delivery status!');
      } else {
        console.log('⚠️  Some messages still missing delivery status');
      }
    }

    console.log('\n🎉 Permanent message delivery fix applied successfully!');
    console.log('📝 Key changes:');
    console.log('   - Created trigger to auto-set delivered_at for new messages');
    console.log('   - Updated existing messages with delivery timestamps');
    console.log('   - Added constraint to prevent future null delivered_at values');
    console.log('   - Enhanced mark_messages_as_read function with safety measures');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyDeliveryFixMigration();