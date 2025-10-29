// Script: Pre-cache Collection Cover Images from Coreum Blockchain
// File: scripts/precache-collection-covers.js
// Run: node scripts/precache-collection-covers.js

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

// IPFS Gateways (try multiple for reliability)
const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/',
];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Set: VITE_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Using ANON_KEY instead of SERVICE_ROLE_KEY. Upload permissions may be limited.\n');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Convert IPFS to HTTP with gateway rotation
function ipfsToHttp(uri, gatewayIndex = 0) {
  if (!uri) return null;
  
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `${gateway}${hash}`;
  }
  if (uri.startsWith('http')) return uri;
  
  // Try to extract IPFS hash
  const ipfsMatch = uri.match(/(Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]{55,})/);
  if (ipfsMatch) {
    return `${gateway}${ipfsMatch[0]}`;
  }
  
  return null;
}

// Fetch metadata from URI with retry on different gateways
async function fetchMetadata(uri, gatewayIndex = 0, maxRetries = 3) {
  if (!uri) return {};
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const httpUrl = ipfsToHttp(uri, gatewayIndex + i);
      if (!httpUrl) continue;
      
      console.log(`  📥 Fetching metadata: ${httpUrl.substring(0, 70)}...`);
      const response = await fetch(httpUrl, { 
        timeout: 15000,
        headers: { 'User-Agent': 'RollNFTs-CacheTool/1.0' }
      });
      
      if (!response.ok) {
        console.warn(`  ⚠️  HTTP ${response.status}, trying next gateway...`);
        continue;
      }
      
      const metadata = await response.json();
      console.log(`  ✅ Metadata fetched successfully`);
      return metadata;
    } catch (error) {
      console.warn(`  ⚠️  Error (gateway ${i+1}/${maxRetries}): ${error.message}`);
      if (i === maxRetries - 1) {
        return {};
      }
    }
  }
  
  return {};
}

// Fetch all NFT classes from Coreum blockchain
async function fetchAllNFTClasses() {
  console.log('🔗 Fetching NFT classes from Coreum blockchain...\n');
  
  let allClasses = [];
  let nextKey = null;
  let page = 1;
  
  do {
    try {
      let url = `${COREUM_REST}/coreum/asset/nft/v1/classes?pagination.limit=100`;
      if (nextKey) {
        url += `&pagination.key=${encodeURIComponent(nextKey)}`;
      }
      
      console.log(`  📄 Fetching page ${page}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`  ❌ Failed to fetch classes: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      allClasses = allClasses.concat(data.classes || []);
      nextKey = data.pagination?.next_key;
      page++;
      
      console.log(`  ✅ Fetched ${data.classes?.length || 0} classes (total: ${allClasses.length})`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`  ❌ Error fetching classes: ${error.message}`);
      break;
    }
  } while (nextKey);
  
  console.log(`\n✅ Total NFT classes found: ${allClasses.length}\n`);
  return allClasses;
}

// Optimize and cache collection cover image
async function cacheCollectionCover(classData, index, total) {
  const classId = classData.id;
  const cacheKey = `${classId}.webp`;
  
  console.log(`\n[${index + 1}/${total}] 📦 Processing: ${classData.name || classId}`);
  console.log(`  ID: ${classId}`);
  
  // Check if already cached
  const { data: existingFiles } = await supabase.storage
    .from('collection-covers')
    .list('', { search: cacheKey });
  
  if (existingFiles && existingFiles.length > 0) {
    console.log('  ✅ Already cached, skipping...');
    return { success: true, cached: true };
  }
  
  // Get image URL from class data or metadata
  let imageUrl = classData.data?.image || classData.uri_hash;
  
  // If no direct image, try to fetch from metadata URI
  if (!imageUrl || imageUrl.startsWith('ipfs://Q') === false) {
    const metadataUri = classData.uri || classData.data?.uri;
    if (metadataUri) {
      console.log('  🔍 Fetching metadata for image URL...');
      const metadata = await fetchMetadata(metadataUri);
      imageUrl = metadata.image || metadata.cover_image;
    }
  }
  
  if (!imageUrl) {
    console.log('  ⚠️  No image found, skipping...');
    return { success: false, reason: 'no_image' };
  }
  
  // Validate IPFS URL
  if (!imageUrl.includes('Qm') && !imageUrl.includes('bafy')) {
    console.log(`  ⚠️  Invalid image URL: ${imageUrl}, skipping...`);
    return { success: false, reason: 'invalid_url' };
  }
  
  console.log(`  🖼️  Image: ${imageUrl.substring(0, 60)}...`);
  
  // Try multiple IPFS gateways
  let imageBuffer = null;
  let successGateway = null;
  
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const httpUrl = ipfsToHttp(imageUrl, i);
      if (!httpUrl) continue;
      
      console.log(`  📥 Fetching from gateway ${i + 1}/${IPFS_GATEWAYS.length}...`);
      const imageResponse = await fetch(httpUrl, {
        timeout: 20000,
        headers: { 'User-Agent': 'RollNFTs-CacheTool/1.0' }
      });
      
      if (!imageResponse.ok) {
        console.warn(`  ⚠️  Gateway ${i + 1} failed: ${imageResponse.status}`);
        continue;
      }
      
      imageBuffer = await imageResponse.arrayBuffer();
      successGateway = IPFS_GATEWAYS[i];
      console.log(`  ✅ Downloaded: ${imageBuffer.byteLength} bytes from ${successGateway}`);
      break;
      
    } catch (error) {
      console.warn(`  ⚠️  Gateway ${i + 1} error: ${error.message}`);
      if (i === IPFS_GATEWAYS.length - 1) {
        console.log('  ❌ All gateways failed, skipping...');
        return { success: false, reason: 'fetch_failed' };
      }
    }
  }
  
  if (!imageBuffer) {
    return { success: false, reason: 'fetch_failed' };
  }
  
  try {
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
      console.error('  ❌ Upload error:', uploadError.message);
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
    console.error(`  ❌ Processing error: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// Main function
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🖼️  COLLECTION COVER IMAGE PRE-CACHING SCRIPT  🖼️   ║');
  console.log('║         Fetching from Coreum Blockchain + IPFS         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Fetch collections from Coreum blockchain
  const classes = await fetchAllNFTClasses();
  
  if (!classes || classes.length === 0) {
    console.log('❌ No NFT classes found on blockchain!');
    process.exit(1);
  }
  
  console.log('─'.repeat(60));
  
  let cached = 0;
  let skipped = 0;
  let failed = 0;
  const startTime = Date.now();
  
  // Process each class
  for (let i = 0; i < classes.length; i++) {
    const result = await cacheCollectionCover(classes[i], i, classes.length);
    
    if (result.success && !result.cached) {
      cached++;
    } else if (result.success && result.cached) {
      skipped++;
    } else {
      failed++;
    }
    
    // Delay between collections to avoid rate limits
    if (i < classes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`   ✅ Newly cached: ${cached}`);
  console.log(`   ⏭️  Already cached: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total processed: ${classes.length}`);
  console.log(`   ⏱️  Time taken: ${duration} seconds`);
  console.log('\n✅ Done!\n');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
