// Vercel Serverless Function: Get NFTs
// File: api/nfts/collection/[collectionId].js
// Route: GET /api/nfts/collection/:collectionId - Get NFTs by collection with pagination

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Add caching headers for better performance
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { collectionId } = req.query;
    const { page = 1, limit = 50 } = req.query;
    
    if (!collectionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Collection ID is required' 
      });
    }

    console.log(`📊 Get NFTs for Collection - ID: ${collectionId}, Page: ${page}, Limit: ${limit}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get total count first
    const { count: totalCount } = await supabase
      .from('nfts')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);

    // Query NFTs table by collection_id with pagination
    const { data, error } = await supabase
      .from('nfts')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('❌ Supabase error:', error);
      // Return empty array instead of error if table exists but query fails
      if (error.code === 'PGRST116') {
        return res.status(200).json({ 
          success: true, 
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            hasMore: false,
          },
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch NFTs',
        error: error.message 
      });
    }

    // Transform NFT data to ensure image URLs are properly formatted
    const transformedNFTs = (data || []).map(nft => {
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
      
      // Log if no image found (helps debugging)
      if (!imageUrl) {
        console.warn(`⚠️ No image for NFT ${nft.id} (token: ${nft.token_id}) in collection ${collectionId}`);
      }
      
      return {
        ...nft,
        // Ensure image field is populated
        image: imageUrl,
        // Ensure metadata is properly formatted
        metadata: nft.metadata || {},
        // Add helpful fields
        collection_id: collectionId,
      };
    });

    const hasMore = offset + limitNum < (totalCount || 0);

    return res.status(200).json({ 
      success: true, 
      data: transformedNFTs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount || 0,
        hasMore,
      },
      totalCount: totalCount || 0,
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
}

