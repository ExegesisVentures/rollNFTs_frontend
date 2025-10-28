// Vercel Serverless Function: Get Collection by ID
// File: api/collections/[id].js
// Route: GET /api/collections/:id - Get specific collection

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
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Collection ID is required' 
      });
    }

    console.log(`📊 Get Collection - ID: ${id}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('collections')
      .select('*');

    // Try UUID first
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', id);
    } else {
      // Try collection_id (e.g., "awesome5-core1eg7...")
      query = query.eq('collection_id', id);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Collection not found',
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
}

