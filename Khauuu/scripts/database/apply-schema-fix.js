const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchemaFix() {
  try {
    console.log('Applying schema fix for follows table...')
    
    // Drop existing foreign key constraints
    console.log('Dropping existing foreign key constraints...')
    
    const dropConstraints = `
      ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_user_id_fkey;
      ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_followed_user_id_fkey;
    `
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropConstraints })
    
    if (dropError) {
      console.error('Error dropping constraints:', dropError)
      // Try individual drops
      try {
        await supabase.rpc('exec_sql', { sql: 'ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_user_id_fkey;' })
        await supabase.rpc('exec_sql', { sql: 'ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_followed_user_id_fkey;' })
        console.log('Constraints dropped individually')
      } catch (individualError) {
        console.error('Individual drop error:', individualError)
      }
    } else {
      console.log('Constraints dropped successfully')
    }
    
    // Add new foreign key constraints
    console.log('Adding new foreign key constraints...')
    
    const addConstraints = `
      ALTER TABLE follows 
      ADD CONSTRAINT follows_follower_user_id_fkey 
      FOREIGN KEY (follower_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
      
      ALTER TABLE follows 
      ADD CONSTRAINT follows_followed_user_id_fkey 
      FOREIGN KEY (followed_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    `
    
    const { error: addError } = await supabase.rpc('exec_sql', { sql: addConstraints })
    
    if (addError) {
      console.error('Error adding constraints:', addError)
      // Try individual adds
      try {
        await supabase.rpc('exec_sql', { 
          sql: 'ALTER TABLE follows ADD CONSTRAINT follows_follower_user_id_fkey FOREIGN KEY (follower_user_id) REFERENCES profiles(id) ON DELETE CASCADE;' 
        })
        await supabase.rpc('exec_sql', { 
          sql: 'ALTER TABLE follows ADD CONSTRAINT follows_followed_user_id_fkey FOREIGN KEY (followed_user_id) REFERENCES profiles(id) ON DELETE CASCADE;' 
        })
        console.log('Constraints added individually')
      } catch (individualError) {
        console.error('Individual add error:', individualError)
      }
    } else {
      console.log('Constraints added successfully')
    }
    
    console.log('Schema fix completed!')
    
  } catch (error) {
    console.error('Schema fix error:', error)
  }
}

applySchemaFix()