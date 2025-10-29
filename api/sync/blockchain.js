// Vercel Serverless Function: Sync Blockchain NFTs
// File: api/sync/blockchain.js
// Route: POST /api/sync/blockchain - Sync all NFT classes from Coreum to database

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting blockchain sync...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all NFT classes from Coreum
    const classes = await fetchAllNFTClasses();
    
    if (!classes || classes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No NFT classes found on blockchain',
        collections: 0,
        nfts: 0,
      });
    }
    
    let syncedCollections = 0;
    let syncedNFTs = 0;
    const errors = [];
    
    // Process each class
    for (const classData of classes) {
      try {
        const collection = parseClassToCollection(classData);
        
        if (!collection) {
          console.warn(`⚠️ Skipping invalid class data`);
          continue;
        }
        
        // Upsert collection to database (insert or update if exists)
        const { error: collectionError } = await supabase
          .from('collections')
          .upsert(collection, {
            onConflict: 'collection_id',
            ignoreDuplicates: false,
          });
        
        if (collectionError) {
          console.error(`❌ Failed to sync collection ${collection.collection_id}:`, collectionError);
          errors.push({
            collection_id: collection.collection_id,
            error: collectionError.message,
          });
          continue;
        }
        
        syncedCollections++;
        console.log(`✅ Synced collection: ${collection.collection_id}`);
        
      } catch (error) {
        console.error(`❌ Failed to process class:`, error);
        errors.push({
          error: error.message,
        });
      }
    }
    
    console.log(`✅ Sync complete! Collections: ${syncedCollections}`);
    
    return res.status(200).json({
      success: true,
      message: `Synced ${syncedCollections} collections from blockchain`,
      collections: syncedCollections,
      nfts: syncedNFTs,
      total_found: classes.length,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error('❌ Blockchain sync failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Blockchain sync failed',
    });
  }
}

// Helper: Fetch all NFT classes from Coreum with pagination
async function fetchAllNFTClasses() {
  const allClasses = [];
  let nextKey = null;
  let pageCount = 0;
  const maxPages = 100;
  
  do {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount}...`);
    
    let url = `${COREUM_REST}/coreum/asset/nft/v1/classes?pagination.limit=100`;
    if (nextKey) {
      url += `&pagination.key=${encodeURIComponent(nextKey)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    
    if (data.classes && data.classes.length > 0) {
      console.log(`✅ Found ${data.classes.length} classes on page ${pageCount}`);
      allClasses.push(...data.classes);
    }
    
    nextKey = data.pagination?.next_key;
    
    if (pageCount >= maxPages) {
      console.warn('⚠️ Reached max page limit');
      break;
    }
    
  } while (nextKey);
  
  console.log(`✅ Total NFT classes found: ${allClasses.length}`);
  return allClasses;
}

// Helper: Parse class data to collection format
function parseClassToCollection(classData) {
  try {
    const classInfo = classData.class || classData;
    
    // Parse metadata if it's JSON
    let metadata = {};
    if (classInfo.data) {
      try {
        metadata = JSON.parse(classInfo.data);
      } catch (e) {
        metadata = { description: classInfo.data };
      }
    }
    
    // Parse features array
    const features = classInfo.features || [];
    
    return {
      collection_id: classInfo.id,
      name: classInfo.name || classInfo.symbol || classInfo.id,
      symbol: classInfo.symbol || '',
      description: metadata.description || classInfo.description || '',
      cover_image: metadata.image || metadata.cover_image || '',
      banner_image: metadata.banner_image || '',
      creator_address: classInfo.issuer || '',
      metadata_uri: classInfo.uri || '',
      features_burning: features.includes('burning') || false,
      features_freezing: features.includes('freezing') || false,
      features_whitelisting: features.includes('whitelisting') || false,
      features_disable_sending: features.includes('disable_sending') || false,
      royalty_bps: classInfo.royalty_rate ? parseInt(classInfo.royalty_rate) : 0,
      synced_from_blockchain: true,
      last_synced_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to parse class data:', error);
    return null;
  }
}

