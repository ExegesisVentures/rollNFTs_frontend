// API Service for NFT Marketplace
// File: src/services/api.js

import axios from 'axios';

/**
 * Get API URL - EVALUATED AT RUNTIME, NOT BUILD TIME!
 * This function is called on every request to ensure correct URL
 */
function getAPIUrl() {
  // Check if we have an environment variable override
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Runtime detection (this is evaluated in the browser, not during build)
  if (typeof window === 'undefined') {
    // SSR or build time - default to proxy
    return '/api';
  }

  const hostname = window.location.hostname;
  
  // Localhost - use direct HTTP connection
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://147.79.78.251:5058/api';
  }
  
  // Production or any deployment - use proxy
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
  // Get all listed NFTs
  getListed: async (params = {}) => {
    try {
      const response = await api.get('/nfts/listed', { params });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: [], message: error.message };
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
  getByCollection: async (collectionId) => {
    try {
      const response = await api.get(`/nfts/collection/${collectionId}`);
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

