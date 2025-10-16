#!/usr/bin/env node

require('dotenv').config({ path: '../../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUserDirect() {
  console.log('🔐 Creating Admin User Directly');
  console.log('===============================\n');

  // Use the data from your previous attempt
  const adminData = {
    fullName: 'santosh thapa chhetri',
    username: 'santosh',
    email: 'admin@khauuu.com',
    password: 'Admin@123',
    role: 'admin'
  };

  try {
    console.log(`Creating admin user: ${adminData.username} (${adminData.email})`);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('username, email')
      .or(`username.eq.${adminData.username},email.eq.${adminData.email}`);

    if (checkError) {
      throw new Error(`Database check failed: ${checkError.message}`);
    }

    if (existingUser && existingUser.length > 0) {
      const existing = existingUser[0];
      if (existing.username === adminData.username) {
        console.log('⚠️  Username already exists, trying to update...');
      }
      if (existing.email === adminData.email) {
        console.log('⚠️  Email already exists, trying to update...');
      }
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

    // Create or update admin user
    const { data: newUser, error: createError } = await supabase
      .from('admin_users')
      .upsert({
        username: adminData.username,
        email: adminData.email,
        password_hash: passwordHash,
        full_name: adminData.fullName,
        role: adminData.role,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      })
      .select('id, username, email, full_name, role, created_at')
      .single();

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`);
    }

    console.log('\n✅ Admin user created/updated successfully!');
    console.log('==========================================');
    console.log(`ID: ${newUser.id}`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Full Name: ${newUser.full_name}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Created: ${new Date(newUser.created_at).toLocaleString()}`);
    console.log('\n🎉 The admin user can now log in to the admin panel!');
    console.log(`🔗 Login at: http://localhost:3000`);
    console.log(`👤 Username: ${newUser.username}`);
    console.log(`🔑 Password: ${adminData.password}`);

    // Verify the user was created
    console.log('\n🔍 Verifying user creation...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', adminData.username)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ User verified in database');
    }

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUserDirect();