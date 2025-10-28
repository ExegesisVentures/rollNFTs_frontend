// Vercel Serverless Function: Get Collections
// File: api/collections/index.js
// Route: GET /api/collections - Get all collections
// Route: GET /api/collections/:id - Get collection by ID

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract collection ID from URL path
    // URL format: /api/collections or /api/collections/123
    const pathParts = req.url.split('/').filter(Boolean);
    const collectionId = pathParts.length > 2 ? pathParts[2] : null;

    console.log(`📊 Collections API - ID: ${collectionId || 'all'}`);

    if (collectionId) {
      // Get single collection by ID (UUID or collection_id)
      let query = supabase
        .from('collections')
        .select('*');

      // Try UUID first
      if (collectionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = query.eq('id', collectionId);
      } else {
        // Try collection_id (e.g., "awesome5-core1eg7...")
        query = query.eq('collection_id', collectionId);
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
    } else {
      // Get all collections
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch collections',
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: data || [] 
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
}

