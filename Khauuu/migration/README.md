# Database Migration Scripts for Nepal Food Finder

This directory contains consolidated SQL migration scripts for setting up the complete database schema for the Nepal Food Finder application.

## Migration Files (Consolidated Structure)

### 001_core_tables_and_structure.sql
Creates the foundational database structure including:
- Profiles table with user information and statistics
- Supporting tables (reviews, saved_items)
- Restaurants and foods tables
- Basic triggers and functions
- Core RLS policies

### 002_follows_and_relationships.sql
Implements the social features including:
- Follows table for user relationships
- Follow request system
- Relationship statistics and materialized views
- Social interaction triggers

### 003_notifications_and_advanced_features.sql
Advanced notification system with:
- Partitioned notifications table
- Real-time notification triggers
- Notification management functions
- Advanced search capabilities

### 004_performance_and_optimization.sql
Performance enhancements including:
- Database indexes for optimal query performance
- Materialized views for statistics
- Query optimization functions
- Performance monitoring utilities

### 005_security_archival_and_audit.sql
Security and data management features:
- Enhanced Row Level Security (RLS) policies
- Data archival system for old records
- Comprehensive audit trail system
- Security helper functions

## Running Migrations

Execute the migration files in sequential order:

1. Run `001_core_tables_and_structure.sql`
2. Run `002_follows_and_relationships.sql`
3. Run `003_notifications_and_advanced_features.sql`
4. Run `004_performance_and_optimization.sql`
5. Run `005_security_archival_and_audit.sql`

## Features Included

- **User Profiles**: Complete profile management with statistics and social features
- **Reviews System**: User reviews for restaurants and foods with moderation
- **Saved Items**: Bookmarking system for restaurants, foods, and offers
- **Following System**: User-to-user following relationships with request status
- **Notifications**: Real-time partitioned notification system
- **Search**: Advanced full-text search capabilities
- **Performance**: Optimized indexes and materialized views
- **Security**: Comprehensive Row Level Security (RLS) policies
- **Audit Trail**: Complete audit logging system
- **Data Archival**: Automated archival of old data
- **Triggers**: Automatic statistics updates and timestamp management
- **Helper Functions**: Utility functions for common operations

## Project Structure

The project has been organized with the following structure:

```
Khauuu/
├── migration/                    # Database migration files
│   ├── 001_core_tables_and_structure.sql
│   ├── 002_follows_and_relationships.sql
│   ├── 003_notifications_and_advanced_features.sql
│   ├── 004_performance_and_optimization.sql
│   ├── 005_security_archival_and_audit.sql
│   └── README.md
├── scripts/                      # Organized utility scripts
│   ├── database/                 # Database checking and fixing scripts
│   ├── migration/                # Migration running and debugging scripts
│   ├── testing/                  # Test scripts and HTML files
│   └── utilities/                # General utility scripts
├── app/                          # Next.js application files
├── components/                   # React components
├── contexts/                     # React contexts
├── features/                     # Feature-specific code
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
└── public/                       # Static assets
```

## How to Run in Supabase

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Execute Migration Files**
   - Copy and paste each migration file content in sequential order
   - Run each migration completely before proceeding to the next
   - Verify successful execution before continuing

3. **Verify Installation**
   - Check that all tables are created
   - Verify RLS policies are active
   - Test basic functionality

## Troubleshooting

- **Permission Errors**: Ensure you're using the service role key for migrations
- **RLS Issues**: Check that policies are properly created and enabled
- **Performance**: Monitor query performance and adjust indexes as needed
- **Audit Logs**: Review audit tables for system monitoring

## Maintenance

- **Regular Archival**: The system automatically archives old data
- **Performance Monitoring**: Use the included performance utilities
- **Security Audits**: Review audit logs regularly
- **Index Maintenance**: Monitor and maintain database indexes

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `001_create_profiles_table.sql`
5. Click **Run** to execute
6. Repeat steps 3-5 for `002_create_supporting_tables.sql`

### Method 2: Using Supabase CLI

```bash
# Make sure you're in your project directory
supabase db reset

# Or apply migrations individually
supabase db push
```

## What These Scripts Do

### 001_create_profiles_table.sql

- Creates the main `profiles` table with all fields from the profile page
- Sets up Row Level Security (RLS) policies
- Creates automatic profile creation trigger for new user signups
- Handles both email/password and Google OAuth signups
- Generates unique usernames automatically
- Includes all privacy settings and user preferences

### 002_create_supporting_tables.sql

- Creates `follows` table for user following relationships
- Creates `reviews` table for user reviews and ratings
- Creates `saved_items` table for saved restaurants, offers, and foods
- Sets up triggers to automatically update profile statistics
- Includes proper RLS policies for all tables

## Key Features

### Automatic Profile Creation
- When a user signs up (email/password or Google OAuth), a profile is automatically created
- Username is generated from email address with uniqueness checks
- Google profile pictures are automatically imported
- Full name is extracted from OAuth data when available

### Privacy Controls
- Users can control visibility of their reviews (public/private)
- Users can control visibility of their saved items (public/private)
- All data respects user privacy settings

### Statistics Tracking
- Automatic counting of reviews, followers, and following
- Statistics are updated in real-time via database triggers

### Security
- Full Row Level Security implementation
- Users can only modify their own data
- Public data is viewable by everyone
- Private data is only accessible to the owner

## Environment Variables Required

Make sure these are set in your `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary (for image uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Testing

After running the migrations:

1. Test user signup (both email/password and Google OAuth)
2. Verify profile is created automatically
3. Test profile editing functionality
4. Test privacy settings
5. Test following/unfollowing users
6. Test creating and viewing reviews
7. Test saving/unsaving items

## Troubleshooting

If you encounter any issues:

1. Check that all environment variables are set correctly
2. Ensure you have the necessary permissions in Supabase
3. Verify that the auth.users table exists (it should be created automatically by Supabase Auth)
4. Check the Supabase logs for any error messages

## Notes

- The scripts are idempotent - you can run them multiple times safely
- All tables use UUIDs as primary keys for better performance and security
- Timestamps are stored with timezone information
- All text fields have appropriate length limits to prevent abuse