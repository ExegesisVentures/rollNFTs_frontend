// API Endpoint: Get Listed NFTs
// File: api/nfts/listed.js
// Vercel Serverless Function

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { page = 1, limit = 20, collection_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = supabase
      .from('nfts')
      .select('*, collections!nfts_collection_id_fkey(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Optional filter by collection
    if (collection_id) {
      query = query.eq('collection_id', collection_id);
    }

    const { data: nfts, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        data: []
      });
    }

    // Transform NFT data to ensure image URLs are properly formatted
    const transformedNFTs = (nfts || []).map(nft => {
      // Get image from metadata or direct image field
      let imageUrl = null;
      
      // Priority 1: Check metadata object for image
      if (nft.metadata && typeof nft.metadata === 'object') {
        imageUrl = nft.metadata.image || nft.metadata.imageUrl || nft.metadata.image_url;
      }
      
      // Priority 2: Check direct image field
      if (!imageUrl && nft.image) {
        imageUrl = nft.image;
      }
      
      // Priority 3: Check metadata_uri field
      if (!imageUrl && nft.metadata_uri) {
        imageUrl = nft.metadata_uri;
      }
      
      // Priority 4: Check collection cover_image as fallback
      if (!imageUrl && nft.collections?.cover_image) {
        imageUrl = nft.collections.cover_image;
      }
      
      // Log if no image found
      if (!imageUrl) {
        console.warn(`⚠️ No image found for NFT ${nft.id} (token: ${nft.token_id})`);
      }
      
      return {
        ...nft,
        // Ensure image field is populated
        image: imageUrl,
        // Ensure metadata is properly formatted
        metadata: nft.metadata || {},
        // Add collection name for display
        collection_name: nft.collections?.name || nft.collection_id,
      };
    });

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasMore = parseInt(page) < totalPages;

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: transformedNFTs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
}

