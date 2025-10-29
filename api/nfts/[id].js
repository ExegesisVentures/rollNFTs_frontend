// API Endpoint: Get Single NFT by ID
// File: api/nfts/[id].js
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
        message: 'NFT ID is required'
      });
    }

    // Fetch NFT with collection data
    const { data: nft, error } = await supabase
      .from('nfts')
      .select('*, collections!nfts_collection_id_fkey(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: nft
    });
  } catch (error) {
    console.error('Error fetching NFT:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

