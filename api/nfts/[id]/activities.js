// API Endpoint: Get NFT Activities/History
// File: api/nfts/[id]/activities.js
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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'NFT ID is required',
        data: []
      });
    }

    // Check if activities table exists, if not return empty array
    // This is a placeholder since we don't have an activities table yet
    // In a full implementation, you would query from an nft_activities or transactions table
    
    // For now, return basic activity data based on the NFT itself
    const { data: nft, error } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'NFT not found',
          data: []
        });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        data: []
      });
    }

    // Create basic activity from NFT data
    const activities = [];
    
    if (nft.minted_at) {
      activities.push({
        id: `${id}-mint`,
        type: 'mint',
        nft_id: id,
        from_address: null,
        to_address: nft.owner_address,
        timestamp: nft.minted_at,
        transaction_hash: null
      });
    }

    if (nft.synced_from_blockchain && nft.last_synced_at) {
      activities.push({
        id: `${id}-sync`,
        type: 'sync',
        nft_id: id,
        from_address: null,
        to_address: null,
        timestamp: nft.last_synced_at,
        transaction_hash: null
      });
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
}

