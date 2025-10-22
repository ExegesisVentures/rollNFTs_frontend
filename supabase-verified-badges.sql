-- Verified Badge System Schema
-- File: supabase-verified-badges.sql
-- Add this to your Supabase SQL editor

-- Verified Badges Table
CREATE TABLE IF NOT EXISTS verified_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('collection', 'user')),
  entity_id TEXT NOT NULL, -- collection_id or wallet_address
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT, -- Admin wallet address
  badge_level TEXT CHECK (badge_level IN ('standard', 'premium', 'official')),
  verification_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

-- Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('collection', 'user')),
  entity_id TEXT NOT NULL,
  requester_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_badge_level TEXT DEFAULT 'standard',
  supporting_info JSONB DEFAULT '{}', -- Social links, website, etc.
  admin_notes TEXT,
  reviewed_by TEXT, -- Admin wallet address
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk Transfer Jobs Table (if not exists)
CREATE TABLE IF NOT EXISTS bulk_transfer_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  total_items INTEGER NOT NULL,
  completed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  service_fee TEXT NOT NULL, -- In ucore
  estimated_gas TEXT NOT NULL, -- In ucore
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk Transfer Items Table (if not exists)
CREATE TABLE IF NOT EXISTS bulk_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES bulk_transfer_jobs(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  transferred_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verified_badges_entity ON verified_badges(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verified_badges_verified ON verified_badges(verified);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_entity ON verification_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_bulk_transfer_jobs_user ON bulk_transfer_jobs(user_address);
CREATE INDEX IF NOT EXISTS idx_bulk_transfer_items_job ON bulk_transfer_items(job_id);

-- Enable Row Level Security
ALTER TABLE verified_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_transfer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_transfer_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Verified Badges (Read-only for public)
CREATE POLICY "Anyone can view verified badges"
  ON verified_badges FOR SELECT
  USING (true);

-- RLS Policies for Verification Requests
CREATE POLICY "Users can view their own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Bulk Operations
CREATE POLICY "Users can view their own bulk transfer jobs"
  ON bulk_transfer_jobs FOR SELECT
  USING (true); -- Or use auth if you add user authentication

CREATE POLICY "Users can create bulk transfer jobs"
  ON bulk_transfer_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view bulk transfer items"
  ON bulk_transfer_items FOR SELECT
  USING (true);

CREATE POLICY "Users can create bulk transfer items"
  ON bulk_transfer_items FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_verified_badges_updated_at
    BEFORE UPDATE ON verified_badges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Admin list (you can add your admin addresses here)
-- This is a simple approach - for production, use a proper admin table
COMMENT ON TABLE verified_badges IS 'Admin addresses: core1wxgp4edry80allxrm20s5yq67wt7jcejj3w29l';

