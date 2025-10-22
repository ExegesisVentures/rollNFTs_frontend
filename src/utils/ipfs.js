// IPFS Utilities
// File: src/utils/ipfs.js

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

/**
 * Convert IPFS URI to HTTP URL
 * @param {string} uri - IPFS URI (ipfs://...)
 * @returns {string} HTTP URL
 */
export const ipfsToHttp = (uri) => {
  if (!uri) return '';
  
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAY}${hash}`;
  }
  
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `${IPFS_GATEWAY}${uri}`;
  }
  
  return uri;
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
  
  return uri;
};

/**
 * Check if URI is IPFS
 * @param {string} uri - URI to check
 * @returns {boolean}
 */
export const isIpfsUri = (uri) => {
  if (!uri) return false;
  return uri.startsWith('ipfs://') || uri.startsWith('Qm') || uri.startsWith('bafy');
};



