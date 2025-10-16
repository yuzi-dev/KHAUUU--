# Scripts Directory

This directory contains organized utility scripts for the Nepal Food Finder project.

## Directory Structure

### database/
Scripts for database management and verification:
- `check-database.js` - Verify database connection and basic functionality
- `check-auth-users.js` - Check authentication and user management
- `check-profiles.js` - Comprehensive profile system verification
- `check-profiles-simple.js` - Simple profile verification
- `check-schema.js` - Database schema validation
- `apply-schema-fix.js` - Apply schema corrections
- `direct-schema-fix.js` - Direct database schema fixes

### migration/
Scripts for running and managing database migrations:
- `run-migration.js` - Execute database migrations
- `run-sql-migration.js` - Run SQL migration files
- `run-webhook-migration.js` - Handle webhook-related migrations
- `debug-api-update.js` - Debug API update issues

### testing/
Test scripts and HTML files for various system components:
- `test-api-*.js` - API endpoint testing scripts
- `test-profile-*.js` - Profile system testing
- `test-notification-*.js` - Notification system testing
- `test-follow-*.js` - Following system testing
- `test-realtime.html` - Real-time functionality testing
- Various other component-specific test files

### utilities/
General utility scripts (currently empty, ready for future utilities):
- Reserved for create, setup, generate, update, fix, and cleanup scripts

## Usage

Navigate to the specific subdirectory and run the appropriate script:

```bash
# Database verification
node scripts/database/check-database.js

# Run migrations
node scripts/migration/run-migration.js

# Test API endpoints
node scripts/testing/test-api-response.js
```

## Best Practices

1. **Database Scripts**: Always test database scripts in a development environment first
2. **Migration Scripts**: Run migrations in sequential order and verify each step
3. **Testing Scripts**: Use testing scripts to verify functionality after changes
4. **Utilities**: Add new utility scripts to the appropriate subdirectory

## Adding New Scripts

When adding new scripts:
1. Place them in the appropriate subdirectory based on their function
2. Use descriptive names that indicate the script's purpose
3. Include proper error handling and logging
4. Document any dependencies or requirements