/**
 * Schema Cache Refresh Trigger
 * This file exists solely to trigger a fresh deployment
 * Update the timestamp to force Vercel to redeploy and refresh Supabase schema
 */

export const SCHEMA_VERSION = {
  version: 2,
  lastUpdate: '2025-10-28T' + new Date().toISOString(),
  description: 'Fixed RLS policies - removed conflicting authenticated user policies',
  changes: [
    'Removed "Collections can be created by authenticated users" policy',
    'Removed "Collections can be updated by owner" policy', 
    'Removed "Collections are viewable by everyone" policy',
    'Kept only "collections_allow_all" permissive policy',
    'This allows anon key to insert collections'
  ]
};

// This comment line changes with each commit to force git diff
// Timestamp: 2025-10-28T23:45:00Z - Schema version 2

