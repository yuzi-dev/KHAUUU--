const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('🔍 Verifying sharing system migration...\n');

  try {
    // 1. Check if shared_content table exists and get its structure
    console.log('1. Checking shared_content table structure...');
    const { data: sharedContentColumns, error: sharedContentError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'shared_content' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (sharedContentError) {
      console.error('❌ Error checking shared_content table:', sharedContentError);
    } else if (sharedContentColumns && sharedContentColumns.length > 0) {
      console.log('✅ shared_content table exists with columns:');
      sharedContentColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ shared_content table not found');
    }

    // 2. Check messages table for new columns
    console.log('\n2. Checking messages table for new columns...');
    const { data: messagesColumns, error: messagesError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'messages' 
          AND table_schema = 'public'
          AND column_name IN ('sender_id', 'shared_content_id')
          ORDER BY column_name;
        `
      });

    if (messagesError) {
      console.error('❌ Error checking messages table:', messagesError);
    } else if (messagesColumns && messagesColumns.length > 0) {
      console.log('✅ Messages table has new columns:');
      messagesColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ New columns not found in messages table');
    }

    // 3. Check if sharing functions exist
    console.log('\n3. Checking sharing system functions...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT routine_name, routine_type
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name IN ('share_content_in_message', 'get_shared_content_details', 'get_messages_with_shared_content')
          ORDER BY routine_name;
        `
      });

    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError);
    } else if (functions && functions.length > 0) {
      console.log('✅ Sharing functions found:');
      functions.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`);
      });
    } else {
      console.log('❌ Sharing functions not found');
    }

    // 4. Check RLS policies on shared_content
    console.log('\n4. Checking RLS policies on shared_content...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'shared_content'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.error('❌ Error checking RLS policies:', policiesError);
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies found on shared_content:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('❌ No RLS policies found on shared_content');
    }

    // 5. Test basic functionality - try to query shared_content table
    console.log('\n5. Testing basic table access...');
    const { data: testQuery, error: testError } = await supabase
      .from('shared_content')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing shared_content table:', testError);
    } else {
      console.log('✅ shared_content table is accessible');
      console.log(`   Current records: ${testQuery ? testQuery.length : 0}`);
    }

    console.log('\n🎉 Migration verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyMigration();