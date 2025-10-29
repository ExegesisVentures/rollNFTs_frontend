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

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasMore = parseInt(page) < totalPages;

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: nfts || [],
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

