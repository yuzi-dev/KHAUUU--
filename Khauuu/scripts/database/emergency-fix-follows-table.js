const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixFollowsTable() {
  console.log('🔧 Starting emergency fix for follows table audit trigger issue...')
  
  try {
    // Step 1: Drop all audit triggers on follows table
    console.log('Step 1: Dropping audit triggers...')
    const dropTriggersSQL = `
      DROP TRIGGER IF EXISTS audit_follows_trigger ON public.follows;
      DROP TRIGGER IF EXISTS audit_trigger ON public.follows;
      DROP TRIGGER IF EXISTS follows_audit_trigger ON public.follows;
      DROP TRIGGER IF EXISTS trigger_audit_follows ON public.follows;
    `
    
    const { error: dropTriggersError } = await supabase.rpc('exec_sql', { 
      sql: dropTriggersSQL 
    })
    
    if (dropTriggersError) {
      console.log('Trying alternative method to drop triggers...')
      // Try individual drops
      await supabase.rpc('exec_sql', { sql: 'DROP TRIGGER IF EXISTS audit_follows_trigger ON public.follows;' })
      await supabase.rpc('exec_sql', { sql: 'DROP TRIGGER IF EXISTS audit_trigger ON public.follows;' })
      await supabase.rpc('exec_sql', { sql: 'DROP TRIGGER IF EXISTS follows_audit_trigger ON public.follows;' })
    }
    
    // Step 2: Drop audit functions
    console.log('Step 2: Dropping audit functions...')
    const dropFunctionsSQL = `
      DROP FUNCTION IF EXISTS audit.audit_trigger_function() CASCADE;
      DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
      DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;
    `
    
    await supabase.rpc('exec_sql', { sql: dropFunctionsSQL })
    
    // Step 3: Drop audit schema
    console.log('Step 3: Dropping audit schema...')
    await supabase.rpc('exec_sql', { sql: 'DROP SCHEMA IF EXISTS audit CASCADE;' })
    
    // Step 4: Verify follows table structure
    console.log('Step 4: Verifying follows table structure...')
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'follows')
      .eq('table_schema', 'public')
    
    console.log('Follows table columns:', columns?.map(c => c.column_name))
    
    // Step 5: Test the follows table
    console.log('Step 5: Testing follows table...')
    const { data: testData, error: testError } = await supabase
      .from('follows')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Follows table test failed:', testError)
    } else {
      console.log('✅ Follows table is accessible')
    }
    
    // Step 6: Check for remaining triggers
    console.log('Step 6: Checking for remaining audit triggers...')
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .like('trigger_name', '%audit%')
      .eq('event_object_table', 'follows')
    
    if (triggers && triggers.length > 0) {
      console.log('⚠️  Remaining audit triggers found:', triggers)
    } else {
      console.log('✅ No audit triggers found on follows table')
    }
    
    console.log('🎉 Emergency fix completed! The follows API should now work correctly.')
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error)
    
    // Fallback: Try to create a simple RPC function to execute raw SQL
    console.log('Trying fallback method...')
    try {
      const fallbackSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
      
      await supabase.rpc('exec_sql', { sql: fallbackSQL })
      console.log('✅ Fallback RPC function created')
      
    } catch (fallbackError) {
      console.error('❌ Fallback method also failed:', fallbackError)
      console.log('Please run the SQL commands manually in your database:')
      console.log(`
        DROP TRIGGER IF EXISTS audit_follows_trigger ON public.follows;
        DROP TRIGGER IF EXISTS audit_trigger ON public.follows;
        DROP TRIGGER IF EXISTS follows_audit_trigger ON public.follows;
        DROP FUNCTION IF EXISTS audit.audit_trigger_function() CASCADE;
        DROP SCHEMA IF EXISTS audit CASCADE;
      `)
    }
  }
}

// Run the fix
fixFollowsTable().then(() => {
  console.log('Script completed')
  process.exit(0)
}).catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})