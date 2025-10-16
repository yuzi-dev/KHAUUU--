const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function directSchemaFix() {
  try {
    console.log('Checking current follows table constraints...')
    
    // Check current constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'follows')
      .eq('constraint_type', 'FOREIGN KEY')
    
    if (constraintsError) {
      console.error('Error checking constraints:', constraintsError)
    } else {
      console.log('Current constraints:', constraints)
    }
    
    console.log('Dropping existing follows table and recreating...')
    
    // Drop and recreate the follows table with correct references
    const dropAndRecreate = `
      DROP TABLE IF EXISTS follows CASCADE;
      
      CREATE TABLE follows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          follower_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          followed_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure a user can't follow the same person twice
          UNIQUE(follower_user_id, followed_user_id),
          
          -- Ensure a user can't follow themselves
          CHECK (follower_user_id != followed_user_id)
      );
      
      -- Create indexes for follows table
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_user_id);
      CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_user_id);
      
      -- Enable RLS
      ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies
      CREATE POLICY "Users can view follows" ON follows FOR SELECT USING (true);
      CREATE POLICY "Users can create follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_user_id);
      CREATE POLICY "Users can delete their follows" ON follows FOR DELETE USING (auth.uid() = follower_user_id);
    `
    
    // Execute using a simple query since rpc doesn't work
    const { error } = await supabase.rpc('exec', { sql: dropAndRecreate })
    
    if (error) {
      console.error('Error executing SQL:', error)
      
      // Try alternative approach - use the SQL editor endpoint
      console.log('Trying alternative approach...')
      
      // Let's try to use the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: dropAndRecreate })
      })
      
      if (!response.ok) {
        console.error('REST API error:', await response.text())
      } else {
        console.log('Schema recreated successfully via REST API')
      }
    } else {
      console.log('Schema recreated successfully')
    }
    
  } catch (error) {
    console.error('Direct schema fix error:', error)
  }
}

directSchemaFix()