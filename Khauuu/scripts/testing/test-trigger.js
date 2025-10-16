const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTrigger() {
  console.log('Testing database trigger...\n');

  try {
    // First, let's check if the trigger exists
    console.log('=== Checking if trigger exists ===');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError) {
      console.error('Error checking triggers:', triggerError);
    } else {
      console.log('Trigger found:', triggers?.length > 0 ? 'YES' : 'NO');
      if (triggers?.length > 0) {
        console.log('Trigger details:', triggers[0]);
      }
    }

    // Check if the function exists - using a simpler approach
    console.log('\n=== Checking if function exists ===');
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('pg_proc_exists', { function_name: 'handle_new_user' })
      .single();

    if (functionError) {
      console.log('Function check error (this might be normal):', functionError.message);
      
      // Alternative check using a direct query
      const { data: altCheck, error: altError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'handle_new_user')
        .limit(1);
        
      if (altError) {
        console.log('Alternative function check also failed:', altError.message);
      } else {
        console.log('Function exists:', altCheck?.length > 0 ? 'YES' : 'NO');
      }
    } else {
      console.log('Function exists: YES');
    }

    // Let's also check the current user and their profile
    console.log('\n=== Current user and profile status ===');
    
    // Get auth users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log(`Found ${users.users.length} auth users`);
      users.users.forEach(user => {
        console.log(`- ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    }

    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log(`\nFound ${profiles.length} profiles`);
      profiles.forEach(profile => {
        console.log(`- ${profile.username} (${profile.full_name}) - User ID: ${profile.user_id}`);
      });
    }

    // Check if all users have profiles
    if (users && profiles) {
      const usersWithoutProfiles = users.users.filter(user => 
        !profiles.some(profile => profile.user_id === user.id)
      );

      if (usersWithoutProfiles.length === 0) {
        console.log('\n✅ All users have profiles - trigger is working correctly!');
      } else {
        console.log(`\n❌ ${usersWithoutProfiles.length} users without profiles - trigger may not be working`);
        usersWithoutProfiles.forEach(user => {
          console.log(`  - ${user.email} (${user.id})`);
        });
      }
    }

  } catch (error) {
    console.error('Error testing trigger:', error);
  }
}

testTrigger();