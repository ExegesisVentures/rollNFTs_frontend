// Image Optimization Service
// File: src/services/imageService.js
// Handles upload to IPFS → Supabase → Vercel pipeline

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET = import.meta.env.VITE_PINATA_SECRET;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = 'https://gateway.pinata.cloud';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

class ImageService {
  // Upload image to Pinata (IPFS)
  async uploadToIPFS(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const pinataMetadata = JSON.stringify({
        name: metadata.name || file.name,
        keyvalues: metadata.keyvalues || {},
      });
      formData.append('pinataMetadata', pinataMetadata);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        url: `${PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`,
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload JSON metadata to IPFS
  async uploadMetadataToIPFS(metadata) {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET,
          },
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        url: `${PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`,
      };
    } catch (error) {
      console.error('Metadata upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate optimized images and cache in Supabase
  async optimizeAndCache(ipfsHash, originalUrl) {
    try {
      // Download original image
      const response = await fetch(originalUrl);
      const blob = await response.blob();

      // Upload to Supabase Storage for caching
      const fileName = `${ipfsHash}/original.${blob.type.split('/')[1]}`;
      const { data, error } = await supabase.storage
        .from('nft-images')
        .upload(fileName, blob, {
          cacheControl: '31536000', // 1 year
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('nft-images')
        .getPublicUrl(fileName);

      // Store in image_cache table
      await supabase.from('image_cache').upsert({
        ipfs_hash: ipfsHash,
        original_url: originalUrl,
        thumb_url: urlData.publicUrl,
        medium_url: urlData.publicUrl,
        large_url: urlData.publicUrl,
        cached_at: new Date().toISOString(),
      });

      return {
        success: true,
        cached: true,
        urls: {
          original: originalUrl,
          cached: urlData.publicUrl,
        },
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: originalUrl, // Use IPFS as fallback
      };
    }
  }

  // Get optimized image URL (check cache first)
  async getOptimizedURL(ipfsHash) {
    try {
      // Check cache
      const { data, error } = await supabase
        .from('image_cache')
        .select('*')
        .eq('ipfs_hash', ipfsHash)
        .single();

      if (!error && data) {
        // Update access count
        await supabase
          .from('image_cache')
          .update({
            access_count: data.access_count + 1,
            last_accessed: new Date().toISOString(),
          })
          .eq('ipfs_hash', ipfsHash);

        return {
          cached: true,
          url: data.medium_url || data.original_url,
        };
      }

      // Not cached, return IPFS URL and trigger caching
      const ipfsUrl = `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
      this.optimizeAndCache(ipfsHash, ipfsUrl); // Fire and forget

      return {
        cached: false,
        url: ipfsUrl,
      };
    } catch (error) {
      console.error('Failed to get optimized URL:', error);
      return {
        cached: false,
        url: `${PINATA_GATEWAY}/ipfs/${ipfsHash}`,
      };
    }
  }
}

export default new ImageService();

