# Database Schema Fix Guide

## 🔍 Issues Identified

Your application is experiencing the following database schema issues:

### 1. **Missing `collection_id` column** ❌
```
Error: "Could not find the 'collection_id' column of 'collections' in the schema cache"
Location: CreateCollection.jsx line 180
```
The code tries to insert `collection_id` but the database doesn't have this column.

### 2. **Missing `banner_image` column** ❌  
```
Error: "column collections_1.banner_image does not exist"
Location: freeSpinService.js line 30
```
Free spin campaigns query tries to fetch `banner_image` from collections table.

### 3. **Verified Badges 406 Errors** ❌
```
Error: GET .../verified_badges?select=*&entity_type=eq.collection&entity_id=eq.xxx 406 (Not Acceptable)
```
RLS (Row Level Security) policies are preventing reads from the verified_badges table.

### 4. **API 500 and 404 Errors**
```
GET /api/collections/awesome-core1eg7... 500 (Internal Server Error)
GET /api/nfts/collection/awesome-core1eg7... 404 (Not Found)
```
Backend API cannot find collections because schema doesn't match expected structure.

---

## ✅ Solution

I've created a comprehensive SQL script to fix all these issues: **`supabase/FIX_SCHEMA_ISSUES.sql`**

This script will:
1. ✅ Add missing `collection_id` column (stores blockchain class_id)
2. ✅ Add missing `banner_image` column  
3. ✅ Fix verified_badges table structure and RLS policies
4. ✅ Add all missing collection columns (website, twitter, discord, etc.)
5. ✅ Create proper indexes for performance
6. ✅ Set up triggers for `updated_at` timestamps
7. ✅ Migrate existing data if you have `class_id` column

---

## 🚀 How to Apply the Fix

### **Step 1: Run the SQL Script in Supabase**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `wemaymehbtnxkwxslhsu`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Script**
   - Open the file: `supabase/FIX_SCHEMA_ISSUES.sql`
   - Copy the **entire contents**
   - Paste into the SQL Editor
   - Click **"Run"** (or press Ctrl/Cmd + Enter)

4. **Verify Success**
   - You should see success messages in the Results panel
   - Check for "✅ Schema fixes applied successfully!"

### **Step 2: Refresh Schema Cache**

⚠️ **IMPORTANT**: Supabase caches the database schema. You must refresh it!

1. In Supabase Dashboard, go to:
   - **Settings** → **API** → **Refresh Schema Cache**
   - Or go directly to: `https://supabase.com/dashboard/project/wemaymehbtnxkwxslhsu/settings/api`

2. Click **"Refresh now"** button

3. Wait 10-15 seconds for the cache to update

### **Step 3: Verify the Fix**

1. **Check the collections table structure:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'collections'
   ORDER BY ordinal_position;
   ```

2. **Verify collection_id column exists:**
   ```sql
   SELECT collection_id, name, symbol, banner_image, creator_address
   FROM collections
   LIMIT 5;
   ```

3. **Test verified_badges query:**
   ```sql
   SELECT * FROM verified_badges 
   WHERE entity_type = 'collection' 
   LIMIT 5;
   ```

### **Step 4: Test Your Application**

1. **Clear browser cache** (important!)
   - Chrome/Edge: Ctrl+Shift+Delete or Cmd+Shift+Delete
   - Or open in incognito/private mode

2. **Go to Create Collection page**
   - https://rollnfts.vercel.app/create-collection

3. **Try creating a collection:**
   - Fill in the form
   - Upload an image
   - Submit the form
   - Should now work without database errors! ✅

4. **Check for errors:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Should see "✅ Collection saved to database" instead of errors

---

## 📋 Expected Database Schema

After running the fix, your `collections` table should have these columns:

### **Core Columns**
- `id` - UUID (Primary Key)
- `collection_id` - TEXT (Blockchain class_id, UNIQUE) ⭐ **NEW**
- `name` - TEXT
- `symbol` - TEXT
- `description` - TEXT
- `cover_image` - TEXT
- `banner_image` - TEXT ⭐ **NEW**
- `metadata_uri` - TEXT
- `creator_address` - TEXT
- `tx_hash` - TEXT

### **Feature Columns**
- `features_burning` - BOOLEAN
- `features_freezing` - BOOLEAN
- `features_whitelisting` - BOOLEAN
- `features_disable_sending` - BOOLEAN

### **Marketplace Columns**
- `verified` - BOOLEAN
- `verified_at` - TIMESTAMPTZ
- `verified_by` - TEXT
- `featured` - BOOLEAN
- `featured_until` - TIMESTAMPTZ
- `royalty_bps` - INTEGER
- `royalty_recipient` - TEXT
- `royalty_rate` - TEXT
- `total_volume` - NUMERIC
- `floor_price` - NUMERIC

### **Social Links**
- `website` - TEXT ⭐ **NEW**
- `twitter` - TEXT ⭐ **NEW**
- `discord` - TEXT ⭐ **NEW**

### **Timestamps**
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

---

## 🐛 Troubleshooting

### Issue: "Schema cache not refreshed"
**Solution:** 
1. Go to Supabase Dashboard → Settings → API
2. Click "Refresh Schema Cache" button
3. Wait 15 seconds and try again

### Issue: Still getting 406 errors on verified_badges
**Solution:**
1. Check RLS policies in Supabase Dashboard
2. Go to Database → verified_badges table → Policies
3. Ensure "verified_badges_public_read" policy exists and allows SELECT

### Issue: "column class_id does not exist"
**Solution:**
The script automatically handles this. If you see this error:
1. Your database might have been using `class_id` before
2. The script migrates `class_id` → `collection_id`
3. Re-run the script - it's safe to run multiple times

### Issue: Collection creation works but images don't show
**Solution:**
1. Check IPFS gateway is working: https://gateway.pinata.cloud/ipfs/
2. Check cover_image and banner_image columns have data
3. Clear browser cache and reload

---

## 📝 Files Modified/Created

### **New Files Created:**
1. ✅ `supabase/FIX_SCHEMA_ISSUES.sql` - Complete schema fix script
2. ✅ `DATABASE_SCHEMA_FIX_GUIDE.md` - This guide (you're reading it!)

### **Files Referenced (No Changes Needed):**
- `src/pages/CreateCollection.jsx` - Uses `collection_id` column (line 180)
- `src/services/freeSpinService.js` - Queries `banner_image` (line 30)
- `src/services/verifiedBadgeService.js` - Queries verified_badges table

---

## 🎯 Quick Summary

**Problem:** Database schema doesn't match application code expectations

**Solution:**
1. Run `supabase/FIX_SCHEMA_ISSUES.sql` in Supabase SQL Editor
2. Refresh Schema Cache in Supabase Dashboard (Settings → API)
3. Clear browser cache
4. Test collection creation at https://rollnfts.vercel.app/create-collection

**Time Required:** ~5 minutes

**Risk Level:** ✅ Low (script is idempotent - safe to run multiple times)

---

## ✅ Post-Fix Checklist

After applying the fix, verify these work:

- [ ] Create Collection page loads without errors
- [ ] Can create a new collection successfully  
- [ ] Collection appears in database with `collection_id`
- [ ] No "Could not find column" errors in console
- [ ] Free spin campaigns load without 400 errors
- [ ] Verified badges queries return 200 (not 406)
- [ ] Collection details page works
- [ ] Images display correctly

---

## 💡 Why These Errors Occurred

The application code was developed to use `collection_id` (the blockchain class_id) as a unique identifier, but the database schema was using just `id` (UUID). Additionally:

1. **Frontend code** (CreateCollection.jsx) expects to insert `collection_id`
2. **Free spin service** expects collections to have `banner_image`
3. **Verified badges** had overly restrictive RLS policies
4. **API routes** couldn't find collections by blockchain ID

The fix aligns the database schema with the application code's expectations.

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the Supabase logs: Dashboard → Logs
2. Verify the SQL script ran completely (scroll to bottom of Results)
3. Ensure schema cache was refreshed (wait 15 seconds after refreshing)
4. Try in incognito mode to rule out browser cache issues

---

**Created:** October 27, 2025  
**Location:** `/Users/exe/Downloads/Cursor/RollNFTs-Frontend/DATABASE_SCHEMA_FIX_GUIDE.md`  
**Related SQL Script:** `supabase/FIX_SCHEMA_ISSUES.sql`


