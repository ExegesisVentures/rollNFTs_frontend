-- Free Spin System Schema
-- This schema handles 3D spin wheel campaigns, whitelists, and prize distribution

-- Free Spin Campaigns Table
CREATE TABLE IF NOT EXISTS free_spin_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campaign status
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  
  -- Spin configuration
  total_spins INTEGER DEFAULT 0,
  spins_per_wallet INTEGER DEFAULT 1,
  require_whitelist BOOLEAN DEFAULT false,
  
  -- Prize configuration (JSONB for flexibility)
  prizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"type": "nft", "nft_id": "uuid", "probability": 0.1, "quantity": 10},
  --   {"type": "nft", "nft_id": "uuid", "probability": 0.2, "quantity": 20},
  --   {"type": "message", "text": "Better luck next time!", "probability": 0.7}
  -- ]
  
  -- Visual customization
  wheel_config JSONB DEFAULT '{}'::jsonb,
  -- Example: {"colors": ["#FF6B6B", "#4ECDC4"], "segments": 8}
  
  -- Tracking
  total_spins_used INTEGER DEFAULT 0,
  total_prizes_claimed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT valid_spins CHECK (spins_per_wallet > 0)
);

-- Whitelist for spin campaigns
CREATE TABLE IF NOT EXISTS free_spin_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES free_spin_campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Spin allowance
  spins_allowed INTEGER DEFAULT 1,
  spins_used INTEGER DEFAULT 0,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_campaign_wallet UNIQUE(campaign_id, wallet_address),
  CONSTRAINT valid_spin_count CHECK (spins_used <= spins_allowed)
);

-- Spin history and results
CREATE TABLE IF NOT EXISTS free_spin_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES free_spin_campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Prize information
  prize_type TEXT NOT NULL, -- 'nft', 'message', 'token'
  prize_data JSONB NOT NULL,
  -- Example for NFT: {"nft_id": "uuid", "token_id": "123", "tx_hash": "..."}
  -- Example for message: {"text": "Better luck next time!"}
  
  -- Transaction status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  tx_hash TEXT,
  error_message TEXT,
  
  -- Timestamps
  spun_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Prevent manipulation
  spin_result_hash TEXT, -- Server-generated hash to verify result
  
  CONSTRAINT valid_prize_type CHECK (prize_type IN ('nft', 'message', 'token'))
);

-- Prize inventory tracking
CREATE TABLE IF NOT EXISTS free_spin_prize_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES free_spin_campaigns(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
  
  -- Inventory status
  status TEXT DEFAULT 'available', -- 'available', 'claimed', 'reserved'
  reserved_by TEXT, -- wallet_address if reserved
  reserved_at TIMESTAMPTZ,
  claimed_by TEXT, -- wallet_address who claimed
  claimed_at TIMESTAMPTZ,
  
  -- Link to spin history
  spin_history_id UUID REFERENCES free_spin_history(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_inventory_status CHECK (status IN ('available', 'claimed', 'reserved'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_collection ON free_spin_campaigns(collection_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON free_spin_campaigns(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_whitelist_campaign ON free_spin_whitelist(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whitelist_wallet ON free_spin_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_lookup ON free_spin_whitelist(campaign_id, wallet_address);
CREATE INDEX IF NOT EXISTS idx_history_campaign ON free_spin_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_history_wallet ON free_spin_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_history_status ON free_spin_history(status);
CREATE INDEX IF NOT EXISTS idx_inventory_campaign ON free_spin_prize_inventory(campaign_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON free_spin_prize_inventory(status) WHERE status = 'available';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_free_spin_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_free_spin_campaign_updated_at
  BEFORE UPDATE ON free_spin_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_free_spin_campaign_updated_at();

-- Function to check and update spin allowance (atomic operation)
CREATE OR REPLACE FUNCTION check_and_use_spin(
  p_campaign_id UUID,
  p_wallet_address TEXT
)
RETURNS TABLE(can_spin BOOLEAN, spins_remaining INTEGER, error_message TEXT) AS $$
DECLARE
  v_campaign RECORD;
  v_whitelist RECORD;
  v_spins_used INTEGER;
BEGIN
  -- Lock campaign row for update
  SELECT * INTO v_campaign
  FROM free_spin_campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;
  
  -- Check if campaign exists and is active
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Campaign not found';
    RETURN;
  END IF;
  
  IF NOT v_campaign.active THEN
    RETURN QUERY SELECT false, 0, 'Campaign is not active';
    RETURN;
  END IF;
  
  -- Check end date
  IF v_campaign.end_date IS NOT NULL AND v_campaign.end_date < NOW() THEN
    RETURN QUERY SELECT false, 0, 'Campaign has ended';
    RETURN;
  END IF;
  
  -- Check if whitelist is required
  IF v_campaign.require_whitelist THEN
    SELECT * INTO v_whitelist
    FROM free_spin_whitelist
    WHERE campaign_id = p_campaign_id AND wallet_address = p_wallet_address
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 0, 'Wallet not whitelisted';
      RETURN;
    END IF;
    
    IF v_whitelist.spins_used >= v_whitelist.spins_allowed THEN
      RETURN QUERY SELECT false, 0, 'No spins remaining';
      RETURN;
    END IF;
    
    -- Update whitelist spins
    UPDATE free_spin_whitelist
    SET spins_used = spins_used + 1
    WHERE id = v_whitelist.id;
    
    RETURN QUERY SELECT true, (v_whitelist.spins_allowed - v_whitelist.spins_used - 1), NULL::TEXT;
  ELSE
    -- Count spins used by this wallet
    SELECT COUNT(*) INTO v_spins_used
    FROM free_spin_history
    WHERE campaign_id = p_campaign_id AND wallet_address = p_wallet_address;
    
    IF v_spins_used >= v_campaign.spins_per_wallet THEN
      RETURN QUERY SELECT false, 0, 'No spins remaining';
      RETURN;
    END IF;
    
    RETURN QUERY SELECT true, (v_campaign.spins_per_wallet - v_spins_used - 1), NULL::TEXT;
  END IF;
  
  -- Update campaign stats
  UPDATE free_spin_campaigns
  SET total_spins_used = total_spins_used + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve a prize (atomic operation)
CREATE OR REPLACE FUNCTION reserve_prize(
  p_campaign_id UUID,
  p_wallet_address TEXT,
  p_nft_id UUID
)
RETURNS TABLE(success BOOLEAN, inventory_id UUID, error_message TEXT) AS $$
DECLARE
  v_inventory_id UUID;
BEGIN
  -- Lock and get available prize
  SELECT id INTO v_inventory_id
  FROM free_spin_prize_inventory
  WHERE campaign_id = p_campaign_id
    AND nft_id = p_nft_id
    AND status = 'available'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 'No prizes available';
    RETURN;
  END IF;
  
  -- Reserve the prize
  UPDATE free_spin_prize_inventory
  SET 
    status = 'reserved',
    reserved_by = p_wallet_address,
    reserved_at = NOW()
  WHERE id = v_inventory_id;
  
  RETURN QUERY SELECT true, v_inventory_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (adjust based on your security needs)
ALTER TABLE free_spin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_spin_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_spin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_spin_prize_inventory ENABLE ROW LEVEL SECURITY;

-- Allow public to read active campaigns
CREATE POLICY "Public can view active campaigns" ON free_spin_campaigns
  FOR SELECT USING (active = true);

-- Allow users to view their own whitelist status
CREATE POLICY "Users can view own whitelist" ON free_spin_whitelist
  FOR SELECT USING (true);

-- Allow users to view their own history
CREATE POLICY "Users can view own history" ON free_spin_history
  FOR SELECT USING (true);

-- Admin policies (you'll need to adjust based on your admin setup)
-- CREATE POLICY "Admins can manage campaigns" ON free_spin_campaigns
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE free_spin_campaigns IS 'Stores 3D spin wheel campaign configurations';
COMMENT ON TABLE free_spin_whitelist IS 'Manages wallet whitelist for spin campaigns';
COMMENT ON TABLE free_spin_history IS 'Records all spin attempts and results';
COMMENT ON TABLE free_spin_prize_inventory IS 'Tracks prize NFT availability and distribution';

