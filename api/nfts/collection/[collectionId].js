// Vercel Serverless Function: Get NFTs
// File: api/nfts/collection/[collectionId].js
// Route: GET /api/nfts/collection/:collectionId - Get NFTs by collection

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { collectionId } = req.query;
    
    if (!collectionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Collection ID is required' 
      });
    }

    console.log(`📊 Get NFTs for Collection - ID: ${collectionId}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query NFTs table by collection_id
    const { data, error } = await supabase
      .from('nfts')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      // Return empty array instead of error if table exists but query fails
      if (error.code === 'PGRST116') {
        return res.status(200).json({ 
          success: true, 
          data: [] 
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch NFTs',
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: data || [] 
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
}

