#!/usr/bin/env node

require('dotenv').config({ path: '../../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    console.log('Required variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTables() {
    console.log('🔍 Debugging Admin Tables');
    console.log('========================\n');

    try {
        // Check if admin_users table exists
        console.log('1. Checking if admin_users table exists...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('admin_users')
            .select('count', { count: 'exact', head: true });

        if (tableError) {
            console.error('❌ admin_users table does not exist or is not accessible:');
            console.error(tableError.message);
            return;
        }

        console.log('✅ admin_users table exists');
        console.log(`   Current row count: ${tableCheck?.count || 0}\n`);

        // Check table structure
        console.log('2. Checking table structure...');
        const { data: structureData, error: structureError } = await supabase
            .rpc('get_table_columns', { table_name: 'admin_users' })
            .single();

        if (structureError) {
            console.log('⚠️  Could not get table structure (this is normal)');
        }

        // Try to select from admin_users
        console.log('3. Trying to select from admin_users...');
        const { data: users, error: selectError } = await supabase
            .from('admin_users')
            .select('*');

        if (selectError) {
            console.error('❌ Error selecting from admin_users:');
            console.error(selectError.message);
            return;
        }

        console.log(`✅ Successfully queried admin_users table`);
        console.log(`   Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}`);
        });

        // Check admin_sessions table
        console.log('\n4. Checking admin_sessions table...');
        const { data: sessions, error: sessionsError } = await supabase
            .from('admin_sessions')
            .select('*');

        if (sessionsError) {
            console.error('❌ Error with admin_sessions table:');
            console.error(sessionsError.message);
        } else {
            console.log(`✅ admin_sessions table exists with ${sessions.length} sessions`);
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

debugTables();