// Client-Side Image Cache Service
// File: src/services/imageCache.js
// Manages optimized image URLs and caching

import { ipfsToHttp } from '../utils/ipfs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ImageCacheService {
  constructor() {
    this.cache = new Map();
    this.optimizing = new Map();
  }

  /**
   * Get optimized image URL (cached or proxy)
   * @param {string} ipfsUrl - Original IPFS URL
   * @param {string} nftId - NFT identifier
   * @param {string} size - 'thumbnail' or 'full' (default: 'thumbnail')
   * @returns {Promise<string>} - Optimized or original URL
   */
  async getOptimizedUrl(ipfsUrl, nftId, size = 'thumbnail') {
    if (!ipfsUrl || !nftId) return ipfsUrl;

    const cacheKey = `${nftId}-${size}`;

    // Check memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if already optimizing
    if (this.optimizing.has(cacheKey)) {
      return this.optimizing.get(cacheKey);
    }

    // Extract IPFS hash
    const hash = this.extractIPFSHash(ipfsUrl);
    if (!hash) {
      // Not an IPFS URL, return as is
      return ipfsUrl;
    }

    // Use proxy endpoint (edge function, faster)
    const proxyUrl = `${API_BASE}/images/proxy?nftId=${encodeURIComponent(nftId)}&hash=${encodeURIComponent(hash)}&size=${size}`;
    
    // Cache the URL
    this.cache.set(cacheKey, proxyUrl);
    
    // Trigger background optimization (fire and forget)
    this.optimizeInBackground(ipfsUrl, nftId, size);

    return proxyUrl;
  }

  /**
   * Get thumbnail URL (256x256) - for grid/card views
   * @param {string} ipfsUrl - Original IPFS URL
   * @param {string} nftId - NFT identifier
   * @returns {Promise<string>} - Thumbnail URL
   */
  async getThumbnailUrl(ipfsUrl, nftId) {
    return this.getOptimizedUrl(ipfsUrl, nftId, 'thumbnail');
  }

  /**
   * Get full-size URL (1024px) - for detail views
   * @param {string} ipfsUrl - Original IPFS URL
   * @param {string} nftId - NFT identifier
   * @returns {Promise<string>} - Full-size URL
   */
  async getFullSizeUrl(ipfsUrl, nftId) {
    return this.getOptimizedUrl(ipfsUrl, nftId, 'full');
  }

  /**
   * Extract IPFS hash from URL
   * @param {string} url - IPFS URL
   * @returns {string|null} - IPFS hash or null
   */
  extractIPFSHash(url) {
    if (!url) return null;

    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', '');
    }

    // Handle raw hash
    if (url.match(/^(Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]+)$/)) {
      return url;
    }

    // Handle gateway URL
    const match = url.match(/\/ipfs\/([^/?#]+)/);
    if (match) {
      return match[1];
    }

    return null;
  }

  /**
   * Optimize image in background (async, no await)
   * @param {string} ipfsUrl - Original IPFS URL
   * @param {string} nftId - NFT identifier
   * @param {string} size - 'thumbnail' or 'full'
   */
  async optimizeInBackground(ipfsUrl, nftId, size = 'thumbnail') {
    const cacheKey = `${nftId}-${size}`;
    if (this.optimizing.has(cacheKey)) return;

    const optimizationPromise = (async () => {
      try {
        const httpUrl = ipfsToHttp(ipfsUrl);
        
        const response = await fetch(`${API_BASE}/images/optimize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ipfsUrl: httpUrl,
            nftId,
            size, // Pass size parameter
          }),
        });

        if (!response.ok) {
          console.warn(`⚠️ ${size} optimization failed for ${nftId}`);
          return;
        }

        const data = await response.json();
        
        if (data.success && data.optimizedUrl) {
          // Update cache with optimized URL
          this.cache.set(cacheKey, data.optimizedUrl);
          console.log(`✅ Optimized ${size} ${nftId}: ${data.savings}% smaller (${data.bucket})`);
        }
      } catch (error) {
        console.warn(`⚠️ ${size} optimization error for ${nftId}:`, error.message);
      } finally {
        this.optimizing.delete(cacheKey);
      }
    })();

    this.optimizing.set(cacheKey, optimizationPromise);
  }

  /**
   * Preload images for better UX
   * @param {Array} nfts - Array of NFT objects
   */
  async preloadImages(nfts) {
    if (!nfts || nfts.length === 0) return;

    const promises = nfts.map(nft => {
      const imageUrl = nft.metadata?.image || nft.image;
      if (!imageUrl) return null;

      return this.getOptimizedUrl(imageUrl, nft.id);
    }).filter(Boolean);

    await Promise.allSettled(promises);
  }

  /**
   * Clear cache (for memory management)
   */
  clearCache() {
    this.cache.clear();
    this.optimizing.clear();
  }

  /**
   * Get cache size
   * @returns {number} - Number of cached items
   */
  getCacheSize() {
    return this.cache.size;
  }
}

export default new ImageCacheService();

