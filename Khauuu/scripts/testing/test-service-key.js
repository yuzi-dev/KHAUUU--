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

async function testServiceKey() {
  console.log('Testing Supabase service role key...');
  
  const env = loadEnv();
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!env.SUPABASE_SERVICE_ROLE_KEY);
    return false;
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Service key test failed:', error);
      return false;
    }

    console.log('✅ Service key is working correctly');
    return true;
  } catch (err) {
    console.error('❌ Service key test error:', err);
    return false;
  }
}

testServiceKey();