// API Endpoint: Get User Profile by Address
// File: api/users/[address].js
// Vercel Serverless Function

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'User address is required'
      });
    }

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', address)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found - return default profile
        return res.status(200).json({
          success: true,
          data: {
            wallet_address: address,
            username: null,
            bio: null,
            avatar_url: null,
            banner_url: null,
            twitter: null,
            website: null,
            created_at: new Date().toISOString()
          }
        });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    // Cache for 2 minutes (profile data can change)
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

