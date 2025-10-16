const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Total profiles:', data?.length || 0);
    if (data) {
      data.forEach(p => {
        console.log(`Profile: ${p.user_id} -> ${p.username}`);
      });
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkProfiles();