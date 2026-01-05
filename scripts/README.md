# Database Migration Scripts

This directory contains SQL migration scripts for initializing and updating the Supabase database schema.

## Quick Start

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/_/sql
2. Open the SQL Editor
3. Run the migration scripts in order:
   - `001_create_tables.sql` - Creates all initial tables, indexes, and seed data
   - `002_add_resecon_settings.sql` - Adds レセコン (receipt computer) integration settings
   - `003_add_reminder_settings.sql` - Adds reminder/notification settings
   - `005_add_treatment_type_field.sql` - Adds treatment type field (REQUIRED for schema consistency)
   - (Optional) `004_reset_and_seed_data.sql` - Resets and seeds demo data

4. Click "Run" for each script

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Run migrations
npx supabase db push
```

## Migration Scripts

### 001_create_tables.sql (REQUIRED)

Creates the core database schema including:
- `clinics` - Clinic information
- `staff` - Staff members
- `patients` - Patient records
- `services` - Service/treatment menu
- `appointments` - Appointment bookings
- `medical_records` - Medical records/charts
- `business_hours` - Clinic operating hours
- `holidays` - Clinic holidays
- `clinic_settings` - Clinic settings (chairs count, booking limits, etc.)

Also creates:
- All necessary indexes for performance
- Default clinic data (ID: `00000000-0000-0000-0000-000000000001`)
- Sample staff members
- Sample services
- Default business hours (Mon-Fri: 9:00-18:00, Sat: 9:00-13:00, Sun: Closed)
- Default clinic settings

### 002_add_resecon_settings.sql (REQUIRED)

Adds `resecon_settings` table for integration with receipt computer systems (レセコン連携).

### 003_add_reminder_settings.sql (REQUIRED)

Adds:
- `reminder_settings` - Configuration for appointment reminders
- `reminder_logs` - Log of sent reminders
- Default reminder settings for the clinic

### 004_reset_and_seed_data.sql (OPTIONAL)

**WARNING**: This script will DELETE all existing data!

Use this only if you want to:
- Reset the database to a clean state
- Seed demo data for testing

### 005_add_treatment_type_field.sql (REQUIRED)

Adds `treatment_type` field to appointments table. This is required for proper schema consistency with the application code.

## Troubleshooting

### Error: "relation 'clinics' does not exist"

**Solution**: Run `001_create_tables.sql` first. This creates all the base tables.

### Error: "Invalid API key" or "JWT" errors

**Solution**: Check your environment variables:
1. Open your `.env.local` file
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (e.g., `https://xxxxx.supabase.co`)
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is the **complete** service_role key from Supabase Settings > API
   - The key should be a JWT with 3 parts separated by dots (header.payload.signature)
   - The signature should be approximately 43 characters long
   - If your key ends with something like "...6DsBEE5u", it's truncated - get the complete key from Supabase

### Error: "TypeError: fetch failed"

This usually indicates one of the following:
1. **Truncated or invalid service role key** - Most common cause. Verify the key is complete (see above).
2. **Network connectivity issues** - Check if you can access your Supabase project URL
3. **Wrong Supabase URL** - Verify the URL matches your project

### How to get your Supabase credentials:

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (NOT anon key!) → `SUPABASE_SERVICE_ROLE_KEY`
   - Make sure to copy the **entire key** - JWT keys are long (usually 200+ characters)

## Manual SQL Execution (Alternative)

If you prefer to run SQL manually:

```sql
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Then run each script's contents in order
-- (See individual .sql files for full content)
```

## Verification

After running migrations, verify the setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if default clinic exists
SELECT * FROM clinics 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check table counts
SELECT 
  (SELECT COUNT(*) FROM clinics) as clinics,
  (SELECT COUNT(*) FROM staff) as staff,
  (SELECT COUNT(*) FROM services) as services,
  (SELECT COUNT(*) FROM business_hours) as business_hours,
  (SELECT COUNT(*) FROM clinic_settings) as clinic_settings;
```

Expected results:
- 1 clinic
- 3 staff members
- 6 services
- 7 business_hours entries (one per day of week)
- 1 clinic_settings entry

## Need Help?

If you continue to experience issues:

1. Verify your environment variables are correct and complete
2. Check the Supabase project logs for detailed error messages
3. Ensure you're using the service_role key, not the anon key
4. Make sure there are no trailing spaces or newlines in your environment variables
5. Try accessing your Supabase project through the dashboard to verify it's accessible
