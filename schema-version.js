/**
 * Schema Cache Refresh Trigger
 * This file exists solely to trigger a fresh deployment
 * Update the timestamp to force Vercel to redeploy and refresh Supabase schema
 */

export const SCHEMA_VERSION = {
  version: 3,
  lastUpdate: '2025-10-28T23:50:00Z',
  description: 'RLS policies cleaned - only permissive policy remains',
  changes: [
    'Confirmed only "collections_allow_all" policy active',
    'All conflicting authenticated user policies removed',
    'This allows anon key to insert collections successfully'
  ]
};

// This comment line changes with each commit to force git diff
// Timestamp: 2025-10-28T23:50:00Z - Schema version 3 - Ready for production


