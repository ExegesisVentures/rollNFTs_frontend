// Free Spin Service - Handles all spin wheel operations with security and error handling
// Location: src/services/freeSpinService.js

import { supabase } from '../lib/supabase';
import { handleServiceError, AppError } from '../utils/errorHandler';
import { coreumService } from './coreumService';

class FreeSpinService {
  /**
   * Get all active spin campaigns
   * @param {string} collectionId - Optional filter by collection
   * @returns {Promise<Array>} Active campaigns
   */
  async getActiveCampaigns(collectionId = null) {
    try {
      let query = supabase
        .from('free_spin_campaigns')
        .select(`
          *,
          collections:collection_id (
            id,
            name,
            symbol,
            banner_image,
            creator_address
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      // Filter by date
      const now = new Date().toISOString();
      query = query.or(`end_date.is.null,end_date.gt.${now}`);

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch spin campaigns');
    }
  }

  /**
   * Get campaign details by ID
   * @param {string} campaignId - Campaign UUID
   * @returns {Promise<Object>} Campaign details
   */
  async getCampaignById(campaignId) {
    try {
      const { data, error } = await supabase
        .from('free_spin_campaigns')
        .select(`
          *,
          collections:collection_id (
            id,
            name,
            symbol,
            banner_image,
            creator_address,
            description
          )
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      if (!data) throw new AppError('Campaign not found', 404);

      return data;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch campaign details');
    }
  }

  /**
   * Check if wallet can spin - includes whitelist and spin count validation
   * @param {string} campaignId - Campaign UUID
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} { canSpin, spinsRemaining, reason }
   */
  async checkSpinEligibility(campaignId, walletAddress) {
    try {
      if (!walletAddress) {
        return {
          canSpin: false,
          spinsRemaining: 0,
          reason: 'Please connect your wallet'
        };
      }

      // Get campaign
      const campaign = await this.getCampaignById(campaignId);

      if (!campaign.active) {
        return {
          canSpin: false,
          spinsRemaining: 0,
          reason: 'Campaign is not active'
        };
      }

      // Check end date
      if (campaign.end_date && new Date(campaign.end_date) < new Date()) {
        return {
          canSpin: false,
          spinsRemaining: 0,
          reason: 'Campaign has ended'
        };
      }

      // Check whitelist if required
      if (campaign.require_whitelist) {
        const { data: whitelist, error: whitelistError } = await supabase
          .from('free_spin_whitelist')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('wallet_address', walletAddress)
          .single();

        if (whitelistError || !whitelist) {
          return {
            canSpin: false,
            spinsRemaining: 0,
            reason: 'Wallet not whitelisted for this campaign'
          };
        }

        const remaining = whitelist.spins_allowed - whitelist.spins_used;
        return {
          canSpin: remaining > 0,
          spinsRemaining: remaining,
          reason: remaining > 0 ? null : 'No spins remaining',
          whitelist
        };
      } else {
        // Check spin count from history
        const { data: history, error: historyError } = await supabase
          .from('free_spin_history')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('wallet_address', walletAddress);

        if (historyError) throw historyError;

        const spinsUsed = history?.length || 0;
        const remaining = campaign.spins_per_wallet - spinsUsed;

        return {
          canSpin: remaining > 0,
          spinsRemaining: remaining,
          reason: remaining > 0 ? null : 'No spins remaining'
        };
      }
    } catch (error) {
      throw handleServiceError(error, 'Failed to check spin eligibility');
    }
  }

  /**
   * Get user's spin history for a campaign
   * @param {string} campaignId - Campaign UUID
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Array>} Spin history
   */
  async getSpinHistory(campaignId, walletAddress) {
    try {
      const { data, error } = await supabase
        .from('free_spin_history')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('wallet_address', walletAddress)
        .order('spun_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch spin history');
    }
  }

  /**
   * Execute a spin - Server-side RNG and prize selection
   * @param {string} campaignId - Campaign UUID
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Spin result with prize info
   */
  async executeSpin(campaignId, walletAddress) {
    try {
      // Step 1: Validate and consume spin using atomic database function
      const { data: spinCheck, error: spinCheckError } = await supabase
        .rpc('check_and_use_spin', {
          p_campaign_id: campaignId,
          p_wallet_address: walletAddress
        });

      if (spinCheckError) throw spinCheckError;

      const result = spinCheck?.[0];
      if (!result?.can_spin) {
        throw new AppError(result?.error_message || 'Cannot spin', 400);
      }

      // Step 2: Get campaign prizes configuration
      const campaign = await this.getCampaignById(campaignId);
      const prizes = campaign.prizes || [];

      if (prizes.length === 0) {
        throw new AppError('No prizes configured for this campaign', 500);
      }

      // Step 3: Server-side random prize selection based on probability
      const selectedPrize = this._selectPrizeByProbability(prizes);

      // Step 4: Handle prize based on type
      let prizeResult;
      if (selectedPrize.type === 'nft') {
        prizeResult = await this._handleNFTPrize(
          campaignId,
          walletAddress,
          selectedPrize
        );
      } else {
        prizeResult = {
          type: selectedPrize.type,
          data: selectedPrize,
          status: 'completed'
        };
      }

      // Step 5: Record spin in history
      const { data: historyRecord, error: historyError } = await supabase
        .from('free_spin_history')
        .insert({
          campaign_id: campaignId,
          wallet_address: walletAddress,
          prize_type: selectedPrize.type,
          prize_data: prizeResult.data,
          status: prizeResult.status,
          tx_hash: prizeResult.txHash,
          spin_result_hash: this._generateResultHash(
            campaignId,
            walletAddress,
            selectedPrize
          )
        })
        .select()
        .single();

      if (historyError) throw historyError;

      return {
        success: true,
        prize: selectedPrize,
        prizeResult: prizeResult.data,
        status: prizeResult.status,
        txHash: prizeResult.txHash,
        historyId: historyRecord.id,
        spinsRemaining: result.spins_remaining,
        segmentIndex: this._calculateSegmentIndex(prizes, selectedPrize)
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to execute spin');
    }
  }

  /**
   * Handle NFT prize - reserve from inventory or mint new
   * @private
   */
  async _handleNFTPrize(campaignId, walletAddress, prize) {
    try {
      // Check if there's inventory available
      const { data: reserveResult, error: reserveError } = await supabase
        .rpc('reserve_prize', {
          p_campaign_id: campaignId,
          p_wallet_address: walletAddress,
          p_nft_id: prize.nft_id
        });

      if (reserveError) throw reserveError;

      const reservation = reserveResult?.[0];
      if (!reservation?.success) {
        // No NFTs available in inventory - return message instead
        return {
          type: 'message',
          data: {
            text: prize.fallback_message || 'Prize pool exhausted. Please try again later.',
            original_prize: prize
          },
          status: 'completed'
        };
      }

      // Get NFT details
      const { data: nft, error: nftError } = await supabase
        .from('nfts')
        .select('*')
        .eq('id', prize.nft_id)
        .single();

      if (nftError) throw nftError;

      return {
        type: 'nft',
        data: {
          ...prize,
          nft,
          inventory_id: reservation.inventory_id,
          reserved_at: new Date().toISOString()
        },
        status: 'reserved' // Will be claimed by user action
      };
    } catch (error) {
      console.error('Error handling NFT prize:', error);
      return {
        type: 'error',
        data: {
          text: 'Error processing prize. Please contact support.',
          error: error.message
        },
        status: 'failed'
      };
    }
  }

  /**
   * Claim a reserved NFT prize
   * @param {string} historyId - Spin history record ID
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Claim result with transaction hash
   */
  async claimPrize(historyId, walletAddress) {
    try {
      // Get spin history record
      const { data: history, error: historyError } = await supabase
        .from('free_spin_history')
        .select('*')
        .eq('id', historyId)
        .eq('wallet_address', walletAddress)
        .single();

      if (historyError) throw historyError;
      if (!history) throw new AppError('Spin record not found', 404);

      if (history.status === 'completed') {
        return {
          success: true,
          message: 'Prize already claimed',
          txHash: history.tx_hash
        };
      }

      if (history.prize_type !== 'nft') {
        throw new AppError('This prize cannot be claimed', 400);
      }

      // Get inventory record
      const { data: inventory, error: inventoryError } = await supabase
        .from('free_spin_prize_inventory')
        .select('*, nfts(*)')
        .eq('id', history.prize_data.inventory_id)
        .single();

      if (inventoryError) throw inventoryError;

      // Transfer or mint NFT to winner
      // This is a placeholder - implement based on your NFT transfer logic
      let txHash;
      try {
        // If NFT is already minted, transfer it
        if (inventory.nfts.token_id) {
          // Implement transfer logic via coreumService
          // txHash = await coreumService.transferNFT(...)
          txHash = `claim_${Date.now()}`; // Placeholder
        } else {
          // Mint directly to winner
          // txHash = await coreumService.mintNFT(...)
          txHash = `mint_${Date.now()}`; // Placeholder
        }
      } catch (txError) {
        // Update history with error
        await supabase
          .from('free_spin_history')
          .update({
            status: 'failed',
            error_message: txError.message
          })
          .eq('id', historyId);

        throw txError;
      }

      // Update inventory status
      await supabase
        .from('free_spin_prize_inventory')
        .update({
          status: 'claimed',
          claimed_by: walletAddress,
          claimed_at: new Date().toISOString(),
          spin_history_id: historyId
        })
        .eq('id', history.prize_data.inventory_id);

      // Update history status
      await supabase
        .from('free_spin_history')
        .update({
          status: 'completed',
          tx_hash: txHash,
          completed_at: new Date().toISOString()
        })
        .eq('id', historyId);

      // Update campaign stats
      await supabase.rpc('increment', {
        table_name: 'free_spin_campaigns',
        row_id: history.campaign_id,
        column_name: 'total_prizes_claimed'
      });

      return {
        success: true,
        txHash,
        nft: inventory.nfts
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to claim prize');
    }
  }

  /**
   * Create a new spin campaign (Admin)
   * @param {Object} campaignData - Campaign configuration
   * @returns {Promise<Object>} Created campaign
   */
  async createCampaign(campaignData) {
    try {
      const { data, error } = await supabase
        .from('free_spin_campaigns')
        .insert({
          collection_id: campaignData.collectionId,
          name: campaignData.name,
          description: campaignData.description,
          active: campaignData.active ?? true,
          start_date: campaignData.startDate || new Date().toISOString(),
          end_date: campaignData.endDate,
          total_spins: campaignData.totalSpins || 0,
          spins_per_wallet: campaignData.spinsPerWallet || 1,
          require_whitelist: campaignData.requireWhitelist || false,
          prizes: campaignData.prizes || [],
          wheel_config: campaignData.wheelConfig || {}
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create campaign');
    }
  }

  /**
   * Add addresses to campaign whitelist (Admin)
   * @param {string} campaignId - Campaign UUID
   * @param {Array<Object>} addresses - Array of {wallet_address, spins_allowed}
   * @returns {Promise<Array>} Added whitelist entries
   */
  async addToWhitelist(campaignId, addresses) {
    try {
      const entries = addresses.map(addr => ({
        campaign_id: campaignId,
        wallet_address: addr.wallet_address || addr,
        spins_allowed: addr.spins_allowed || 1
      }));

      const { data, error } = await supabase
        .from('free_spin_whitelist')
        .upsert(entries, {
          onConflict: 'campaign_id,wallet_address',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      throw handleServiceError(error, 'Failed to add to whitelist');
    }
  }

  /**
   * Add NFTs to prize inventory
   * @param {string} campaignId - Campaign UUID
   * @param {Array<string>} nftIds - Array of NFT UUIDs
   * @returns {Promise<Array>} Added inventory entries
   */
  async addPrizeInventory(campaignId, nftIds) {
    try {
      const entries = nftIds.map(nftId => ({
        campaign_id: campaignId,
        nft_id: nftId,
        status: 'available'
      }));

      const { data, error } = await supabase
        .from('free_spin_prize_inventory')
        .insert(entries)
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      throw handleServiceError(error, 'Failed to add prize inventory');
    }
  }

  /**
   * Get campaign statistics
   * @param {string} campaignId - Campaign UUID
   * @returns {Promise<Object>} Campaign stats
   */
  async getCampaignStats(campaignId) {
    try {
      const [campaign, history, inventory] = await Promise.all([
        this.getCampaignById(campaignId),
        supabase
          .from('free_spin_history')
          .select('prize_type, status')
          .eq('campaign_id', campaignId),
        supabase
          .from('free_spin_prize_inventory')
          .select('status')
          .eq('campaign_id', campaignId)
      ]);

      const historyData = history.data || [];
      const inventoryData = inventory.data || [];

      return {
        campaign,
        totalSpins: historyData.length,
        completedSpins: historyData.filter(h => h.status === 'completed').length,
        nftPrizes: historyData.filter(h => h.prize_type === 'nft').length,
        availablePrizes: inventoryData.filter(i => i.status === 'available').length,
        claimedPrizes: inventoryData.filter(i => i.status === 'claimed').length,
        reservedPrizes: inventoryData.filter(i => i.status === 'reserved').length
      };
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch campaign stats');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Select prize based on probability distribution
   * @private
   */
  _selectPrizeByProbability(prizes) {
    // Normalize probabilities
    const totalProb = prizes.reduce((sum, p) => sum + (p.probability || 0), 0);
    
    if (totalProb === 0) {
      // Equal probability if not specified
      return prizes[Math.floor(Math.random() * prizes.length)];
    }

    // Generate random number between 0 and totalProb
    let random = Math.random() * totalProb;
    
    // Select prize based on cumulative probability
    for (const prize of prizes) {
      random -= prize.probability || 0;
      if (random <= 0) {
        return prize;
      }
    }
    
    // Fallback to last prize
    return prizes[prizes.length - 1];
  }

  /**
   * Calculate which segment the prize lands on (for animation)
   * @private
   */
  _calculateSegmentIndex(prizes, selectedPrize) {
    // Find all instances of this prize type
    const indices = prizes
      .map((p, idx) => ({ prize: p, idx }))
      .filter(({ prize }) => 
        prize.type === selectedPrize.type && 
        prize.nft_id === selectedPrize.nft_id
      )
      .map(({ idx }) => idx);
    
    // Return random instance if multiple segments have same prize
    return indices[Math.floor(Math.random() * indices.length)];
  }

  /**
   * Generate hash to verify spin result (prevent tampering)
   * @private
   */
  _generateResultHash(campaignId, walletAddress, prize) {
    const data = `${campaignId}-${walletAddress}-${Date.now()}-${JSON.stringify(prize)}`;
    // Simple hash - in production, use crypto.subtle.digest
    return btoa(data).substring(0, 32);
  }
}

export const freeSpinService = new FreeSpinService();
export default freeSpinService;

