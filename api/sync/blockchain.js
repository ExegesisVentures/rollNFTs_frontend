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
    
    // Get sync options from request body
    const { syncNFTs = false, collectionId = null } = req.body || {};
    
    // Process each class (or specific collection)
    const classesToSync = collectionId 
      ? classes.filter(c => (c.class?.id || c.id) === collectionId)
      : classes;
    
    for (const classData of classesToSync) {
      try {
        const collection = await parseClassToCollection(classData);
        
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
        
        // Optionally sync NFTs in this collection
        if (syncNFTs) {
          try {
            const nfts = await fetchNFTsInClass(collection.collection_id);
            console.log(`📦 Found ${nfts.length} NFTs in ${collection.collection_id}`);
            
            // Parse and sync NFTs
            for (const nftData of nfts) {
              try {
                const nft = await parseNFTData(nftData, collection.collection_id);
                
                if (!nft) continue;
                
                const { error: nftError } = await supabase
                  .from('nfts')
                  .upsert(nft, {
                    onConflict: 'collection_id,token_id',
                    ignoreDuplicates: false,
                  });
                
                if (nftError) {
                  console.error(`❌ Failed to sync NFT ${nft.token_id}:`, nftError);
                } else {
                  syncedNFTs++;
                }
              } catch (nftError) {
                console.error(`❌ Failed to parse NFT:`, nftError);
              }
            }
          } catch (nftFetchError) {
            console.error(`❌ Failed to fetch NFTs for ${collection.collection_id}:`, nftFetchError);
          }
        }
        
      } catch (error) {
        console.error(`❌ Failed to process class:`, error);
        errors.push({
          error: error.message,
        });
      }
    }
    
    console.log(`✅ Sync complete! Collections: ${syncedCollections}, NFTs: ${syncedNFTs}`);
    
    return res.status(200).json({
      success: true,
      message: `Synced ${syncedCollections} collections${syncNFTs ? ` and ${syncedNFTs} NFTs` : ''} from blockchain`,
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

// Helper: Fetch NFTs in a specific class
async function fetchNFTsInClass(classId) {
  const allNFTs = [];
  let nextKey = null;
  let pageCount = 0;
  const maxPages = 100;
  
  do {
    pageCount++;
    
    let url = `${COREUM_REST}/cosmos/nft/v1beta1/nfts?class_id=${classId}&pagination.limit=100`;
    if (nextKey) {
      url += `&pagination.key=${encodeURIComponent(nextKey)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP error for class ${classId}! status: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    
    if (data.nfts && data.nfts.length > 0) {
      allNFTs.push(...data.nfts);
    }
    
    nextKey = data.pagination?.next_key;
    
    if (pageCount >= maxPages) break;
    
  } while (nextKey);
  
  return allNFTs;
}

// Helper: Fetch metadata from URI
async function fetchMetadataFromURI(uri) {
  if (!uri) return {};
  
  try {
    // Convert IPFS URI to HTTP if needed
    let httpUrl = uri;
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      httpUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
    } else if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
      httpUrl = `https://gateway.pinata.cloud/ipfs/${uri}`;
    }
    
    console.log(`📥 Fetching metadata from: ${httpUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(httpUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch metadata: ${response.status}`);
      return {};
    }
    
    const metadata = await response.json();
    console.log(`✅ Metadata fetched successfully`);
    return metadata;
    
  } catch (error) {
    console.warn(`⚠️ Failed to fetch metadata from ${uri}:`, error.message);
    return {};
  }
}

// Helper: Parse class data to collection format
async function parseClassToCollection(classData) {
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
    
    // If no image in embedded metadata, try to fetch from URI
    if (!metadata.image && classInfo.uri) {
      console.log(`🔄 Fetching collection metadata from URI`);
      const uriMetadata = await fetchMetadataFromURI(classInfo.uri);
      metadata = { ...metadata, ...uriMetadata };
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

// Helper: Parse NFT data to database format
async function parseNFTData(nftData, classId) {
  try {
    // First, try to parse embedded metadata from data field
    let metadata = {};
    if (nftData.data) {
      try {
        metadata = JSON.parse(nftData.data);
      } catch (e) {
        metadata = { description: nftData.data };
      }
    }
    
    // If no image in embedded metadata, fetch from URI
    if (!metadata.image && nftData.uri) {
      console.log(`🔄 Fetching NFT metadata from URI for: ${nftData.id}`);
      const uriMetadata = await fetchMetadataFromURI(nftData.uri);
      metadata = { ...metadata, ...uriMetadata };
    }
    
    return {
      collection_id: classId,
      token_id: nftData.id,
      name: metadata.name || nftData.name || nftData.id,
      description: metadata.description || '',
      image: metadata.image || '',
      metadata: metadata, // Store full metadata as JSONB
      metadata_uri: nftData.uri || '',
      owner_address: nftData.owner || '',
      synced_from_blockchain: true,
      last_synced_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to parse NFT data:', error);
    return null;
  }
}
