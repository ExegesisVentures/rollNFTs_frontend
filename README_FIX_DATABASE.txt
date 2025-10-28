╔════════════════════════════════════════════════════════════════════════════╗
║                  🚨 DATABASE SCHEMA FIX REQUIRED 🚨                        ║
╚════════════════════════════════════════════════════════════════════════════╝

YOUR APP IS BROKEN! Fix in 3 minutes:

┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Open Supabase SQL Editor                                          │
│ URL: https://supabase.com/dashboard/project/wemaymehbtnxkwxslhsu/editor   │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Run This File                                                     │
│ File: supabase/FIX_SCHEMA_ISSUES.sql                                      │
│ Action: Copy entire file → Paste into SQL Editor → Click "Run"            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Refresh Schema Cache                                              │
│ URL: https://supabase.com/dashboard/project/wemaymehbtnxkwxslhsu/settings/api │
│ Action: Click "Refresh Schema Cache" button → Wait 15 seconds             │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Test Your App                                                     │
│ URL: https://rollnfts.vercel.app/create-collection                        │
│ Action: Clear browser cache (Ctrl+Shift+Delete) → Try creating collection │
└────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════

WHAT'S WRONG?
━━━━━━━━━━━━━
✗ Database missing "collection_id" column
✗ Database missing "banner_image" column  
✗ Verified badges table has wrong structure
✗ RLS policies blocking all queries (406 errors)

Result: Cannot create collections, free spin campaigns fail, badges broken

═══════════════════════════════════════════════════════════════════════════

WHAT THE FIX DOES:
━━━━━━━━━━━━━━━━━━
✓ Adds collection_id column (stores blockchain class_id)
✓ Adds banner_image column (used by free spin campaigns)
✓ Fixes verified_badges table structure (badge_level not badge_type)
✓ Fixes RLS policies (stops 406 errors)
✓ Adds all missing columns (website, twitter, discord, etc.)
✓ Creates indexes for performance
✓ Safe to run multiple times (idempotent)

═══════════════════════════════════════════════════════════════════════════

ERRORS FIXED:
━━━━━━━━━━━━━
Before: POST /rest/v1/collections 400 (Bad Request)
        Error: "Could not find the 'collection_id' column"
After:  ✓ Collections save successfully

Before: GET /rest/v1/free_spin_campaigns 400 (Bad Request)  
        Error: "column collections_1.banner_image does not exist"
After:  ✓ Free spin campaigns load

Before: GET /rest/v1/verified_badges 406 (Not Acceptable)
After:  ✓ Verified badges query works

═══════════════════════════════════════════════════════════════════════════

MORE INFO:
━━━━━━━━━━
📄 Quick Start:  SCHEMA_FIX_QUICK_START.md
📄 Full Guide:   DATABASE_SCHEMA_FIX_GUIDE.md
📄 SQL Script:   supabase/FIX_SCHEMA_ISSUES.sql

═══════════════════════════════════════════════════════════════════════════

⏱️  TIME: 3 minutes
🎯  DIFFICULTY: Easy (just copy/paste SQL)
⚠️  RISK: Low (safe, no data loss)
🔄  STATUS: CRITICAL - App broken until fixed

═══════════════════════════════════════════════════════════════════════════

