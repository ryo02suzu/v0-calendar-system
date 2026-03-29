# Troubleshooting Database Initialization Errors

This guide helps resolve common database initialization errors in the Clinic Calendar System.

## Symptom: "TypeError: fetch failed" or "データベースエラー"

### Error Message Examples:
- "データベースエラー: TypeError: fetch failed"
- "Failed to initialize clinic: Error: データベースエラー: TypeError: fetch failed"
- "An error occurred in the Server Components render..."

### Root Cause

This error typically occurs due to **truncated or invalid SUPABASE_SERVICE_ROLE_KEY** in your `.env.local` file.

### How to Diagnose

1. Open your `.env.local` file
2. Find the `SUPABASE_SERVICE_ROLE_KEY` line
3. Check if the key is complete:

**Example of a TRUNCATED key (WRONG):**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc3hveXZidWNsYnRyb3dqZmxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAxNzgxMywiZXhwIjoyMDc4NTkzODEzfQ.6DsBEE5u
```

**Example of a COMPLETE key (CORRECT):**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc3hveXZidWNsYnRyb3dqZmxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAxNzgxMywiZXhwIjoyMDc4NTkzODEzfQ.6DsBEE5uVz4kL8pQ2h9MtXfR7wN3jC6yA1bK5sE8oG4
```

**Key Indicators:**
- JWT keys have 3 parts separated by dots: `header.payload.signature`
- The signature (last part) should be approximately **43 characters** long
- If your signature is only 8-10 characters (like `6DsBEE5u`), it's **truncated**
- Complete keys are typically 200+ characters total

### Solution

#### Step 1: Get the Complete Service Role Key

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings > API**
4. Find the **service_role** key (NOT the anon/public key!)
5. Click the "Copy" button or "Reveal" to see the full key
6. **IMPORTANT**: Make sure you copy the **ENTIRE key** - don't copy partially!

#### Step 2: Update .env.local

1. Open `.env.local` in your project root
2. Replace the entire `SUPABASE_SERVICE_ROLE_KEY` line with the complete key
3. Ensure there are no line breaks, spaces, or truncation
4. Save the file

**Example .env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://pfsxoyvbuclbtrowjfln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc3hveXZidWNsYnRyb3dqZmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMTc4MTMsImV4cCI6MjA3ODU5MzgxM30.KxTEIr01aiIm7xEdVcer3kkewFbqqMiX63HqvO7kjXg
SUPABASE_SERVICE_ROLE_KEY=<PASTE_COMPLETE_KEY_HERE>
```

#### Step 3: Verify the Fix

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. If the error message changes to something more specific (like "relation 'clinics' does not exist"), that means the key is now working! Proceed to Step 4.

4. If you still see "TypeError: fetch failed", verify:
   - The key is copied completely without any truncation
   - There are no extra spaces or newlines in the .env.local file
   - You're using the `service_role` key, not the `anon` key

#### Step 4: Initialize Database Tables

Once the Supabase connection is working, you need to create the database tables:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run these scripts in order:
   - `scripts/001_create_tables.sql`
   - `scripts/002_add_resecon_settings.sql`
   - `scripts/003_add_reminder_settings.sql`
   - `scripts/005_add_treatment_type_field.sql`

See `scripts/README.md` for detailed instructions.

## Common Mistakes

### ❌ Using the wrong key
- **WRONG**: Using `NEXT_PUBLIC_SUPABASE_ANON_KEY` value for `SUPABASE_SERVICE_ROLE_KEY`
- **RIGHT**: Use the `service_role` key from Supabase Settings > API

### ❌ Partial copy
- **WRONG**: Copying the key but missing the last part due to text selection issues
- **RIGHT**: Use the "Copy" button in Supabase dashboard, or triple-click to select the entire key

### ❌ Line breaks in .env
- **WRONG**: Breaking the key across multiple lines
  ```
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
    eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc3hveXZidWNsYnRyb3dqZmxuIi...
  ```
- **RIGHT**: Keep the entire key on one line
  ```
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
  ```

### ❌ Trailing spaces
- **WRONG**: `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...XYZ   ` (spaces at end)
- **RIGHT**: `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...XYZ` (no trailing spaces)

## Other Database Errors

### "relation 'clinics' does not exist"

**Solution**: Run the SQL migration scripts. See `scripts/README.md`.

### "PGRST116" or "No rows found"

This is usually not an error - it just means no data exists yet. The application will create initial data automatically.

### "Invalid API key"

**Solutions**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (should match your Supabase project URL)
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is the service_role key, not anon key
3. Check if your Supabase project is active and accessible

## Still Having Issues?

1. **Check Supabase Status**: Visit https://status.supabase.com to ensure Supabase services are operational

2. **View Detailed Logs**: Check your terminal where `npm run dev` is running for detailed error messages

3. **Verify Network**: Ensure you can access your Supabase project URL in a browser:
   ```
   https://your-project-ref.supabase.co
   ```

4. **Check Environment Variables**:
   ```bash
   # Print env vars (be careful not to commit this!)
   cat .env.local
   ```

5. **Clear Next.js Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

## Security Reminder

⚠️ **NEVER commit `.env.local` to version control!**

The `.gitignore` file should already exclude it, but verify:
```bash
cat .gitignore | grep .env.local
```

If it's not there, add it:
```bash
echo ".env.local" >> .gitignore
```
