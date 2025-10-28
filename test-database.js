// Test Database Connection and Schema
// Run with: npm run test:db

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

// Get from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env.local or .env file');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('📍 Supabase URL:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 Testing Database Connection and Schema...\n');

async function testDatabase() {
  try {
    // Test 1: Check connection
    console.log('📡 Test 1: Database Connection');
    const { data: testData, error: testError } = await supabase
      .from('collections')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connected successfully\n');

    // Test 2: Check collections table structure
    console.log('📋 Test 2: Collections Table Structure');
    const { data: collections, error: colError } = await supabase
      .from('collections')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.error('❌ Table query failed:', colError.message);
    } else {
      const columns = collections.length > 0 ? Object.keys(collections[0]) : [];
      console.log('✅ Collections table accessible');
      console.log('📊 Columns found:', columns.join(', ') || 'No data yet');
      
      // Check for required columns
      const requiredColumns = ['collection_id', 'banner_image', 'name', 'symbol', 'creator_address'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0 && columns.length > 0) {
        console.log('⚠️  Missing columns:', missingColumns.join(', '));
        console.log('❌ Schema fix needed! Run supabase/FIX_SCHEMA_ISSUES.sql');
      } else if (columns.length > 0) {
        console.log('✅ All required columns present');
      } else {
        console.log('ℹ️  No collections yet - cannot verify schema');
      }
    }
    console.log('');

    // Test 3: Check verified_badges table
    console.log('🎖️  Test 3: Verified Badges Table');
    const { data: badges, error: badgeError } = await supabase
      .from('verified_badges')
      .select('*')
      .limit(1);
    
    if (badgeError) {
      console.error('❌ Verified badges query failed:', badgeError.message);
      if (badgeError.code === '42P01') {
        console.log('⚠️  Table does not exist - run schema fix');
      }
    } else {
      console.log('✅ Verified badges table accessible');
      if (badges.length > 0) {
        console.log('📊 Badge columns:', Object.keys(badges[0]).join(', '));
      }
    }
    console.log('');

    // Test 4: Check free_spin_campaigns
    console.log('🎡 Test 4: Free Spin Campaigns Table');
    const { data: campaigns, error: campaignError } = await supabase
      .from('free_spin_campaigns')
      .select('*')
      .limit(1);
    
    if (campaignError) {
      console.error('❌ Free spin campaigns query failed:', campaignError.message);
    } else {
      console.log('✅ Free spin campaigns table accessible');
    }
    console.log('');

    // Test 5: Try to query collections with join
    console.log('🔗 Test 5: Collections Join Query (as used in app)');
    const { data: joinTest, error: joinError } = await supabase
      .from('free_spin_campaigns')
      .select(`
        *,
        collections:collection_id (
          id,
          name,
          symbol,
          banner_image,
          creator_address
        )
      `)
      .eq('active', true)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Join query failed:', joinError.message);
      if (joinError.message.includes('banner_image')) {
        console.log('⚠️  Missing banner_image column - run schema fix');
      }
    } else {
      console.log('✅ Join query works correctly');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    
    if (!colError && !badgeError && !campaignError && !joinError) {
      console.log('✅ All tests passed!');
      console.log('✅ Database schema is correct');
      console.log('✅ Ready to create collections');
    } else {
      console.log('⚠️  Some tests failed');
      console.log('');
      console.log('🔧 ACTION REQUIRED:');
      console.log('1. Run: supabase/FIX_SCHEMA_ISSUES.sql in Supabase SQL Editor');
      console.log('2. Go to: Settings → API → Refresh Schema Cache');
      console.log('3. Wait 15 seconds and run this test again');
    }
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run tests
testDatabase();

