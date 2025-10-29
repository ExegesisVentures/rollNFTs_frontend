-- ============================================================================
-- CLEAN UP CONFLICTING RLS POLICIES
-- Run this to remove old restrictive policies and keep only permissive ones
-- ============================================================================

-- ===========================================================================
-- Drop old restrictive policies on NFTs table
-- ===========================================================================

DROP POLICY IF EXISTS "NFTs are viewable by everyone" ON nfts;
DROP POLICY IF EXISTS "NFTs can be created by authenticated users" ON nfts;
DROP POLICY IF EXISTS "NFTs can be updated by owner" ON nfts;
DROP POLICY IF EXISTS "NFTs can be deleted by owner" ON nfts;

-- Keep only the permissive policy
-- (nfts_allow_all should already exist from previous SQL)

-- Verify the policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'nfts' AND policyname = 'nfts_allow_all'
  ) THEN
    -- Create it if it doesn't exist
    CREATE POLICY "nfts_allow_all" ON nfts
      FOR ALL 
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ===========================================================================
-- Success message
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     ✅ CONFLICTING POLICIES REMOVED ✅                 ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Removed old restrictive policies:';
  RAISE NOTICE '   - NFTs are viewable by everyone (SELECT)';
  RAISE NOTICE '   - NFTs can be created by authenticated users (INSERT)';
  RAISE NOTICE '   - NFTs can be updated by owner (UPDATE)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Kept permissive policy:';
  RAISE NOTICE '   - nfts_allow_all (ALL operations)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Run this to verify:';
  RAISE NOTICE '   SELECT tablename, policyname, cmd';
  RAISE NOTICE '   FROM pg_policies';
  RAISE NOTICE '   WHERE tablename = ''nfts'';';
  RAISE NOTICE '';
  RAISE NOTICE '✅ You should see ONLY ONE policy: nfts_allow_all';
  RAISE NOTICE '';
END $$;

