#!/usr/bin/env node

/**
 * Script to create a new admin user
 * Usage: node create-admin-user.js
 * 
 * This script will prompt for admin user details and create a new admin user
 * with proper password hashing in the admin_users table.
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '../../.env.local' });

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

async function createAdminUser() {
  console.log('🔐 Admin User Creation Script');
  console.log('================================\n');

  try {
    // Get user input
    const fullName = await question('Full Name: ');
    if (!fullName.trim()) {
      throw new Error('Full name is required');
    }

    const username = await question('Username: ');
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    let email;
    do {
      email = await question('Email: ');
      if (!validateEmail(email)) {
        console.log('❌ Please enter a valid email address');
      }
    } while (!validateEmail(email));

    let password;
    do {
      password = await questionHidden('Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ');
      if (!validatePassword(password)) {
        console.log('❌ Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
      }
    } while (!validatePassword(password));

    const confirmPassword = await questionHidden('Confirm Password: ');
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    let role;
    do {
      role = await question('Role (admin/super_admin) [admin]: ');
      role = role.trim() || 'admin';
      if (!['admin', 'super_admin'].includes(role)) {
        console.log('❌ Role must be either "admin" or "super_admin"');
      }
    } while (!['admin', 'super_admin'].includes(role));

    console.log('\n📝 Creating admin user...');

    // Check if username or email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${email}`);

    if (checkError) {
      throw new Error(`Database check failed: ${checkError.message}`);
    }

    if (existingUser && existingUser.length > 0) {
      const existing = existingUser[0];
      if (existing.username === username) {
        throw new Error('Username already exists');
      }
      if (existing.email === email) {
        throw new Error('Email already exists');
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const { data: newUser, error: createError } = await supabase
      .from('admin_users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        is_active: true
      })
      .select('id, username, email, full_name, role, created_at')
      .single();

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log(`ID: ${newUser.id}`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Full Name: ${newUser.full_name}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Created: ${new Date(newUser.created_at).toLocaleString()}`);
    console.log('\n🎉 The admin user can now log in to the admin panel!');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Script terminated by user');
  rl.close();
  process.exit(0);
});

// Run the script
createAdminUser();