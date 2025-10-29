// API Endpoint: IPFS Image Proxy with Cache
// File: api/images/proxy.js
// Vercel Edge Function (faster than serverless)
// Serves cached thumbnails or proxies IPFS

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const CACHE_BUCKET = 'nft-thumbnails';

// IPFS Gateways for fallback
const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
];

export const config = {
  runtime: 'edge', // Use Edge Runtime for faster response
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const nftId = searchParams.get('nftId');
  const ipfsHash = searchParams.get('hash');

  if (!nftId || !ipfsHash) {
    return new Response(
      JSON.stringify({ error: 'nftId and hash are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const cacheKey = `${nftId}.webp`;

    // Check Supabase Storage cache
    const { data: publicUrl } = supabase
      .storage
      .from(CACHE_BUCKET)
      .getPublicUrl(cacheKey);

    // Try to fetch from cache
    try {
      const cacheResponse = await fetch(publicUrl.publicUrl, {
        cf: { cacheTtl: 86400 } // Cloudflare cache for 24 hours
      });

      if (cacheResponse.ok) {
        // Return cached image
        return new Response(cacheResponse.body, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Cache': 'HIT'
          }
        });
      }
    } catch (cacheError) {
      // Cache miss, continue to IPFS
      console.log('Cache miss, fetching from IPFS');
    }

    // Fallback: Fetch from IPFS gateways
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const ipfsUrl = `${gateway}${ipfsHash}`;
        const ipfsResponse = await fetch(ipfsUrl, {
          timeout: 5000,
          cf: { cacheTtl: 3600 }
        });

        if (ipfsResponse.ok) {
          return new Response(ipfsResponse.body, {
            headers: {
              'Content-Type': ipfsResponse.headers.get('Content-Type') || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'X-Cache': 'MISS',
              'X-Gateway': gateway
            }
          });
        }
      } catch (gatewayError) {
        continue; // Try next gateway
      }
    }

    // All gateways failed
    return new Response('Image not found', { status: 404 });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

