// API Endpoint: Get All Collections
// File: api/collections/all.js
// Fetches collections from blockchain + Supabase with optimized cover images

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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
    const { page = 1, limit = 20 } = req.query;
    
    console.log(`📦 Fetching collections - Page: ${page}, Limit: ${limit}`);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch collections from Supabase (already synced from blockchain)
    const { data: collections, error, count } = await supabase
      .from('collections')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }

    console.log(`✅ Found ${collections?.length || 0} collections`);

    // Transform collections to include optimized cover URLs
    const transformedCollections = collections.map(collection => ({
      ...collection,
      // Use cover_image if it exists, otherwise use a placeholder
      cover_image_url: collection.cover_image || generatePlaceholder(collection),
      nft_count: collection.total_items || 0,
    }));

    // Cache response for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: transformedCollections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        hasMore: count > page * limit
      }
    });

  } catch (error) {
    console.error('Error in collections/all:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch collections',
      data: []
    });
  }
}

// Generate a placeholder image URL for collections without covers
function generatePlaceholder(collection) {
  const name = collection.name || 'Collection';
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#30cfd0', '#a8edea'
  ];
  const color = colors[Math.abs(hashCode(collection.id || collection.collection_id || '')) % colors.length];
  
  // SVG placeholder with collection initial
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect fill='${encodeURIComponent(color)}' width='128' height='128'/%3E%3Ctext fill='white' font-family='sans-serif' font-size='64' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${initial}%3C/text%3E%3C/svg%3E`;
}

// Simple hash function for consistent color selection
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

