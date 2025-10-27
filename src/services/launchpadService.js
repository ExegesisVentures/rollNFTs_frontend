/**
 * Launchpad Service
 * File: src/services/launchpadService.js
 * 
 * Handles all launchpad operations including:
 * - Creating and managing launchpads
 * - Minting through launchpads
 * - Whitelist management
 * - Vetting applications
 * - Analytics and stats
 */

import { supabase } from '../lib/supabase';
import coreumService from './coreumService';

class LaunchpadService {
  
  // ============================================================================
  // LAUNCHPAD CREATION & MANAGEMENT
  // ============================================================================
  
  /**
   * Create a new launchpad for an existing collection
   * @param {Object} launchpadData - Launchpad configuration
   * @returns {Promise<Object>} Created launchpad
   */
  async createLaunchpad(launchpadData) {
    try {
      const {
        collectionId,
        classId,
        creatorAddress,
        name,
        description,
        bannerImage,
        mintPrice,
        mintPriceDenom = 'ucore',
        maxSupply,
        maxPerWallet = null,
        startTime,
        endTime = null,
        isWhitelistOnly = false,
        whitelistMintLimit = null,
        whitelistEndTime = null,
        baseUri,
        placeholderUri = null,
        isRevealed = false
      } = launchpadData;

      // Validate collection exists
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id, class_id, creator_address')
        .eq('id', collectionId)
        .single();

      if (collectionError || !collection) {
        throw new Error('Collection not found');
      }

      // Verify creator owns the collection
      if (collection.creator_address !== creatorAddress) {
        throw new Error('Only collection creator can create launchpad');
      }

      // Check if launchpad already exists for this collection
      const { data: existing } = await supabase
        .from('launchpads')
        .select('id')
        .eq('collection_id', collectionId)
        .in('status', ['pending', 'active', 'paused'])
        .single();

      if (existing) {
        throw new Error('An active launchpad already exists for this collection');
      }

      // Create launchpad
      const { data: launchpad, error: launchpadError } = await supabase
        .from('launchpads')
        .insert({
          collection_id: collectionId,
          class_id: classId,
          creator_address: creatorAddress,
          name,
          description,
          banner_image: bannerImage,
          mint_price: mintPrice,
          mint_price_denom: mintPriceDenom,
          max_supply: maxSupply,
          max_per_wallet: maxPerWallet,
          start_time: startTime,
          end_time: endTime,
          is_whitelist_only: isWhitelistOnly,
          whitelist_mint_limit: whitelistMintLimit,
          whitelist_end_time: whitelistEndTime,
          base_uri: baseUri,
          placeholder_uri: placeholderUri,
          is_revealed: isRevealed,
          status: 'pending'
        })
        .select()
        .single();

      if (launchpadError) {
        throw launchpadError;
      }

      return {
        success: true,
        launchpad
      };
    } catch (error) {
      console.error('Error creating launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update launchpad details
   * @param {string} launchpadId - Launchpad ID
   * @param {Object} updates - Fields to update
   * @param {string} userAddress - User wallet address
   * @returns {Promise<Object>} Updated launchpad
   */
  async updateLaunchpad(launchpadId, updates, userAddress) {
    try {
      // Verify ownership
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('creator_address, status')
        .eq('id', launchpadId)
        .single();

      if (!launchpad || launchpad.creator_address !== userAddress) {
        throw new Error('Not authorized to update this launchpad');
      }

      if (launchpad.status === 'cancelled' || launchpad.status === 'completed') {
        throw new Error('Cannot update cancelled or completed launchpad');
      }

      const { data: updatedLaunchpad, error } = await supabase
        .from('launchpads')
        .update(updates)
        .eq('id', launchpadId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad: updatedLaunchpad
      };
    } catch (error) {
      console.error('Error updating launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} userAddress - User wallet address
   * @param {string} reason - Cancellation reason
   * @param {string} postCancelAction - What to do with remaining NFTs ('mint_remaining', 'burn_remaining', 'none')
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelLaunchpad(launchpadId, userAddress, reason, postCancelAction = 'none') {
    try {
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('*')
        .eq('id', launchpadId)
        .single();

      if (!launchpad || launchpad.creator_address !== userAddress) {
        throw new Error('Not authorized to cancel this launchpad');
      }

      if (launchpad.status === 'cancelled' || launchpad.status === 'completed') {
        throw new Error('Launchpad is already cancelled or completed');
      }

      // Update launchpad status
      const { data: cancelled, error } = await supabase
        .from('launchpads')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userAddress,
          cancellation_reason: reason,
          post_cancel_action: postCancelAction
        })
        .eq('id', launchpadId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad: cancelled,
        message: 'Launchpad cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Activate a pending launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} userAddress - User wallet address
   * @returns {Promise<Object>} Activation result
   */
  async activateLaunchpad(launchpadId, userAddress) {
    try {
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('creator_address, status')
        .eq('id', launchpadId)
        .single();

      if (!launchpad || launchpad.creator_address !== userAddress) {
        throw new Error('Not authorized to activate this launchpad');
      }

      if (launchpad.status !== 'pending') {
        throw new Error('Only pending launchpads can be activated');
      }

      const { data: activated, error } = await supabase
        .from('launchpads')
        .update({ status: 'active' })
        .eq('id', launchpadId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad: activated
      };
    } catch (error) {
      console.error('Error activating launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // MINTING THROUGH LAUNCHPAD
  // ============================================================================

  /**
   * Mint NFT through launchpad
   * @param {Object} mintData - Mint parameters
   * @returns {Promise<Object>} Mint result
   */
  async mintFromLaunchpad(mintData) {
    try {
      const {
        launchpadId,
        minterAddress,
        tokenId,
        tokenName,
        tokenAttributes = {},
        txHash
      } = mintData;

      // Get launchpad details
      const { data: launchpad, error: launchpadError } = await supabase
        .from('launchpads')
        .select('*')
        .eq('id', launchpadId)
        .single();

      if (launchpadError || !launchpad) {
        throw new Error('Launchpad not found');
      }

      // Validate launchpad is active
      if (launchpad.status !== 'active') {
        throw new Error('Launchpad is not active');
      }

      // Check if launchpad has started
      if (new Date(launchpad.start_time) > new Date()) {
        throw new Error('Launchpad has not started yet');
      }

      // Check if launchpad has ended
      if (launchpad.end_time && new Date(launchpad.end_time) < new Date()) {
        throw new Error('Launchpad has ended');
      }

      // Check if sold out
      if (launchpad.total_minted >= launchpad.max_supply) {
        throw new Error('Launchpad is sold out');
      }

      // Check whitelist if applicable
      const now = new Date();
      const isWhitelistPhase = launchpad.is_whitelist_only || 
        (launchpad.whitelist_end_time && new Date(launchpad.whitelist_end_time) > now);

      let wasWhitelistMint = false;

      if (isWhitelistPhase) {
        const { data: whitelistEntry } = await supabase
          .from('launchpad_whitelist')
          .select('*')
          .eq('launchpad_id', launchpadId)
          .eq('wallet_address', minterAddress)
          .single();

        if (!whitelistEntry) {
          throw new Error('Address is not whitelisted');
        }

        if (whitelistEntry.mints_used >= whitelistEntry.max_mints) {
          throw new Error('Whitelist allocation exhausted');
        }

        wasWhitelistMint = true;
      }

      // Check max per wallet limit
      if (launchpad.max_per_wallet) {
        const { count } = await supabase
          .from('launchpad_mints')
          .select('id', { count: 'exact' })
          .eq('launchpad_id', launchpadId)
          .eq('minter_address', minterAddress);

        if (count >= launchpad.max_per_wallet) {
          throw new Error(`Maximum ${launchpad.max_per_wallet} mints per wallet reached`);
        }
      }

      // Determine metadata URI
      const metadataUri = launchpad.is_revealed && launchpad.base_uri
        ? `${launchpad.base_uri}/${tokenId}.json`
        : launchpad.placeholder_uri || '';

      // Record mint
      const { data: mint, error: mintError } = await supabase
        .from('launchpad_mints')
        .insert({
          launchpad_id: launchpadId,
          token_id: tokenId,
          minter_address: minterAddress,
          mint_price: launchpad.mint_price,
          mint_price_denom: launchpad.mint_price_denom,
          was_whitelist_mint: wasWhitelistMint,
          tx_hash: txHash,
          metadata_uri: metadataUri,
          token_name: tokenName,
          token_attributes: tokenAttributes
        })
        .select()
        .single();

      if (mintError) throw mintError;

      return {
        success: true,
        mint,
        remaining: launchpad.max_supply - (launchpad.total_minted + 1)
      };
    } catch (error) {
      console.error('Error minting from launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user can mint from launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} userAddress - User wallet address
   * @returns {Promise<Object>} Eligibility details
   */
  async checkMintEligibility(launchpadId, userAddress) {
    try {
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('*')
        .eq('id', launchpadId)
        .single();

      if (!launchpad) {
        return { canMint: false, reason: 'Launchpad not found' };
      }

      if (launchpad.status !== 'active') {
        return { canMint: false, reason: 'Launchpad is not active' };
      }

      const now = new Date();
      if (new Date(launchpad.start_time) > now) {
        return { canMint: false, reason: 'Launchpad has not started yet' };
      }

      if (launchpad.end_time && new Date(launchpad.end_time) < now) {
        return { canMint: false, reason: 'Launchpad has ended' };
      }

      if (launchpad.total_minted >= launchpad.max_supply) {
        return { canMint: false, reason: 'Sold out' };
      }

      // Check whitelist phase
      const isWhitelistPhase = launchpad.is_whitelist_only || 
        (launchpad.whitelist_end_time && new Date(launchpad.whitelist_end_time) > now);

      if (isWhitelistPhase) {
        const { data: whitelistEntry } = await supabase
          .from('launchpad_whitelist')
          .select('*')
          .eq('launchpad_id', launchpadId)
          .eq('wallet_address', userAddress)
          .single();

        if (!whitelistEntry) {
          return { canMint: false, reason: 'Not whitelisted' };
        }

        if (whitelistEntry.mints_used >= whitelistEntry.max_mints) {
          return { canMint: false, reason: 'Whitelist allocation exhausted' };
        }
      }

      // Check max per wallet
      if (launchpad.max_per_wallet) {
        const { count } = await supabase
          .from('launchpad_mints')
          .select('id', { count: 'exact' })
          .eq('launchpad_id', launchpadId)
          .eq('minter_address', userAddress);

        if (count >= launchpad.max_per_wallet) {
          return { 
            canMint: false, 
            reason: `Maximum ${launchpad.max_per_wallet} mints per wallet reached` 
          };
        }

        return {
          canMint: true,
          remaining: launchpad.max_per_wallet - count
        };
      }

      return {
        canMint: true,
        remaining: launchpad.max_supply - launchpad.total_minted
      };
    } catch (error) {
      console.error('Error checking mint eligibility:', error);
      return {
        canMint: false,
        reason: 'Error checking eligibility'
      };
    }
  }

  // ============================================================================
  // WHITELIST MANAGEMENT
  // ============================================================================

  /**
   * Add addresses to whitelist
   * @param {string} launchpadId - Launchpad ID
   * @param {Array<Object>} addresses - Array of {address, maxMints}
   * @param {string} adderAddress - Address adding to whitelist (creator or admin)
   * @returns {Promise<Object>} Addition result
   */
  async addToWhitelist(launchpadId, addresses, adderAddress) {
    try {
      // Verify ownership
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('creator_address')
        .eq('id', launchpadId)
        .single();

      if (!launchpad || launchpad.creator_address !== adderAddress) {
        throw new Error('Not authorized to manage whitelist');
      }

      // Prepare whitelist entries
      const whitelistEntries = addresses.map(({ address, maxMints = 1 }) => ({
        launchpad_id: launchpadId,
        wallet_address: address,
        max_mints: maxMints,
        added_by: adderAddress
      }));

      const { data, error } = await supabase
        .from('launchpad_whitelist')
        .upsert(whitelistEntries, { 
          onConflict: 'launchpad_id,wallet_address',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        added: data.length
      };
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove address from whitelist
   * @param {string} launchpadId - Launchpad ID
   * @param {string} addressToRemove - Address to remove
   * @param {string} removerAddress - Address performing removal
   * @returns {Promise<Object>} Removal result
   */
  async removeFromWhitelist(launchpadId, addressToRemove, removerAddress) {
    try {
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('creator_address')
        .eq('id', launchpadId)
        .single();

      if (!launchpad || launchpad.creator_address !== removerAddress) {
        throw new Error('Not authorized to manage whitelist');
      }

      const { error } = await supabase
        .from('launchpad_whitelist')
        .delete()
        .eq('launchpad_id', launchpadId)
        .eq('wallet_address', addressToRemove);

      if (error) throw error;

      return {
        success: true,
        message: 'Address removed from whitelist'
      };
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get whitelist for a launchpad
   * @param {string} launchpadId - Launchpad ID
   * @returns {Promise<Array>} Whitelist entries
   */
  async getWhitelist(launchpadId) {
    try {
      const { data, error } = await supabase
        .from('launchpad_whitelist')
        .select('*')
        .eq('launchpad_id', launchpadId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        whitelist: data
      };
    } catch (error) {
      console.error('Error getting whitelist:', error);
      return {
        success: false,
        error: error.message,
        whitelist: []
      };
    }
  }

  // ============================================================================
  // QUERYING & LISTING
  // ============================================================================

  /**
   * Get all active launchpads
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Active launchpads
   */
  async getActiveLaunchpads(filters = {}) {
    try {
      const { vetted, sortBy = 'created_at' } = filters;

      let query = supabase
        .from('active_launchpads_view')
        .select('*');

      if (vetted !== undefined) {
        query = query.eq('is_vetted', vetted);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        launchpads: data
      };
    } catch (error) {
      console.error('Error getting active launchpads:', error);
      return {
        success: false,
        error: error.message,
        launchpads: []
      };
    }
  }

  /**
   * Get launchpad by ID
   * @param {string} launchpadId - Launchpad ID
   * @returns {Promise<Object>} Launchpad details
   */
  async getLaunchpadById(launchpadId) {
    try {
      const { data: launchpad, error } = await supabase
        .from('launchpads')
        .select(`
          *,
          collections (
            id,
            name,
            symbol,
            cover_image,
            verified
          )
        `)
        .eq('id', launchpadId)
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad
      };
    } catch (error) {
      console.error('Error getting launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get launchpads by creator
   * @param {string} creatorAddress - Creator wallet address
   * @returns {Promise<Array>} Creator's launchpads
   */
  async getLaunchpadsByCreator(creatorAddress) {
    try {
      const { data, error } = await supabase
        .from('launchpads')
        .select(`
          *,
          collections (
            name,
            symbol,
            cover_image
          )
        `)
        .eq('creator_address', creatorAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        launchpads: data
      };
    } catch (error) {
      console.error('Error getting creator launchpads:', error);
      return {
        success: false,
        error: error.message,
        launchpads: []
      };
    }
  }

  /**
   * Get user's mints from a launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} userAddress - User wallet address
   * @returns {Promise<Array>} User's mints
   */
  async getUserMints(launchpadId, userAddress) {
    try {
      const { data, error } = await supabase
        .from('launchpad_mints')
        .select('*')
        .eq('launchpad_id', launchpadId)
        .eq('minter_address', userAddress)
        .order('minted_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        mints: data
      };
    } catch (error) {
      console.error('Error getting user mints:', error);
      return {
        success: false,
        error: error.message,
        mints: []
      };
    }
  }

  // ============================================================================
  // VETTING APPLICATIONS
  // ============================================================================

  /**
   * Submit vetting application
   * @param {Object} applicationData - Application details
   * @returns {Promise<Object>} Submission result
   */
  async submitVettingApplication(applicationData) {
    try {
      const {
        launchpadId,
        applicantAddress,
        projectName,
        projectDescription,
        teamInfo,
        websiteUrl,
        twitterUrl,
        discordUrl,
        telegramUrl,
        roadmap,
        utilityDescription,
        artSamples,
        teamBackground,
        kycCompleted,
        kycProvider,
        signatureProof,
        verificationDocuments
      } = applicationData;

      // Check if application already exists
      const { data: existing } = await supabase
        .from('launchpad_vetting_applications')
        .select('id, status')
        .eq('launchpad_id', launchpadId)
        .eq('applicant_address', applicantAddress)
        .in('status', ['pending', 'under_review'])
        .single();

      if (existing) {
        throw new Error('Application already submitted and under review');
      }

      const { data: application, error } = await supabase
        .from('launchpad_vetting_applications')
        .insert({
          launchpad_id: launchpadId,
          applicant_address: applicantAddress,
          project_name: projectName,
          project_description: projectDescription,
          team_info: teamInfo,
          website_url: websiteUrl,
          twitter_url: twitterUrl,
          discord_url: discordUrl,
          telegram_url: telegramUrl,
          roadmap,
          utility_description: utilityDescription,
          art_samples: artSamples,
          team_background: teamBackground,
          kyc_completed: kycCompleted,
          kyc_provider: kycProvider,
          signature_proof: signatureProof,
          verification_documents: verificationDocuments,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        application
      };
    } catch (error) {
      console.error('Error submitting vetting application:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get vetting application for launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} applicantAddress - Applicant wallet address
   * @returns {Promise<Object>} Application details
   */
  async getVettingApplication(launchpadId, applicantAddress) {
    try {
      const { data, error } = await supabase
        .from('launchpad_vetting_applications')
        .select('*')
        .eq('launchpad_id', launchpadId)
        .eq('applicant_address', applicantAddress)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        success: true,
        application: data || null
      };
    } catch (error) {
      console.error('Error getting vetting application:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get launchpad statistics
   * @param {string} launchpadId - Launchpad ID
   * @returns {Promise<Object>} Launchpad stats
   */
  async getLaunchpadStats(launchpadId) {
    try {
      // Get basic stats
      const { data: launchpad } = await supabase
        .from('launchpads')
        .select('total_minted, total_raised, max_supply, mint_price')
        .eq('id', launchpadId)
        .single();

      // Get unique minters count
      const { data: mints } = await supabase
        .from('launchpad_mints')
        .select('minter_address')
        .eq('launchpad_id', launchpadId);

      const uniqueMinters = new Set(mints?.map(m => m.minter_address) || []).size;

      // Get recent mints (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recent24h } = await supabase
        .from('launchpad_mints')
        .select('id', { count: 'exact' })
        .eq('launchpad_id', launchpadId)
        .gte('minted_at', yesterday);

      return {
        success: true,
        stats: {
          totalMinted: launchpad.total_minted,
          totalRaised: launchpad.total_raised,
          maxSupply: launchpad.max_supply,
          uniqueMinters,
          recent24h,
          completionPercentage: (launchpad.total_minted / launchpad.max_supply * 100).toFixed(2),
          avgMintPrice: launchpad.mint_price
        }
      };
    } catch (error) {
      console.error('Error getting launchpad stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get launchpad leaderboard
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} Top launchpads
   */
  async getLeaderboard(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('launchpad_leaderboard_view')
        .select('*')
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        leaderboard: data
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return {
        success: false,
        error: error.message,
        leaderboard: []
      };
    }
  }
}

export const launchpadService = new LaunchpadService();

