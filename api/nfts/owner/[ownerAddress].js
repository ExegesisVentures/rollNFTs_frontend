// API Endpoint: Get NFTs by Owner Address
// File: api/nfts/owner/[ownerAddress].js
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
    const { ownerAddress } = req.query;

    if (!ownerAddress) {
      return res.status(400).json({
        success: false,
        message: 'Owner address is required',
        data: []
      });
    }

    // Fetch NFTs owned by address with collection data
    const { data: nfts, error } = await supabase
      .from('nfts')
      .select('*, collections!nfts_collection_id_fkey(*)')
      .eq('owner_address', ownerAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        data: []
      });
    }

    // Cache for 2 minutes (shorter cache for owned NFTs as they change more frequently)
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      data: nfts || []
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

