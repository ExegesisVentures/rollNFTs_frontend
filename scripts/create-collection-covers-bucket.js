// Script: Create Collection Covers Bucket in Supabase
// File: scripts/create-collection-covers-bucket.js
// Run: node scripts/create-collection-covers-bucket.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Set: VITE_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       CREATE COLLECTION-COVERS BUCKET SCRIPT          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('🪣  Creating collection-covers bucket...\n');
  
  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('collection-covers', {
      public: true,
      fileSizeLimit: 1024 * 1024, // 1MB max
      allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg']
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists!');
      } else {
        console.error('❌ Error creating bucket:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Bucket created successfully!');
      console.log('   Data:', data);
    }
    
    // List all buckets to verify
    console.log('\n📋 Listing all storage buckets...\n');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      console.log('✅ Storage buckets:');
      buckets.forEach(bucket => {
        const isTarget = ['collection-covers', 'nft-thumbnails', 'nft-images'].includes(bucket.name);
        const marker = isTarget ? '  ✅' : '  📦';
        console.log(`${marker} ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
    console.log('\n✅ Done! You can now run the pre-cache script.\n');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();

