// Vercel Serverless Function to proxy API requests
// File: api/proxy.js
// This proxies requests from HTTPS frontend to HTTP backend securely

import axios from 'axios';

const API_BASE_URL = 'http://147.79.78.251:5058/api';

export default async function handler(req, res) {
  // Get the path after /api/
  const path = req.url.replace('/api/', '');
  
  // Build the target URL
  const targetUrl = `${API_BASE_URL}/${path}`;
  
  try {
    // Forward the request to the backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      params: req.query,
    });
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the response
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // Return error response
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
      data: error.response?.data || null,
    });
  }
}

