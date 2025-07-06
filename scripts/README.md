# Database Migration Scripts

This directory contains scripts to help migrate data between your local development database and production Neon database.

## Scripts Overview

### 1. `migrate-to-production.js`
Direct migration from local database to production database.

**Usage:**
```bash
node scripts/migrate-to-production.js
```

**What it does:**
- Exports all data from local PostgreSQL database
- Clears all existing data in production Neon database
- Imports the local data to production
- Verifies the migration was successful
- Includes confirmation prompt for safety

### 2. `backup-local-data.js`
Creates a JSON backup of your local database.

**Usage:**
```bash
# Create backup with timestamp filename
node scripts/backup-local-data.js

# Create backup with custom filename
node scripts/backup-local-data.js my-backup.json
```

**What it does:**
- Exports all data from local database to a JSON file
- Saves backup in `backups/` directory
- Includes timestamp and record counts

### 3. `restore-from-backup.js`
Restores data from a JSON backup file to either local or production database.

**Usage:**
```bash
# Restore to production (default)
node scripts/restore-from-backup.js backups/backup-2024-01-01.json

# Restore to local database
node scripts/restore-from-backup.js backups/backup-2024-01-01.json local
```

**What it does:**
- Reads backup JSON file
- Clears target database
- Imports backup data
- Verifies restoration
- Includes confirmation prompt for safety

## Recommended Workflow

### Option 1: Direct Migration
```bash
# Direct migration (recommended for simple cases)
node scripts/migrate-to-production.js
```

### Option 2: Backup & Restore
```bash
# 1. Create a backup first (recommended for safety)
node scripts/backup-local-data.js

# 2. Restore to production
node scripts/restore-from-backup.js backups/backup-[timestamp].json
```

## Safety Features

- **Confirmation prompts**: All scripts ask for confirmation before making destructive changes
- **Data verification**: Scripts verify that data was migrated correctly
- **Backup support**: Can create backups before migration
- **Connection handling**: Proper database connection management
- **Error handling**: Comprehensive error handling and logging

## Database Tables Migrated

All scripts handle these tables in the correct dependency order:

1. **Users** (no dependencies)
2. **Golfers** (no dependencies)  
3. **Foursomes** (depends on golfers)
4. **Photos** (depends on users)
5. **Champions** (depends on users and golfers)
6. **Sessions** (depends on users)

## Prerequisites

- Node.js installed
- Access to both local PostgreSQL and production Neon databases
- Proper database URLs configured in the scripts
- All required npm packages installed (`@prisma/client`)

## Environment Configuration

The scripts use hardcoded database URLs for clarity:

- **Local**: `postgresql://jon.arme@localhost:5432/golf_trip_dev`
- **Production**: `postgres://neondb_owner:npg_v1LszDHl8qQf@ep-old-mud-a43i29q3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`

Make sure these URLs are correct for your setup.

## Troubleshooting

### Common Issues

1. **Connection errors**: Verify database URLs and network access
2. **Foreign key constraints**: Scripts handle dependencies automatically
3. **Prisma client errors**: Run `npx prisma generate` if needed
4. **Permission errors**: Ensure database user has proper permissions

### Getting Help

If you encounter issues:

1. Check the error messages for specific details
2. Verify database connectivity with `npx prisma db pull`
3. Ensure all migrations are applied with `npx prisma migrate deploy`
4. Check that the Prisma client is up to date

## File Structure

```
scripts/
├── README.md                    # This file
├── migrate-to-production.js     # Direct migration script
├── backup-local-data.js         # Backup creation script
├── restore-from-backup.js       # Restore from backup script
└── backups/                     # Created automatically for backups
    ├── backup-2024-01-01.json
    └── ...
```