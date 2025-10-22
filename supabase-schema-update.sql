-- Roll NFT Marketplace - Supabase Schema Update
-- Run this in Supabase SQL Editor
-- Date: October 22, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Listings table (for marketplace)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_token_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  pay_with_roll BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_listings_collection ON listings(collection_id);

-- Sales table (transaction history)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_token_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  creator_royalty NUMERIC NOT NULL,
  roll_burned NUMERIC DEFAULT 0,
  tx_hash TEXT NOT NULL,
  sold_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(seller_address, sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales(buyer_address, sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_collection ON sales(collection_id, sold_at DESC);

-- Image cache table
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ipfs_hash TEXT UNIQUE NOT NULL,
  original_url TEXT,
  thumb_url TEXT,
  medium_url TEXT,
  large_url TEXT,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  format TEXT,
  cached_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_cache_ipfs ON image_cache(ipfs_hash);

-- Premium services tracking
CREATE TABLE IF NOT EXISTS premium_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('bulk_mint', 'bulk_transfer', 'featured_collection', 'verified_badge')),
  collection_id TEXT,
  item_count INTEGER,
  fee_paid NUMERIC NOT NULL,
  paid_with_roll BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tx_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_services_user ON premium_services(user_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_premium_services_type ON premium_services(service_type, status);

-- Update collections table with new fields
ALTER TABLE collections ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS royalty_bps INTEGER DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS royalty_recipient TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS total_volume NUMERIC DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS floor_price NUMERIC;

-- VPS backup logs
CREATE TABLE IF NOT EXISTS vps_backup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create storage bucket for NFT images (run in Supabase Storage UI or via SQL)
-- Manual step: Create bucket 'nft-images' with public access in Supabase Dashboard

-- Insert test data (optional)
INSERT INTO listings (nft_token_id, collection_id, seller_address, price, pay_with_roll)
VALUES 
  ('test_nft_001', 'test_collection', 'core1test...', 100.00, false)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Roll NFT Marketplace schema update completed successfully!';
  RAISE NOTICE 'Tables created: listings, sales, image_cache, premium_services, vps_backup_logs';
  RAISE NOTICE 'Collections table updated with new columns';
  RAISE NOTICE 'Next step: Create nft-images storage bucket in Supabase Dashboard';
END $$;

