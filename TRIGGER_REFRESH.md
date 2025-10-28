# Trigger Database Schema Refresh via Git Commit

## The Problem
You have conflicting RLS policies:
- ❌ "Collections can be created by authenticated users" (old, restrictive)
- ✅ "collections_allow_all" (new, permissive)

The old policy checks for authentication, which your anon key doesn't have.

## Solution 1: Clean Up Policies (Fastest)

Run this in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "Collections are viewable by everyone" ON collections;
DROP POLICY IF EXISTS "Collections can be created by authenticated users" ON collections;
DROP POLICY IF EXISTS "Collections can be updated by owner" ON collections;
```

Then manually refresh cache: Settings → API → Refresh Schema Cache

## Solution 2: Git Commit Trigger (Your Request)

This creates a dummy commit that forces Supabase/Vercel to refresh:

```bash
cd /Users/exe/Downloads/Cursor/RollNFTs-Frontend

# Stage the emergency fix
git add supabase/EMERGENCY_FIX_RLS.sql
git add supabase/schema-version.sql

# Create commit with special message that triggers refresh
git commit -m "chore: force schema cache refresh [refresh-schema]

- Remove conflicting RLS policies on collections table
- Keep only permissive collections_allow_all policy
- Update schema version to trigger cache invalidation

This commit forces Supabase to refresh its schema cache
by updating table comments and version tracking."

# Push to trigger Vercel deployment
git push origin main
```

## Solution 3: Environment Variable Trigger (Alternative)

Add a dummy env var in Vercel that changes timestamp:

```bash
# In Vercel Dashboard → Settings → Environment Variables
# Add or update:
SCHEMA_VERSION=2
LAST_SCHEMA_UPDATE=2025-10-28T[current-time]
```

This forces Vercel to rebuild, which refreshes Supabase connection.

## Why Git Commit Works

When you push to Git:
1. Vercel detects changes
2. Triggers new deployment
3. New deployment = new Supabase client instance
4. New client = fresh schema fetch (no cache)
5. Problem solved! ✅

## Quick Test After Commit

```bash
# After pushing, wait 2 minutes for Vercel deployment
# Then test:
curl https://rollnfts.vercel.app/api/health

# Try creating collection
# Should see: "✅ Collection saved to database"
```

## The Commit Already Prepared Above

Just run those git commands and it will:
- ✅ Add the RLS fix SQL
- ✅ Add schema version tracker
- ✅ Commit with cache-busting message
- ✅ Push to trigger deployment
- ✅ Force fresh schema load

**Time: 2 minutes** (commit + push + wait for deploy)

**Result: Schema cache refreshed without manual button click!**

