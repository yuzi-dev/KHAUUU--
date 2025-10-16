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

async function testProfileCreation() {
  console.log('Testing profile creation directly...');
  
  const env = loadEnv();
  
  // Create admin client
  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get the user from auth
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError || !users.users.length) {
      console.error('No users found:', usersError);
      return;
    }

    const user = users.users[0]; // Get the first user
    console.log('Testing with user:', user.email, user.id);

    // Generate username from email
    const emailUsername = user.email.split('@')[0];
    let username = emailUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    if (username.length < 3) {
      username = user.id.substring(0, 8);
    }

    console.log('Generated username:', username);

    // Try to create profile directly
    console.log('Creating profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.id,
        username: username,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        bio: null,
        profile_image_url: user.user_metadata?.avatar_url || null,
        website: null,
        location: null,
        is_vegetarian: false,
        is_verified: false,
        reviews_public: true,
        saved_public: false,
        reviews_count: 0,
        followers_count: 0,
        following_count: 0
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      
      // Check if it's a unique constraint error
      if (profileError.code === '23505') {
        console.log('Checking for existing profile or username conflict...');
        
        // Check if profile already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (existingProfile) {
          console.log('Profile already exists:', existingProfile);
        } else {
          // Check username conflict
          const { data: usernameConflict } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
            
          if (usernameConflict) {
            console.log('Username conflict with:', usernameConflict);
          }
        }
      }
    } else {
      console.log('✅ Profile created successfully:', profile);
    }
    
  } catch (err) {
    console.error('❌ Test error:', err);
  }
}

testProfileCreation();