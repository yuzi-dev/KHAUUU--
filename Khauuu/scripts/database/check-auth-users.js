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

async function checkAuthUsers() {
  try {
    console.log('Checking auth.users table...')
    
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5)
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      console.log('Trying alternative approach...')
      
      // Try using RPC to get auth users
      const { data: rpcUsers, error: rpcError } = await supabase
        .rpc('get_auth_users')
      
      if (rpcError) {
        console.error('RPC error:', rpcError)
      } else {
        console.log('Auth users via RPC:', rpcUsers)
      }
    } else {
      console.log('Auth users:', authUsers)
    }
    
    // Check profiles table
    console.log('\nChecking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .limit(5)
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    } else {
      console.log('Profiles:', profiles)
    }
    
    // Check if profiles.id matches auth.users.id
    if (profiles && profiles.length > 0) {
      const profileId = profiles[0].id
      console.log(`\nChecking if profile ID ${profileId} exists in auth.users...`)
      
      // Try to query auth.users directly with service key
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(profileId)
      
      if (authUserError) {
        console.error('Error fetching auth user by ID:', authUserError)
      } else {
        console.log('Auth user found:', authUser)
      }
    }
    
    // Check follows table structure
    console.log('\nChecking follows table...')
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .limit(3)
    
    if (followsError) {
      console.error('Error fetching follows:', followsError)
    } else {
      console.log('Follows:', follows)
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

checkAuthUsers()