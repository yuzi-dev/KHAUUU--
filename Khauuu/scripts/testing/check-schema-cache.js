const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchemaCache() {
  try {
    console.log('🔍 Checking database schema and cache...\n');
    
    // Method 1: Try to query the constraint directly using raw SQL
    console.log('1. Checking foreign key constraints using raw query...');
    
    try {
      // Use the REST API directly to check constraints
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: `
            SELECT 
              tc.constraint_name,
              tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'reviews'
              AND kcu.column_name = 'user_id';
          `
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Foreign key constraints found:', result);
      } else {
        console.log('❌ Could not query constraints via REST API');
      }
    } catch (fetchError) {
      console.log('❌ REST API query failed:', fetchError.message);
    }
    
    // Method 2: Try to force schema refresh by making a simple query
    console.log('\n2. Attempting to refresh schema cache...');
    
    // Sometimes making a simple query can refresh the cache
    const { data: tablesData, error: tablesError } = await supabase
      .from('reviews')
      .select('id')
      .limit(0);
    
    if (tablesError) {
      console.log('Table query error:', tablesError);
    } else {
      console.log('✅ Reviews table accessible');
    }
    
    // Method 3: Check if we can create the constraint again (should fail if it exists)
    console.log('\n3. Testing constraint creation (should fail if exists)...');
    
    try {
      const constraintResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: `ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;`
        })
      });
      
      const constraintResult = await constraintResponse.text();
      console.log('Constraint creation result:', constraintResult);
      
    } catch (constraintError) {
      console.log('Constraint creation error (expected if exists):', constraintError.message);
    }
    
    // Method 4: Try alternative join syntax
    console.log('\n4. Testing alternative join approaches...');
    
    // Try using explicit table names
    const { data: explicitJoin, error: explicitError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review_text,
        user_id
      `)
      .limit(1);
    
    if (explicitError) {
      console.log('❌ Explicit join failed:', explicitError);
    } else {
      console.log('✅ Basic review query works');
      
      if (explicitJoin.length > 0) {
        // Now try to get the profile separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name')
          .eq('user_id', explicitJoin[0].user_id)
          .single();
        
        if (profileError) {
          console.log('❌ Profile lookup failed:', profileError);
        } else {
          console.log('✅ Manual join works:', {
            review: explicitJoin[0],
            profile: profileData
          });
        }
      }
    }
    
    // Method 5: Check PostgREST version and capabilities
    console.log('\n5. Checking PostgREST capabilities...');
    
    try {
      const postgrestResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      if (postgrestResponse.ok) {
        const postgrestInfo = await postgrestResponse.json();
        console.log('PostgREST info:', postgrestInfo);
      }
    } catch (postgrestError) {
      console.log('Could not get PostgREST info');
    }
    
    console.log('\n📋 Recommendations:');
    console.log('1. The foreign key constraint might exist but Supabase schema cache needs refresh');
    console.log('2. Try restarting your Supabase project or wait a few minutes');
    console.log('3. Check the Supabase dashboard SQL editor to verify the constraint exists');
    console.log('4. Consider using manual joins in your API instead of relying on PostgREST auto-joins');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchemaCache();