-- Update Collections Table for Features
-- File: supabase-collections-update.sql
-- Add feature tracking columns

-- Add feature columns to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS features_burning BOOLEAN DEFAULT true;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS features_freezing BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS features_whitelisting BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS features_disable_sending BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS royalty_rate TEXT DEFAULT '0';

-- Add indexes for feature queries
CREATE INDEX IF NOT EXISTS idx_collections_features_burning ON collections(features_burning);
CREATE INDEX IF NOT EXISTS idx_collections_creator ON collections(creator_address);

-- Add comments for documentation
COMMENT ON COLUMN collections.features_burning IS 'Allows NFT holders to burn their tokens';
COMMENT ON COLUMN collections.features_freezing IS 'Allows issuer to freeze/unfreeze NFTs';
COMMENT ON COLUMN collections.features_whitelisting IS 'Restricts who can hold NFTs from this collection';
COMMENT ON COLUMN collections.features_disable_sending IS 'Makes NFTs non-transferable (soulbound)';
COMMENT ON COLUMN collections.royalty_rate IS 'Creator royalty in basis points (e.g., "1000" = 10%)';

