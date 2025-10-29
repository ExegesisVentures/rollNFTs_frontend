// API Endpoint: Optimize and Cache Images
// File: api/images/optimize.js
// Vercel Serverless Function
// Fetches IPFS image, optimizes it, stores in Supabase Storage

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const THUMBNAIL_SIZE = 256; // 256x256px thumbnails for grid
const FULL_SIZE = 1024; // 1024px max for detail views
const THUMBNAIL_QUALITY = 80;
const FULL_QUALITY = 90;
const THUMBNAIL_BUCKET = 'nft-thumbnails';
const FULL_BUCKET = 'nft-images';

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
    const { ipfsUrl, nftId, size = 'thumbnail' } = req.body;

    if (!ipfsUrl || !nftId) {
      return res.status(400).json({
        success: false,
        message: 'ipfsUrl and nftId are required'
      });
    }

    // Determine which bucket and size to use
    const isFullSize = size === 'full';
    const targetSize = isFullSize ? FULL_SIZE : THUMBNAIL_SIZE;
    const quality = isFullSize ? FULL_QUALITY : THUMBNAIL_QUALITY;
    const bucket = isFullSize ? FULL_BUCKET : THUMBNAIL_BUCKET;
    const cacheKey = `${nftId}.webp`;

    console.log(`📸 Optimizing ${size}: ${nftId} (target: ${targetSize}px, quality: ${quality}%)`);

    // Check if already cached in Supabase Storage
    const { data: existingFile } = await supabase
      .storage
      .from(bucket)
      .list('', { search: cacheKey });

    if (existingFile && existingFile.length > 0) {
      // Return cached URL
      const { data: publicUrl } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(cacheKey);

      return res.status(200).json({
        success: true,
        optimizedUrl: publicUrl.publicUrl,
        cached: true,
        size: size,
        bucket: bucket
      });
    }

    console.log(`📥 Fetching from IPFS: ${ipfsUrl}`);

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
    
    // Optimize image with sharp based on size
    let sharpInstance = sharp(Buffer.from(imageBuffer));
    
    if (isFullSize) {
      // Full size: maintain aspect ratio, max 1024px on longest side
      sharpInstance = sharpInstance.resize(targetSize, targetSize, {
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true // Don't upscale small images
      });
    } else {
      // Thumbnail: square crop, center
      sharpInstance = sharpInstance.resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center'
      });
    }
    
    const optimizedBuffer = await sharpInstance
      .webp({ quality })
      .toBuffer();

    const savings = Math.round((1 - optimizedBuffer.length / imageBuffer.byteLength) * 100);
    console.log(`✅ Optimized ${size}: ${imageBuffer.byteLength} → ${optimizedBuffer.length} bytes (${savings}% savings)`);

    // Upload to appropriate Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucket)
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
      .from(bucket)
      .getPublicUrl(cacheKey);

    console.log(`✅ Cached to ${bucket}: ${publicUrl.publicUrl}`);

    return res.status(200).json({
      success: true,
      optimizedUrl: publicUrl.publicUrl,
      cached: false,
      size: size,
      bucket: bucket,
      originalSize: imageBuffer.byteLength,
      optimizedSize: optimizedBuffer.length,
      savings: savings
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

