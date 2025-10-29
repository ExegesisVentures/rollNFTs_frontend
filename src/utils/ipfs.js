// IPFS Utilities with Multiple Gateways and Optimization
// File: src/utils/ipfs.js

// Multiple IPFS gateways for failover and load balancing
// Rotating through different gateways to avoid rate limits
const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/', // Cloudflare (most reliable, high limits)
  'https://ipfs.io/ipfs/', // Official IPFS gateway
  'https://dweb.link/ipfs/', // Protocol Labs gateway
  'https://gateway.ipfs.io/ipfs/', // Alternative official gateway
  'https://w3s.link/ipfs/', // Web3.Storage gateway
  'https://nftstorage.link/ipfs/', // NFT.Storage gateway (NFT-focused)
  'https://gateway.pinata.cloud/ipfs/', // Pinata (but rate limited)
];

// Use Cloudflare as primary gateway (most reliable, highest rate limits)
const envGateway = import.meta.env.VITE_IPFS_GATEWAY;
const PRIMARY_GATEWAY = envGateway || IPFS_GATEWAYS[0]; // Default to Cloudflare

// Gateway rotation index for load balancing
let currentGatewayIndex = 0;

// Get next gateway in rotation (load balancing)
export const getNextGateway = () => {
  currentGatewayIndex = (currentGatewayIndex + 1) % IPFS_GATEWAYS.length;
  return IPFS_GATEWAYS[currentGatewayIndex];
};

/**
 * Convert IPFS URI to HTTP URL with rotating gateway (load balancing)
 * @param {string} uri - IPFS URI (ipfs://...)
 * @returns {string} HTTP URL
 */
export const ipfsToHttp = (uri) => {
  if (!uri) return '';
  
  // Use rotating gateway to distribute load and avoid rate limits
  const gateway = getNextGateway();
  
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    const result = `${gateway}${hash}`;
    // Reduced console logging to avoid spam
    if (Math.random() < 0.1) { // Only log 10% of conversions
      console.log(`🔗 IPFS: ${hash.slice(0, 15)}... -> ${gateway.split('/')[2]}`);
    }
    return result;
  }
  
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    const result = `${gateway}${uri}`;
    return result;
  }
  
  // If it's already an HTTP URL, return as is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  return uri;
};

/**
 * Convert IPFS URI to HTTP URL with automatic failover
 * @param {string} uri - IPFS URI (ipfs://...)
 * @param {number} fallbackIndex - Which gateway to try (0 = primary)
 * @returns {string} HTTP URL
 */
export const ipfsToHttpWithFallback = (uri, fallbackIndex = 0) => {
  if (!uri) return '';
  
  const hash = getIpfsHash(uri);
  if (!hash) return uri;
  
  // Use specified gateway or primary
  const gateway = IPFS_GATEWAYS[fallbackIndex] || IPFS_GATEWAYS[0];
  return `${gateway}${hash}`;
};

/**
 * Get multiple gateway URLs for failover
 * @param {string} uri - IPFS URI
 * @returns {string[]} Array of gateway URLs
 */
export const getIpfsGatewayUrls = (uri) => {
  if (!uri) return [];
  
  const hash = getIpfsHash(uri);
  if (!hash) return [];
  
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
};

/**
 * Extract IPFS hash from URI
 * @param {string} uri - IPFS URI
 * @returns {string} IPFS hash
 */
export const getIpfsHash = (uri) => {
  if (!uri) return '';
  
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', '');
  }
  
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return uri;
  }
  
  // Try to extract hash from HTTP URL
  const ipfsMatch = uri.match(/\/ipfs\/([^/?#]+)/);
  if (ipfsMatch) {
    return ipfsMatch[1];
  }
  
  return uri;
};

/**
 * Check if URI is IPFS
 * @param {string} uri - URI to check
 * @returns {boolean}
 */
export const isIpfsUri = (uri) => {
  if (!uri) return false;
  return uri.startsWith('ipfs://') || 
         uri.startsWith('Qm') || 
         uri.startsWith('bafy') ||
         uri.includes('/ipfs/');
};

/**
 * Preload image from IPFS with fallback gateways
 * Returns a promise that resolves with the successful URL
 * @param {string} uri - IPFS URI
 * @returns {Promise<string>} Successful image URL
 */
export const preloadIpfsImage = (uri) => {
  return new Promise((resolve, reject) => {
    const urls = getIpfsGatewayUrls(uri);
    if (urls.length === 0) {
      reject(new Error('Invalid IPFS URI'));
      return;
    }

    let loadedUrl = null;
    let attempts = 0;

    const tryNextGateway = (index) => {
      if (index >= urls.length) {
        reject(new Error('All gateways failed'));
        return;
      }

      const img = new Image();
      const timeout = setTimeout(() => {
        attempts++;
        tryNextGateway(index + 1);
      }, 5000); // 5 second timeout per gateway

      img.onload = () => {
        clearTimeout(timeout);
        loadedUrl = urls[index];
        resolve(loadedUrl);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        attempts++;
        tryNextGateway(index + 1);
      };

      img.src = urls[index];
    };

    tryNextGateway(0);
  });
};

/**
 * Get optimized image size parameter (if supported by gateway)
 * @param {string} uri - IPFS URI
 * @param {object} options - Size options
 * @returns {string} Optimized URL
 */
export const getOptimizedIpfsUrl = (uri, options = {}) => {
  const { width, height, quality = 85 } = options;
  const baseUrl = ipfsToHttp(uri);
  
  // Pinata supports image optimization via query params
  if (baseUrl.includes('pinata.cloud')) {
    const params = new URLSearchParams();
    if (width) params.append('img-width', width);
    if (height) params.append('img-height', height);
    if (quality) params.append('img-quality', quality);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
  
  // For other gateways, return the base URL
  return baseUrl;
};



