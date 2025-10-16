# Admin User Management Scripts

This directory contains utility scripts for managing admin users in the Khauuu admin system.

## create-admin-user.js

Creates a new admin user with proper password hashing and validation.

### Prerequisites

1. Make sure you have the required environment variables set in your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install required dependencies:
   ```bash
   npm install @supabase/supabase-js bcryptjs dotenv
   ```

3. Run the database migration to create the admin_users table:
   ```bash
   # Apply the migration file: 013_create_admin_users_table.sql
   ```

### Usage

1. Navigate to the scripts directory:
   ```bash
   cd scripts/utilities
   ```

2. Run the script:
   ```bash
   node create-admin-user.js
   ```

3. Follow the interactive prompts:
   - **Full Name**: The admin user's full name
   - **Username**: Unique username for login
   - **Email**: Valid email address (must be unique)
   - **Password**: Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
   - **Role**: Choose between 'admin' or 'super_admin'

### Security Features

- Passwords are hashed using bcrypt with 12 salt rounds
- Email and username uniqueness validation
- Strong password requirements
- Secure environment variable handling
- Input validation and sanitization

### Example Output

```
🔐 Admin User Creation Script
================================

Full Name: John Doe
Username: johndoe
Email: john@example.com
Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ********
Confirm Password: ********
Role (admin/super_admin) [admin]: admin

📝 Creating admin user...

✅ Admin user created successfully!
================================
ID: 123e4567-e89b-12d3-a456-426614174000
Username: johndoe
Email: john@example.com
Full Name: John Doe
Role: admin
Created: 1/15/2024, 10:30:00 AM

🎉 The admin user can now log in to the admin panel!
```

### Troubleshooting

- **Database connection errors**: Check your Supabase URL and service role key
- **Permission errors**: Ensure the service role key has proper permissions
- **Validation errors**: Follow the password and email format requirements
- **Duplicate errors**: Username and email must be unique across all admin users

### Security Notes

- Never commit the service role key to version control
- Use strong, unique passwords for admin accounts
- Regularly rotate admin passwords
- Monitor admin user activity through the admin_sessions table
- Consider implementing 2FA for additional security