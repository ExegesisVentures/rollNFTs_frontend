// API Endpoint: Get Collections by Owner Address
// File: api/collections/owner/[ownerAddress].js
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

    // Fetch collections created by address
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .eq('creator_address', ownerAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        data: []
      });
    }

    // Cache for 2 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      data: collections || []
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
}

