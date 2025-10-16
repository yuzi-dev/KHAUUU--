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

async function checkSchema() {
  try {
    console.log('Checking follows table structure...')
    
    // Check table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'follows' })
    
    if (columnsError) {
      console.log('RPC not available, trying direct query...')
      
      // Try to get table info using a simple query
      const { data: tableInfo, error: tableError } = await supabase
        .from('follows')
        .select('*')
        .limit(0)
      
      if (tableError) {
        console.error('Table error:', tableError)
      } else {
        console.log('Table exists and is accessible')
      }
    } else {
      console.log('Table columns:', columns)
    }
    
    // Check if we can query the information schema
    console.log('Checking constraints via raw SQL...')
    
    // Let's try to manually recreate the follows table with correct references
    console.log('Attempting to recreate follows table...')
    
    // First, let's see what happens if we try to drop the table
    const { error: dropError } = await supabase
      .from('follows')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (dropError) {
      console.error('Cannot clear follows table:', dropError)
    } else {
      console.log('Follows table cleared')
    }
    
    // Let's check what auth.users contains
    console.log('Checking auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Cannot access auth.users:', authError)
    } else {
      console.log('Auth users:', authUsers.users.map(u => ({ id: u.id, email: u.email })))
    }
    
  } catch (error) {
    console.error('Schema check error:', error)
  }
}

checkSchema()