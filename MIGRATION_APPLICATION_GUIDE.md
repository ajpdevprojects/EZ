# Supabase Migration Application Guide

## 🚨 URGENT — 2026-07-19: apply `20260201080000_restore_api_role_grants.sql`

Live verification confirmed sign-in bounces back to the login screen with
`permission denied for table profiles` (Postgres 42501). The live database's
tables have RLS policies but **no table-level grants for the Supabase API
roles** (`anon`, `authenticated`, `service_role`) — so every app query
against every table is denied before RLS is even evaluated. This affects all
sixteen app tables, not just `profiles` (onboarding completion needs UPDATE;
the app layout reads `notifications` right after login).

Do **not** apply only the `GRANT SELECT, INSERT ON public.profiles TO
authenticated;` from the error hint — that fixes one table's two verbs and
leaves the rest of the app broken. Apply the migration instead: it restores
the standard Supabase grants for all objects in `public`, sets default
privileges so future tables inherit them, and refuses to run if any table
somehow has RLS disabled (so it can never expose data). Row-level security
policies are unchanged; per-row access is still enforced exactly as before.

Paste the contents of `supabase/migrations/20260201080000_restore_api_role_grants.sql`
into the Supabase Dashboard SQL Editor and run it (safe to re-run). Then sign
in again — the login bounce should be resolved immediately; no data repair
is needed.

---

**Status:** migrations prepared but NOT YET APPLIED to live database

## ❌ What Has NOT Been Done
The migrations are ready but have NOT been applied to your live Supabase project due to network restrictions in this cloud environment. Direct database connections and REST API calls are timing out.

## ✅ What You Need To Do Now

### Option 1: Apply via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project: `mivnpcdulohujxyjmbzg`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Migrations**
   - Open each migration file in this order:
     1. `supabase/migrations/20260101000000_init_schema.sql`
     2. `supabase/migrations/20260201000000_platform_completion.sql`
     3. `supabase/migrations/20260201010000_documents_storage.sql`
     4. `supabase/migrations/20260201020000_job_discovery_and_inbox.sql`
     5. `supabase/migrations/20260201030000_behavioral_learning.sql`
     6. `supabase/migrations/20260201040000_proactive_notifications.sql`
     7. `supabase/migrations/20260201050000_overnight_activity.sql`
   - Copy the entire SQL content of each file
   - Paste into the SQL Editor
   - Click "Run" for each migration

4. **Verify Success**
   - After each migration, you should see "1 result" or similar confirmation
   - Check for any errors

### Option 2: Apply via Local Supabase CLI

If you have the Supabase CLI installed locally:

```bash
# From the project root directory
cd /path/to/EZ

# Login to Supabase (if not already logged in)
supabase login

# Link your project (if not already linked)
supabase link --project-ref mivnpcdulohujxyjmbzg

# Push migrations to production
supabase db push --linked
```

### Option 3: Apply via Vercel Environment (if deployed to Vercel)

If your app is deployed to Vercel with the database connected:

```bash
# Set your Supabase database URL as an environment variable
# Then use a migration runner (e.g., node-pg-migrate, Flyway, etc.)
```

## 📋 Migration Execution Order (CRITICAL)

The migrations MUST be applied in this exact order:

1. **20260101000000_init_schema.sql** - Core tables and RLS policies
   - Creates: profiles, jobs, applications, journey_milestones, interviews, ai_conversations, ai_messages
   - Includes: pgcrypto extension, triggers, indexes

2. **20260201000000_platform_completion.sql** - Additional platform features
   - Creates: documents, cover_letters, notifications, learning_resources, interview_recordings, feedback

3. **20260201010000_documents_storage.sql** - Storage setup
   - Configures: Supabase Storage buckets

4. **20260201020000_job_discovery_and_inbox.sql** - Job discovery system
   - Creates: job discovery tables, inbox management

5. **20260201030000_behavioral_learning.sql** - Learning system
   - Creates: behavioral tracking tables

6. **20260201040000_proactive_notifications.sql** - Notification system
   - Creates: notification configuration tables

7. **20260201050000_overnight_activity.sql** - Background job tracking
   - Creates: cron job and background job tables

8. **20260201060000_profiles_insert_policy.sql** - RLS insert policy for profiles
   - Allows the signed-in user to create their own profile row (self-heal path)

9. **20260201070000_restore_handle_new_user_trigger.sql** - Profile-creation trigger + backfill
   - Restores `handle_new_user()` / `on_auth_user_created` and backfills profiles for existing users

10. **20260201080000_restore_api_role_grants.sql** - API-role table grants (see 🚨 above)
    - Restores the standard Supabase grants for `anon`/`authenticated`/`service_role` and default privileges

## ✅ How to Verify Migrations Were Applied Successfully

### Check 1: Count Expected Tables

Run this query in Supabase SQL Editor:

```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name NOT LIKE 'pg_%';
```

**Expected result:** 25+ tables (the exact number depends on all migrations)

### Check 2: Verify Key Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles',
  'jobs',
  'applications',
  'journey_milestones',
  'interviews',
  'ai_conversations',
  'documents',
  'cover_letters',
  'notifications'
)
ORDER BY table_name;
```

**Expected result:** 9 tables listed

### Check 3: Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected result:** Multiple policies for profiles, applications, interviews, journey_milestones, jobs

### Check 4: Verify Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'set_updated_at',
  'handle_new_user'
)
ORDER BY routine_name;
```

**Expected result:** 2 functions

### Check 5: Application Connection Test

Once migrations are applied, test from your application:

```bash
# From project root
npm run dev
# or
pnpm dev

# Visit http://localhost:3000
# Check browser console for any database errors
```

## 🆘 Troubleshooting

### Error: "Table already exists"
- Some tables may already exist from a previous partial migration attempt
- This is usually safe to ignore - the migration will skip creation and apply only new changes

### Error: "Permission denied"
- Ensure you're using an admin/owner account in Supabase
- Check that the service role key has proper permissions

### Error: "Extension not found"
- Some extensions (like pgcrypto) might be restricted
- Try running migrations one at a time to identify which one fails

### Timeout during migration
- Large migrations might take time; wait up to 5 minutes
- Try applying migrations individually instead of all at once

## 📊 After Migrations Are Applied

1. **Update PRODUCTION_HARDENING_REPORT.md**
   - Change status from "Ready for deployment" to "Applied and verified"

2. **Run the application**
   - Test all features end-to-end
   - Check for any database connection errors

3. **Verify Cron Jobs**
   - Set CRON_SECRET environment variable
   - Test cron endpoints manually

4. **Monitor Database**
   - Check Supabase dashboard for slow queries
   - Verify no unexpected locks

## 📞 Need Help?

If migrations fail, share:
1. The exact error message
2. Which migration number failed (1-7)
3. Your Supabase project status in the dashboard

---

**Important:** Do NOT deploy to production until all migrations are applied and verified.
