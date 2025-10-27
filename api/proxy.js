// Vercel Serverless Function to proxy API requests
// File: api/proxy.js
// This proxies requests from HTTPS frontend to HTTP backend securely

const axios = require('axios');

const API_BASE_URL = process.env.BACKEND_API_URL || 'http://147.79.78.251:5058/api';

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // Get the path after /api/
  // req.url will be like "/collections" or "/nfts/listed"
  const path = req.url.replace(/^\/?/, ''); // Remove leading slash if present
  
  // Build the target URL
  const targetUrl = `${API_BASE_URL}/${path}`;
  
  // Log for debugging (will appear in Vercel logs)
  console.log(`🔄 Proxying ${req.method} ${path} -> ${targetUrl}`);
  
  try {
    // Forward the request to the backend
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        // Forward any authorization headers
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      // Don't pass query params separately - they're already in req.url
      // Increase timeout for long-running requests
      timeout: 30000,
      // Don't throw on error status codes - we'll handle them
      validateStatus: () => true,
    });
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Log response status
    console.log(`✅ Proxy response: ${response.status}`);
    
    // Return the response
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ Proxy error:', {
      message: error.message,
      code: error.code,
      url: targetUrl,
    });
    
    // Set CORS headers even on error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Return error response
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
      error: error.code || 'PROXY_ERROR',
      data: error.response?.data || null,
    });
  }
};

