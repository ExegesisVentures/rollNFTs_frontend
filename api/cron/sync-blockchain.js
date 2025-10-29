// Vercel Cron Job: Blockchain Sync
// File: api/cron/sync-blockchain.js
// Runs every hour to sync latest blockchain data
// Configure in vercel.json

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

export default async function handler(req, res) {
  // Verify this is a cron job request (security)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Starting scheduled blockchain sync...');
  const startTime = Date.now();

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Fetch all NFT classes from Coreum
    const classes = await fetchAllNFTClasses();
    console.log(`📦 Found ${classes.length} NFT classes`);

    let syncedCollections = 0;
    let syncedNFTs = 0;
    let newNFTs = [];

    // Step 2: Sync each collection
    for (const classData of classes) {
      try {
        const collection = await parseClassToCollection(classData);
        if (!collection) continue;

        // Check if collection exists
        const { data: existingCollection } = await supabase
          .from('collections')
          .select('id, last_synced_at')
          .eq('collection_id', collection.collection_id)
          .single();

        // Upsert collection
        const { error: collectionError } = await supabase
          .from('collections')
          .upsert(collection, {
            onConflict: 'collection_id',
            ignoreDuplicates: false,
          });

        if (collectionError) {
          console.error(`❌ Failed to sync collection ${collection.collection_id}:`, collectionError);
          continue;
        }

        syncedCollections++;

        // Step 3: Sync NFTs in collection (incremental)
        const lastSyncTime = existingCollection?.last_synced_at 
          ? new Date(existingCollection.last_synced_at) 
          : new Date(0);

        const nfts = await fetchNFTsInClass(collection.collection_id);
        console.log(`📸 Processing ${nfts.length} NFTs in ${collection.collection_id}`);

        for (const nftData of nfts) {
          try {
            const nft = await parseNFTData(nftData, collection.collection_id);
            if (!nft) continue;

            // Check if NFT already exists
            const { data: existingNFT } = await supabase
              .from('nfts')
              .select('id')
              .eq('collection_id', nft.collection_id)
              .eq('token_id', nft.token_id)
              .single();

            // Upsert NFT
            const { error: nftError } = await supabase
              .from('nfts')
              .upsert(nft, {
                onConflict: 'collection_id,token_id',
                ignoreDuplicates: false,
              });

            if (!nftError) {
              syncedNFTs++;
              
              // Track new NFTs for image pre-caching
              if (!existingNFT && nft.image) {
                newNFTs.push({
                  id: `${nft.collection_id}-${nft.token_id}`,
                  image: nft.image,
                  collection_id: nft.collection_id,
                  token_id: nft.token_id,
                });
              }
            }
          } catch (nftError) {
            console.error(`❌ Failed to sync NFT:`, nftError);
          }
        }

        // Don't overwhelm the system - limit to 5 collections per run
        if (syncedCollections >= 5) {
          console.log('⚠️ Reached collection limit for this run');
          break;
        }

      } catch (error) {
        console.error(`❌ Failed to process class:`, error);
      }
    }

    // Step 4: Trigger image pre-caching for new NFTs
    if (newNFTs.length > 0) {
      console.log(`🖼️ Triggering pre-cache for ${newNFTs.length} new NFTs`);
      
      // Call image pre-cache worker (fire and forget)
      fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workers/image-precache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ nfts: newNFTs.slice(0, 50) }), // Batch of 50
      }).catch(err => console.warn('Pre-cache trigger failed:', err));
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Sync complete in ${duration}ms: ${syncedCollections} collections, ${syncedNFTs} NFTs`);

    return res.status(200).json({
      success: true,
      duration,
      syncedCollections,
      syncedNFTs,
      newNFTs: newNFTs.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Cron sync failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Helper functions (same as sync/blockchain.js)
async function fetchAllNFTClasses() {
  const allClasses = [];
  let nextKey = null;
  let pageCount = 0;
  const maxPages = 20; // Limit for cron job

  do {
    pageCount++;
    let url = `${COREUM_REST}/coreum/asset/nft/v1/classes?pagination.limit=100`;
    if (nextKey) {
      url += `&pagination.key=${encodeURIComponent(nextKey)}`;
    }

    const response = await fetch(url);
    if (!response.ok) break;

    const data = await response.json();
    if (data.classes && data.classes.length > 0) {
      allClasses.push(...data.classes);
    }

    nextKey = data.pagination?.next_key;
    if (pageCount >= maxPages) break;

  } while (nextKey);

  return allClasses;
}

async function fetchNFTsInClass(classId) {
  const allNFTs = [];
  let nextKey = null;
  let pageCount = 0;
  const maxPages = 10;

  do {
    pageCount++;
    let url = `${COREUM_REST}/cosmos/nft/v1beta1/nfts?class_id=${classId}&pagination.limit=100`;
    if (nextKey) {
      url += `&pagination.key=${encodeURIComponent(nextKey)}`;
    }

    const response = await fetch(url);
    if (!response.ok) break;

    const data = await response.json();
    if (data.nfts && data.nfts.length > 0) {
      allNFTs.push(...data.nfts);
    }

    nextKey = data.pagination?.next_key;
    if (pageCount >= maxPages) break;

  } while (nextKey);

  return allNFTs;
}

async function parseClassToCollection(classData) {
  try {
    const classInfo = classData.class || classData;
    let metadata = {};
    
    if (classInfo.data) {
      try {
        metadata = JSON.parse(classInfo.data);
      } catch (e) {
        metadata = { description: classInfo.data };
      }
    }

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
    console.error('Failed to parse class:', error);
    return null;
  }
}

async function parseNFTData(nftData, classId) {
  try {
    let metadata = {};
    
    if (nftData.data) {
      try {
        metadata = JSON.parse(nftData.data);
      } catch (e) {
        metadata = { description: nftData.data };
      }
    }

    return {
      collection_id: classId,
      token_id: nftData.id,
      name: metadata.name || nftData.name || nftData.id,
      description: metadata.description || '',
      image: metadata.image || nftData.uri || '',
      metadata: metadata,
      metadata_uri: nftData.uri || '',
      owner_address: nftData.owner || '',
      synced_from_blockchain: true,
      last_synced_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse NFT:', error);
    return null;
  }
}

