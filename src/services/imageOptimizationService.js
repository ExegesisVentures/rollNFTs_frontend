// Image Optimization Service with Caching
// File: src/services/imageOptimizationService.js
// Provides smart image loading with Supabase Storage caching and CDN

import { supabase } from '../lib/supabase';
import { ipfsToHttp, getIpfsHash } from '../utils/ipfs';

class ImageOptimizationService {
  constructor() {
    this.cache = new Map(); // In-memory cache for this session
    this.pendingFetches = new Map(); // Prevent duplicate fetches
  }

  /**
   * Get optimized image URL with automatic caching
   * Returns cached version if available, otherwise returns IPFS gateway URL
   */
  async getOptimizedImageUrl(imageUri, options = {}) {
    if (!imageUri) return null;

    const { width, height, quality = 85 } = options;
    
    // Check in-memory cache first
    const cacheKey = `${imageUri}-${width}-${height}-${quality}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if this is already being fetched
    if (this.pendingFetches.has(cacheKey)) {
      return this.pendingFetches.get(cacheKey);
    }

    // Create promise for this fetch
    const fetchPromise = this._fetchOptimizedImage(imageUri, options);
    this.pendingFetches.set(cacheKey, fetchPromise);

    try {
      const url = await fetchPromise;
      this.cache.set(cacheKey, url);
      return url;
    } finally {
      this.pendingFetches.delete(cacheKey);
    }
  }

  async _fetchOptimizedImage(imageUri, options) {
    try {
      const ipfsHash = getIpfsHash(imageUri);
      if (!ipfsHash) {
        return ipfsToHttp(imageUri);
      }

      // Check if cached in Supabase Storage
      const { data: cachedFiles, error } = await supabase.storage
        .from('nft-images')
        .list(`optimized/${ipfsHash}`);

      if (!error && cachedFiles && cachedFiles.length > 0) {
        // Return cached image from Supabase CDN
        const { data } = supabase.storage
          .from('nft-images')
          .getPublicUrl(`optimized/${ipfsHash}/${cachedFiles[0].name}`);
        
        return data.publicUrl;
      }

      // No cached version, return IPFS gateway URL
      return ipfsToHttp(imageUri);
    } catch (error) {
      console.error('Image optimization error:', error);
      return ipfsToHttp(imageUri);
    }
  }

  /**
   * Preload images for better perceived performance
   */
  preloadImages(imageUrls) {
    imageUrls.forEach(url => {
      if (!url) return;
      
      const img = new Image();
      img.src = url;
    });
  }

  /**
   * Get responsive image URLs for different screen sizes
   */
  getResponsiveUrls(imageUri) {
    const baseUrl = ipfsToHttp(imageUri);
    
    return {
      thumb: this._addImageParams(baseUrl, { width: 200, quality: 70 }),
      small: this._addImageParams(baseUrl, { width: 400, quality: 80 }),
      medium: this._addImageParams(baseUrl, { width: 800, quality: 85 }),
      large: baseUrl,
    };
  }

  _addImageParams(url, { width, height, quality }) {
    if (!url.includes('pinata.cloud')) {
      return url; // Only Pinata supports query params
    }

    const params = new URLSearchParams();
    if (width) params.append('img-width', width);
    if (height) params.append('img-height', height);
    if (quality) params.append('img-quality', quality);
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Clear in-memory cache (useful for memory management)
   */
  clearCache() {
    this.cache.clear();
  }
}

export default new ImageOptimizationService();

