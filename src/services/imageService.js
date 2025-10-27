// Image Optimization Service
// File: src/services/imageService.js
// Handles upload to IPFS → Supabase → Vercel pipeline

import supabase from '../lib/supabase';
import axios from 'axios';
import { ipfsToHttp } from '../utils/ipfs';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET = import.meta.env.VITE_PINATA_SECRET;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';

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

      // Try with API key first (if JWT not available)
      const headers = {};
      if (PINATA_JWT) {
        headers['Authorization'] = `Bearer ${PINATA_JWT}`;
      } else if (PINATA_API_KEY && PINATA_SECRET) {
        headers['pinata_api_key'] = PINATA_API_KEY;
        headers['pinata_secret_api_key'] = PINATA_SECRET;
      } else if (PINATA_API_KEY) {
        // Try with just API key
        headers['Authorization'] = `Bearer ${PINATA_API_KEY}`;
      } else {
        throw new Error('No Pinata credentials configured');
      }

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...headers,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const url = ipfsToHttp(`ipfs://${ipfsHash}`);

      return {
        success: true,
        ipfsHash: ipfsHash,
        url: url,
      };
    } catch (error) {
      console.error('IPFS upload failed:', error.response?.data || error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  // Upload JSON metadata to IPFS
  async uploadMetadataToIPFS(metadata) {
    try {
      // Try with API key first (if JWT not available)
      const headers = {};
      if (PINATA_JWT) {
        headers['Authorization'] = `Bearer ${PINATA_JWT}`;
      } else if (PINATA_API_KEY && PINATA_SECRET) {
        headers['pinata_api_key'] = PINATA_API_KEY;
        headers['pinata_secret_api_key'] = PINATA_SECRET;
      } else if (PINATA_API_KEY) {
        headers['Authorization'] = `Bearer ${PINATA_API_KEY}`;
      } else {
        throw new Error('No Pinata credentials configured');
      }

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const url = ipfsToHttp(`ipfs://${ipfsHash}`);

      return {
        success: true,
        ipfsHash: ipfsHash,
        url: url,
      };
    } catch (error) {
      console.error('Metadata upload failed:', error.response?.data || error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
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
        // Check if cached URL uses old gateway and needs refresh
        const cachedUrl = data.medium_url || data.original_url;
        const currentUrl = ipfsToHttp(`ipfs://${ipfsHash}`);
        
        // If cached URL uses old gateway, refresh it
        if (cachedUrl && cachedUrl.includes('magenta-certain-scallop-951.mypinata.cloud')) {
          console.log(`🔄 Refreshing cached URL for ${ipfsHash} - old gateway detected`);
          this.optimizeAndCache(ipfsHash, currentUrl); // Refresh cache
          return {
            cached: false,
            url: currentUrl,
          };
        }

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
          url: cachedUrl,
        };
      }

      // Not cached, return IPFS URL and trigger caching
      const ipfsUrl = ipfsToHttp(`ipfs://${ipfsHash}`);
      this.optimizeAndCache(ipfsHash, ipfsUrl); // Fire and forget

      return {
        cached: false,
        url: ipfsUrl,
      };
    } catch (error) {
      console.error('Failed to get optimized URL:', error);
      return {
        cached: false,
        url: ipfsToHttp(`ipfs://${ipfsHash}`),
      };
    }
  }
}

export default new ImageService();
