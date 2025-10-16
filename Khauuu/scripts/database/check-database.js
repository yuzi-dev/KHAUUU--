const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    const env = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error reading .env.local:', error);
    return {};
  }
}

async function checkDatabase() {
  console.log('Checking database state...');
  
  const env = loadEnv();
  
  // Create admin client to check database
  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check profiles table
    console.log('\n=== Checking profiles table ===');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log('Profiles found:', profiles.length);
      profiles.forEach(profile => {
        console.log(`- ${profile.username} (${profile.full_name}) - User ID: ${profile.user_id} - Created: ${profile.created_at}`);
      });
    }

    // Check auth.users table
    console.log('\n=== Checking auth.users table ===');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Auth users found:', users.users.length);
      users.users.forEach(user => {
        console.log(`- ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    }

    // Check if there's a mismatch
    console.log('\n=== Analysis ===');
    if (users.users && profiles) {
      const authUserIds = users.users.map(u => u.id);
      const profileUserIds = profiles.map(p => p.user_id);
      
      const missingProfiles = authUserIds.filter(id => !profileUserIds.includes(id));
      
      if (missingProfiles.length > 0) {
        console.log('❌ Users without profiles:', missingProfiles.length);
        missingProfiles.forEach(userId => {
          const user = users.users.find(u => u.id === userId);
          console.log(`  - ${user.email} (${userId})`);
        });
      } else {
        console.log('✅ All users have profiles');
      }
    }
    
  } catch (err) {
    console.error('❌ Database check error:', err);
  }
}

checkDatabase();