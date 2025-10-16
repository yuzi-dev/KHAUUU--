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

async function testProfileAPI() {
  console.log('Testing profile creation API...');
  
  const env = loadEnv();
  
  // Create a test user session to get a valid token
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // First, let's check if we can get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ No active session found. Please sign in first.');
      console.log('This test requires an active user session.');
      return false;
    }

    console.log('✅ Found active session for user:', session.user.email);
    
    // Test the profile creation API
    const response = await fetch('http://localhost:3000/api/profile/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const result = await response.text();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
    if (response.ok) {
      console.log('✅ Profile API test successful');
      return true;
    } else {
      console.log('❌ Profile API test failed');
      return false;
    }
    
  } catch (err) {
    console.error('❌ Profile API test error:', err);
    return false;
  }
}

testProfileAPI();