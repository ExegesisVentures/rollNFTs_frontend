/**
 * Schema Cache Refresh Trigger
 * This file exists solely to trigger a fresh deployment
 * Update the timestamp to force Vercel to redeploy and refresh Supabase schema
 */

export const SCHEMA_VERSION = {
  version: 4,
  lastUpdate: '2025-10-28T23:55:00Z',
  description: 'Fixed class_id NOT NULL constraint - final fix',
  changes: [
    'Made class_id nullable (was blocking inserts)',
    'App uses collection_id, DB no longer requires class_id',
    'This fixes: "null value in column class_id" error',
    'Ready for production testing'
  ]
};

// This comment line changes with each commit to force git diff
// Timestamp: 2025-10-28T23:55:00Z - Schema version 4 - class_id constraint fixed


