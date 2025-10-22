// API Service for NFT Marketplace
// File: src/services/api.js

import axios from 'axios';

// Use relative path for Vercel proxy (HTTPS), fallback to direct HTTP for local dev
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '/api' : 'http://147.79.78.251:5058/api'
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

