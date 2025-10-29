// API Service for NFT Marketplace
// File: src/services/api.js

import axios from 'axios';

/**
 * Get API URL - EVALUATED AT RUNTIME, NOT BUILD TIME!
 * This function is called on every request to ensure correct URL
 */
function getAPIUrl() {
  // Runtime detection (this is evaluated in the browser, not during build)
  if (typeof window === 'undefined') {
    // SSR or build time - default to proxy
    return '/api';
  }

  const hostname = window.location.hostname;
  
  // Localhost ONLY - use direct HTTP connection for development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check if environment variable explicitly says to use proxy even in localhost
    if (import.meta.env.VITE_USE_PROXY === 'true') {
      return '/api';
    }
    return 'http://147.79.78.251:5058/api';
  }
  
  // Production, Preview, or ANY deployed environment - ALWAYS use proxy
  // NEVER allow VITE_API_URL to override this in production!
  // This fixes the Mixed Content error (HTTPS → HTTP blocked by browser)
  return '/api';
}

// Create axios instance with interceptor to set baseURL at request time
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Set baseURL at request time, not at import time!
api.interceptors.request.use((config) => {
  const baseURL = getAPIUrl();
  config.baseURL = baseURL;
  
  // Log for debugging (first request only to avoid spam)
  if (!api._hasLoggedConfig) {
    console.log('🔗 API Configuration (Runtime):', {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      baseURL: baseURL,
      env: import.meta.env.VITE_API_URL || 'not set',
      mode: import.meta.env.MODE,
    });
    api._hasLoggedConfig = true;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Collections API
export const collectionsAPI = {
  // Get all collections
  getAll: async () => {
    try {
      const response = await api.get('/collections');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
    }
  },

  // Get collection by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/collections/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: null, message: error.message };
    }
  },

  // Get NFTs in a collection
  getNFTs: async (id, params = {}) => {
    try {
      const response = await api.get(`/collections/${id}/nfts`, { params });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
    }
  },

  // Get collections by owner
  getByOwner: async (ownerAddress) => {
    try {
      const response = await api.get(`/collections/owner/${ownerAddress}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
    }
  },
};

// NFTs API
export const nftsAPI = {
  // Get all listed NFTs from blockchain (LIVE DATA)
  getListed: async (params = {}) => {
    try {
      const response = await api.get('/nfts/blockchain-all', { params });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to database if blockchain fetch fails
      try {
        const fallbackResponse = await api.get('/nfts/listed', { params });
        return fallbackResponse.data;
      } catch (fallbackError) {
        return { success: false, data: [], message: error.message };
      }
    }
  },

  // Get NFT by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/nfts/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: null, message: error.message };
    }
  },

  // Get NFTs by collection
  getByCollection: async (collectionId, params = {}) => {
    try {
      const response = await api.get(`/nfts/collection/${collectionId}`, { params });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
    }
  },

  // Get NFTs by owner
  getByOwner: async (ownerAddress) => {
    try {
      const response = await api.get(`/nfts/owner/${ownerAddress}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
    }
  },

  // Get NFT activities
  getActivities: async (id) => {
    try {
      const response = await api.get(`/nfts/${id}/activities`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
    }
  },

  // Purchase NFT
  purchase: async (tokenId, purchaseData) => {
    try {
      const response = await api.post(`/nfts/${tokenId}/purchase`, purchaseData);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // List NFT for sale
  listForSale: async (tokenId, price) => {
    try {
      const response = await api.post(`/nfts/${tokenId}/list`, { price });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Delist NFT
  delist: async (tokenId) => {
    try {
      const response = await api.post(`/nfts/${tokenId}/delist`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Mint/Create NFT
  create: async (nftData) => {
    try {
      const response = await api.post('/nfts', nftData);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },
};

// Users API
export const usersAPI = {
  // Get user by wallet address
  getByAddress: async (address) => {
    const response = await api.get(`/users/${address}`);
    return response.data;
  },

  // Create user
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  update: async (address, userData) => {
    const response = await api.put(`/users/${address}`, userData);
    return response.data;
  },
};

export default api;

