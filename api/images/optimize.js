// API Endpoint: Optimize and Cache Images
// File: api/images/optimize.js
// Vercel Serverless Function
// Fetches IPFS image, optimizes it, stores in Supabase Storage

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const THUMBNAIL_SIZE = 256; // 256x256px thumbnails
const THUMBNAIL_QUALITY = 80;
const CACHE_BUCKET = 'nft-thumbnails';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { ipfsUrl, nftId } = req.body;

    if (!ipfsUrl || !nftId) {
      return res.status(400).json({
        success: false,
        message: 'ipfsUrl and nftId are required'
      });
    }

    // Generate cache key
    const cacheKey = `${nftId}.webp`;

    // Check if already cached in Supabase Storage
    const { data: existingFile } = await supabase
      .storage
      .from(CACHE_BUCKET)
      .list('', { search: cacheKey });

    if (existingFile && existingFile.length > 0) {
      // Return cached URL
      const { data: publicUrl } = supabase
        .storage
        .from(CACHE_BUCKET)
        .getPublicUrl(cacheKey);

      return res.status(200).json({
        success: true,
        optimizedUrl: publicUrl.publicUrl,
        cached: true
      });
    }

    console.log(`📥 Optimizing image: ${ipfsUrl}`);

    // Fetch original image from IPFS
    const imageResponse = await fetch(ipfsUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'RollNFTs-ImageOptimizer/1.0'
      }
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Optimize image with sharp
    const optimizedBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    console.log(`✅ Optimized: ${imageBuffer.byteLength} -> ${optimizedBuffer.length} bytes`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(CACHE_BUCKET)
      .upload(cacheKey, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrl } = supabase
      .storage
      .from(CACHE_BUCKET)
      .getPublicUrl(cacheKey);

    console.log(`✅ Cached to Supabase: ${publicUrl.publicUrl}`);

    return res.status(200).json({
      success: true,
      optimizedUrl: publicUrl.publicUrl,
      cached: false,
      originalSize: imageBuffer.byteLength,
      optimizedSize: optimizedBuffer.length,
      savings: Math.round((1 - optimizedBuffer.length / imageBuffer.byteLength) * 100)
    });

  } catch (error) {
    console.error('Image optimization error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      optimizedUrl: null
    });
  }
}

