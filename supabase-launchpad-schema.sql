-- NFT Launchpad System - Complete Database Schema
-- File: supabase-launchpad-schema.sql
-- This schema enables creators to launch NFT collections with minting through launchpad
-- NFTs are minted on-demand through the launchpad, not pre-minted in bulk

-- ============================================================================
-- LAUNCHPADS TABLE - Main launchpad configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS launchpads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Collection reference (must be created first)
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  
  -- Creator information
  creator_address TEXT NOT NULL,
  
  -- Launchpad configuration
  name TEXT NOT NULL,
  description TEXT,
  banner_image TEXT,
  
  -- Minting parameters
  mint_price NUMERIC NOT NULL CHECK (mint_price >= 0),
  mint_price_denom TEXT DEFAULT 'ucore',
  max_supply INTEGER NOT NULL CHECK (max_supply > 0),
  max_per_wallet INTEGER DEFAULT NULL, -- NULL = unlimited
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  
  -- Whitelist configuration
  is_whitelist_only BOOLEAN DEFAULT FALSE,
  whitelist_mint_limit INTEGER, -- Per wallet during whitelist phase
  whitelist_end_time TIMESTAMP, -- When public minting begins
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
  total_minted INTEGER DEFAULT 0,
  total_raised NUMERIC DEFAULT 0,
  
  -- Vetting
  is_vetted BOOLEAN DEFAULT FALSE,
  vetted_at TIMESTAMP,
  vetted_by TEXT, -- Admin wallet address
  vetting_notes TEXT,
  
  -- Metadata URLs (for reveal mechanics)
  base_uri TEXT, -- Base URI for token metadata
  placeholder_uri TEXT, -- Pre-reveal placeholder
  is_revealed BOOLEAN DEFAULT FALSE,
  revealed_at TIMESTAMP,
  
  -- Cancellation tracking
  cancelled_at TIMESTAMP,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  
  -- Remaining NFT actions after cancellation
  post_cancel_action TEXT CHECK (post_cancel_action IN ('mint_remaining', 'burn_remaining', 'none')),
  post_cancel_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_launchpads_collection ON launchpads(collection_id);
CREATE INDEX IF NOT EXISTS idx_launchpads_class_id ON launchpads(class_id);
CREATE INDEX IF NOT EXISTS idx_launchpads_creator ON launchpads(creator_address);
CREATE INDEX IF NOT EXISTS idx_launchpads_status ON launchpads(status, start_time);
CREATE INDEX IF NOT EXISTS idx_launchpads_vetted ON launchpads(is_vetted);
CREATE INDEX IF NOT EXISTS idx_launchpads_active ON launchpads(status, start_time, end_time) WHERE status = 'active';

-- ============================================================================
-- LAUNCHPAD_MINTS TABLE - Track individual mints through launchpad
-- ============================================================================
CREATE TABLE IF NOT EXISTS launchpad_mints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  launchpad_id UUID REFERENCES launchpads(id) ON DELETE CASCADE,
  
  -- Mint details
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  token_id TEXT NOT NULL,
  minter_address TEXT NOT NULL,
  
  -- Payment details
  mint_price NUMERIC NOT NULL,
  mint_price_denom TEXT NOT NULL,
  
  -- Whitelist tracking
  was_whitelist_mint BOOLEAN DEFAULT FALSE,
  
  -- Transaction details
  tx_hash TEXT NOT NULL,
  block_height BIGINT,
  
  -- Metadata
  metadata_uri TEXT,
  token_name TEXT,
  token_attributes JSONB,
  
  minted_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_launchpad_mints_launchpad ON launchpad_mints(launchpad_id, minted_at DESC);
CREATE INDEX IF NOT EXISTS idx_launchpad_mints_minter ON launchpad_mints(minter_address, minted_at DESC);
CREATE INDEX IF NOT EXISTS idx_launchpad_mints_nft ON launchpad_mints(nft_id);
CREATE INDEX IF NOT EXISTS idx_launchpad_mints_tx ON launchpad_mints(tx_hash);

-- ============================================================================
-- LAUNCHPAD_WHITELIST TABLE - Whitelist addresses for launchpads
-- ============================================================================
CREATE TABLE IF NOT EXISTS launchpad_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  launchpad_id UUID REFERENCES launchpads(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Allocation
  max_mints INTEGER DEFAULT 1,
  mints_used INTEGER DEFAULT 0,
  
  -- Tracking
  added_by TEXT, -- Admin or creator wallet
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(launchpad_id, wallet_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_launchpad_whitelist_launchpad ON launchpad_whitelist(launchpad_id);
CREATE INDEX IF NOT EXISTS idx_launchpad_whitelist_wallet ON launchpad_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_launchpad_whitelist_available ON launchpad_whitelist(launchpad_id, wallet_address) WHERE mints_used < max_mints;

-- ============================================================================
-- LAUNCHPAD_VETTING_APPLICATIONS TABLE - Applications for "Vetted" badge
-- ============================================================================
CREATE TABLE IF NOT EXISTS launchpad_vetting_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  launchpad_id UUID REFERENCES launchpads(id) ON DELETE CASCADE,
  applicant_address TEXT NOT NULL,
  
  -- Application data
  project_name TEXT NOT NULL,
  project_description TEXT NOT NULL,
  team_info TEXT,
  
  -- Social verification
  website_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  telegram_url TEXT,
  
  -- Project details
  roadmap TEXT,
  utility_description TEXT,
  art_samples JSONB, -- Array of image URLs
  team_background TEXT,
  
  -- Legal/Compliance
  kyc_completed BOOLEAN DEFAULT FALSE,
  kyc_provider TEXT,
  terms_accepted BOOLEAN DEFAULT TRUE,
  
  -- Proof of ownership
  signature_proof TEXT, -- Signed message proving wallet ownership
  verification_documents JSONB, -- Array of document URLs
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'requires_changes')),
  
  -- Admin review
  reviewed_by TEXT, -- Admin wallet address
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Resubmission tracking
  resubmission_count INTEGER DEFAULT 0,
  original_application_id UUID REFERENCES launchpad_vetting_applications(id),
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vetting_apps_launchpad ON launchpad_vetting_applications(launchpad_id);
CREATE INDEX IF NOT EXISTS idx_vetting_apps_applicant ON launchpad_vetting_applications(applicant_address);
CREATE INDEX IF NOT EXISTS idx_vetting_apps_status ON launchpad_vetting_applications(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_vetting_apps_pending ON launchpad_vetting_applications(status, submitted_at) WHERE status IN ('pending', 'under_review');

-- ============================================================================
-- LAUNCHPAD_ANALYTICS TABLE - Track launchpad performance metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS launchpad_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  launchpad_id UUID REFERENCES launchpads(id) ON DELETE CASCADE,
  
  -- Time period
  date DATE NOT NULL,
  hour INTEGER, -- NULL for daily aggregates, 0-23 for hourly
  
  -- Metrics
  unique_minters INTEGER DEFAULT 0,
  total_mints INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_mint_price NUMERIC DEFAULT 0,
  
  -- Engagement
  page_views INTEGER DEFAULT 0,
  wallet_connects INTEGER DEFAULT 0,
  failed_mints INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(launchpad_id, date, hour)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_launchpad_analytics_launchpad ON launchpad_analytics(launchpad_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_launchpad_analytics_date ON launchpad_analytics(date);

-- ============================================================================
-- TRIGGERS - Auto-update timestamps and related data
-- ============================================================================

-- Update launchpads.updated_at on any change
CREATE OR REPLACE FUNCTION update_launchpad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_launchpad_timestamp
BEFORE UPDATE ON launchpads
FOR EACH ROW
EXECUTE FUNCTION update_launchpad_updated_at();

-- Auto-increment total_minted when new mint occurs
CREATE OR REPLACE FUNCTION increment_launchpad_minted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE launchpads 
  SET 
    total_minted = total_minted + 1,
    total_raised = total_raised + NEW.mint_price,
    updated_at = NOW()
  WHERE id = NEW.launchpad_id;
  
  -- Check if launchpad is complete
  UPDATE launchpads
  SET status = 'completed'
  WHERE id = NEW.launchpad_id 
    AND total_minted >= max_supply
    AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_launchpad_minted
AFTER INSERT ON launchpad_mints
FOR EACH ROW
EXECUTE FUNCTION increment_launchpad_minted();

-- Auto-increment whitelist mints_used
CREATE OR REPLACE FUNCTION increment_whitelist_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.was_whitelist_mint THEN
    UPDATE launchpad_whitelist
    SET mints_used = mints_used + 1
    WHERE launchpad_id = NEW.launchpad_id 
      AND wallet_address = NEW.minter_address;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_whitelist_used
AFTER INSERT ON launchpad_mints
FOR EACH ROW
EXECUTE FUNCTION increment_whitelist_used();

-- Auto-update vetting application timestamp
CREATE OR REPLACE FUNCTION update_vetting_app_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vetting_app_timestamp
BEFORE UPDATE ON launchpad_vetting_applications
FOR EACH ROW
EXECUTE FUNCTION update_vetting_app_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE launchpads ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_mints ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_vetting_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_analytics ENABLE ROW LEVEL SECURITY;

-- Launchpads: Public read, creators can manage their own
CREATE POLICY "Launchpads are viewable by everyone" 
  ON launchpads FOR SELECT 
  USING (true);

CREATE POLICY "Creators can insert their own launchpads" 
  ON launchpads FOR INSERT 
  WITH CHECK (auth.uid()::text = creator_address OR auth.role() = 'service_role');

CREATE POLICY "Creators can update their own launchpads" 
  ON launchpads FOR UPDATE 
  USING (auth.uid()::text = creator_address OR auth.role() = 'service_role');

CREATE POLICY "Creators can delete their own launchpads" 
  ON launchpads FOR DELETE 
  USING (auth.uid()::text = creator_address OR auth.role() = 'service_role');

-- Launchpad mints: Public read, service role can insert
CREATE POLICY "Launchpad mints are viewable by everyone" 
  ON launchpad_mints FOR SELECT 
  USING (true);

CREATE POLICY "Service can insert launchpad mints" 
  ON launchpad_mints FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Whitelist: Launchpad creators can manage their whitelist
CREATE POLICY "Whitelist viewable by everyone" 
  ON launchpad_whitelist FOR SELECT 
  USING (true);

CREATE POLICY "Creators can manage their whitelist" 
  ON launchpad_whitelist FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM launchpads 
      WHERE launchpads.id = launchpad_whitelist.launchpad_id 
        AND launchpads.creator_address = auth.uid()::text
    )
    OR auth.role() = 'service_role'
  );

-- Vetting applications: Applicants can view their own, admins can view all
CREATE POLICY "Users can view their own vetting applications" 
  ON launchpad_vetting_applications FOR SELECT 
  USING (applicant_address = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can submit vetting applications" 
  ON launchpad_vetting_applications FOR INSERT 
  WITH CHECK (applicant_address = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their pending applications" 
  ON launchpad_vetting_applications FOR UPDATE 
  USING (
    applicant_address = auth.uid()::text AND status IN ('pending', 'requires_changes')
    OR auth.role() = 'service_role'
  );

-- Analytics: Public read, service role can write
CREATE POLICY "Analytics are viewable by everyone" 
  ON launchpad_analytics FOR SELECT 
  USING (true);

CREATE POLICY "Service can manage analytics" 
  ON launchpad_analytics FOR ALL 
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER VIEWS - For easy querying
-- ============================================================================

-- View: Active launchpads with stats
CREATE OR REPLACE VIEW active_launchpads_view AS
SELECT 
  l.*,
  c.name as collection_name,
  c.symbol as collection_symbol,
  c.cover_image as collection_image,
  c.verified as collection_verified,
  COALESCE(l.total_minted, 0) as minted_count,
  l.max_supply - COALESCE(l.total_minted, 0) as remaining_supply,
  ROUND((COALESCE(l.total_minted, 0)::NUMERIC / l.max_supply * 100), 2) as mint_percentage
FROM launchpads l
JOIN collections c ON l.collection_id = c.id
WHERE l.status = 'active'
  AND l.start_time <= NOW()
  AND (l.end_time IS NULL OR l.end_time > NOW())
ORDER BY l.is_vetted DESC, l.created_at DESC;

-- View: Launchpad leaderboard
CREATE OR REPLACE VIEW launchpad_leaderboard_view AS
SELECT 
  l.id,
  l.name,
  l.class_id,
  l.creator_address,
  l.is_vetted,
  l.total_minted,
  l.total_raised,
  l.max_supply,
  COUNT(DISTINCT lm.minter_address) as unique_minters,
  ROUND((l.total_minted::NUMERIC / l.max_supply * 100), 2) as completion_percentage,
  c.name as collection_name,
  c.cover_image
FROM launchpads l
LEFT JOIN launchpad_mints lm ON l.id = lm.launchpad_id
LEFT JOIN collections c ON l.collection_id = c.id
WHERE l.status IN ('active', 'completed')
GROUP BY l.id, c.name, c.cover_image
ORDER BY l.total_raised DESC, l.total_minted DESC;

-- View: User's launchpad participation
CREATE OR REPLACE VIEW user_launchpad_participation_view AS
SELECT 
  lm.minter_address,
  l.id as launchpad_id,
  l.name as launchpad_name,
  l.class_id,
  COUNT(*) as mints_count,
  SUM(lm.mint_price) as total_spent,
  MIN(lm.minted_at) as first_mint_at,
  MAX(lm.minted_at) as last_mint_at,
  c.name as collection_name,
  c.cover_image
FROM launchpad_mints lm
JOIN launchpads l ON lm.launchpad_id = l.id
JOIN collections c ON l.collection_id = c.id
GROUP BY lm.minter_address, l.id, l.name, l.class_id, c.name, c.cover_image;

-- ============================================================================
-- COMMENTS - Documentation for tables and columns
-- ============================================================================

COMMENT ON TABLE launchpads IS 'Main launchpad configurations - NFTs are minted on-demand through the launchpad';
COMMENT ON COLUMN launchpads.is_vetted IS 'Whether this launchpad has been approved and receives the "Vetted" badge';
COMMENT ON COLUMN launchpads.post_cancel_action IS 'What happens to remaining NFTs after cancellation: mint to creator, burn, or do nothing';
COMMENT ON COLUMN launchpads.max_per_wallet IS 'Maximum NFTs a single wallet can mint (NULL = unlimited)';
COMMENT ON COLUMN launchpads.whitelist_end_time IS 'When whitelist phase ends and public minting begins';

COMMENT ON TABLE launchpad_mints IS 'Individual mints through the launchpad - tracks each NFT minted';
COMMENT ON COLUMN launchpad_mints.was_whitelist_mint IS 'Whether this mint occurred during whitelist phase';

COMMENT ON TABLE launchpad_whitelist IS 'Whitelisted addresses for launchpads with whitelist-only or early access phases';

COMMENT ON TABLE launchpad_vetting_applications IS 'Applications from creators to receive "Vetted" badge for their launchpad';
COMMENT ON COLUMN launchpad_vetting_applications.kyc_completed IS 'Whether creator has completed KYC verification';

COMMENT ON TABLE launchpad_analytics IS 'Performance metrics and analytics for launchpads';

