// Script: Pre-cache Collection Cover Images
// File: scripts/precache-collection-covers.js
// Run: node scripts/precache-collection-covers.js

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Set: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Convert IPFS to HTTP
function ipfsToHttp(uri) {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `https://cloudflare-ipfs.com/ipfs/${hash}`;
  }
  if (uri.startsWith('http')) return uri;
  return null;
}

// Fetch metadata from URI
async function fetchMetadata(uri) {
  if (!uri) return {};
  
  try {
    const httpUrl = ipfsToHttp(uri);
    if (!httpUrl) return {};
    
    console.log(`  📥 Fetching metadata from: ${httpUrl.substring(0, 60)}...`);
    const response = await fetch(httpUrl, { timeout: 10000 });
    
    if (!response.ok) {
      console.warn(`  ⚠️  Failed to fetch metadata: ${response.status}`);
      return {};
    }
    
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.warn(`  ⚠️  Error fetching metadata: ${error.message}`);
    return {};
  }
}

// Optimize and cache collection cover image
async function cacheCollectionCover(collection) {
  const collectionId = collection.collection_id;
  const cacheKey = `${collectionId}.webp`;
  
  console.log(`\n📦 Processing: ${collection.name} (${collectionId})`);
  
  // Check if already cached
  const { data: existingFiles } = await supabase.storage
    .from('collection-covers')
    .list('', { search: cacheKey });
  
  if (existingFiles && existingFiles.length > 0) {
    console.log('  ✅ Already cached, skipping...');
    return { success: true, cached: true };
  }
  
  // Get cover image URL
  let coverImageUrl = collection.cover_image;
  
  // If no cover image, try to fetch from metadata
  if (!coverImageUrl && collection.metadata_uri) {
    console.log('  🔍 No cover image, fetching from metadata...');
    const metadata = await fetchMetadata(collection.metadata_uri);
    coverImageUrl = metadata.image;
  }
  
  if (!coverImageUrl) {
    console.log('  ⚠️  No cover image found, skipping...');
    return { success: false, reason: 'no_image' };
  }
  
  // Convert to HTTP URL
  const httpUrl = ipfsToHttp(coverImageUrl);
  if (!httpUrl) {
    console.log('  ⚠️  Invalid image URL, skipping...');
    return { success: false, reason: 'invalid_url' };
  }
  
  try {
    // Fetch image
    console.log(`  📥 Fetching image from: ${httpUrl.substring(0, 60)}...`);
    const imageResponse = await fetch(httpUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'RollNFTs-CacheTool/1.0' }
    });
    
    if (!imageResponse.ok) {
      console.log(`  ⚠️  Failed to fetch image: ${imageResponse.status}`);
      return { success: false, reason: 'fetch_failed' };
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`  📦 Downloaded: ${imageBuffer.byteLength} bytes`);
    
    // Optimize to 128x128 WebP
    const optimizedBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(128, 128, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 75 })
      .toBuffer();
    
    const savings = Math.round((1 - optimizedBuffer.length / imageBuffer.byteLength) * 100);
    console.log(`  ✅ Optimized: ${imageBuffer.byteLength} → ${optimizedBuffer.length} bytes (${savings}% savings)`);
    
    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('collection-covers')
      .upload(cacheKey, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year
        upsert: true
      });
    
    if (uploadError) {
      console.error('  ❌ Upload error:', uploadError);
      return { success: false, reason: 'upload_failed' };
    }
    
    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('collection-covers')
      .getPublicUrl(cacheKey);
    
    console.log(`  ✅ Cached: ${publicUrl.publicUrl}`);
    
    return {
      success: true,
      cached: false,
      url: publicUrl.publicUrl,
      originalSize: imageBuffer.byteLength,
      optimizedSize: optimizedBuffer.length,
      savings
    };
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// Main function
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🖼️  COLLECTION COVER IMAGE PRE-CACHING SCRIPT  🖼️   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Fetch collections from Supabase
  console.log('📦 Fetching collections from Supabase...\n');
  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching collections:', error);
    process.exit(1);
  }
  
  console.log(`✅ Found ${collections.length} collections\n`);
  console.log('─'.repeat(60));
  
  let cached = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const collection of collections) {
    const result = await cacheCollectionCover(collection);
    
    if (result.success && !result.cached) {
      cached++;
    } else if (result.success && result.cached) {
      skipped++;
    } else {
      failed++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`   ✅ Newly cached: ${cached}`);
  console.log(`   ⏭️  Already cached: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total processed: ${collections.length}`);
  console.log('\n✅ Done!\n');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

