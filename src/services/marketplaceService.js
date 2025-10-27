// Marketplace Service
// File: src/services/marketplaceService.js
// Handles listing, buying, selling with Roll burn option

import supabase from '../lib/supabase';
import coreumService from './coreumService';
import toast from 'react-hot-toast';

const MARKETPLACE_CONTRACT = import.meta.env.VITE_MARKETPLACE_CONTRACT || 'PLACEHOLDER';
const ROLL_TOKEN_ADDRESS = 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz';
const TREASURY_ADDRESS = 'core1wxgp4edry80allxrm20s5yq67wt7jcejj3w29l';

class MarketplaceService {
  // List NFT for sale
  async listNFT(signingClient, sellerAddress, listingData) {
    try {
      const { classId, tokenId, price, payWithRoll, royaltyBps } = listingData;

      // Validate inputs
      if (!classId || !tokenId || !price) {
        throw new Error('Missing required listing data');
      }

      // Calculate Roll burn amount if paying with Roll
      let rollBurnAmount = 0;
      if (payWithRoll) {
        // Burn amount = 0.5% of sale price worth of ROLL
        rollBurnAmount = (price * 0.005) * 1000000; // Convert to ucore
      }

      // TODO: When marketplace contract is deployed, sign transaction via contract
      // For now, save to database
      const { data, error} = await supabase
        .from('listings')
        .insert({
          nft_token_id: tokenId,
          collection_id: classId,
          seller_address: sellerAddress,
          price: price,
          pay_with_roll: payWithRoll,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        payWithRoll
          ? `Listed! You'll save 0.5% by burning ${rollBurnAmount / 1000000} ROLL tokens`
          : 'Listed successfully! 1% platform fee on sale'
      );

      return {
        success: true,
        listing: data,
      };
    } catch (error) {
      console.error('Failed to list NFT:', error);
      toast.error(error.message || 'Failed to list NFT');
      return { success: false, error: error.message };
    }
  }

  // Buy NFT
  async buyNFT(signingClient, buyerAddress, listingId) {
    try {
      // Get listing details
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'active')
        .single();

      if (listingError) throw new Error('Listing not found');

      // Calculate fees
      const platformFee = listing.pay_with_roll
        ? listing.price * 0.005 // 0.5% if Roll burned
        : listing.price * 0.01; // 1% standard

      const creatorRoyalty = listing.price * 0.1; // 10% royalty (example)
      const sellerReceives = listing.price - platformFee - creatorRoyalty;

      // TODO: When marketplace contract is deployed, execute purchase via contract
      // For now, transfer NFT directly

      // Transfer NFT
      const transferResult = await coreumService.transferNFT(signingClient, {
        classId: listing.collection_id,
        tokenId: listing.nft_token_id,
        recipient: buyerAddress,
      });

      if (!transferResult.success) {
        throw new Error('NFT transfer failed');
      }

      // Update listing status
      await supabase
        .from('listings')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      // Record sale
      await supabase.from('sales').insert({
        nft_token_id: listing.nft_token_id,
        collection_id: listing.collection_id,
        seller_address: listing.seller_address,
        buyer_address: buyerAddress,
        price: listing.price,
        platform_fee: platformFee,
        creator_royalty: creatorRoyalty,
        roll_burned: listing.pay_with_roll ? listing.price * 0.005 : 0,
        tx_hash: transferResult.txHash,
      });

      toast.success('NFT purchased successfully!');
      return {
        success: true,
        txHash: transferResult.txHash,
      };
    } catch (error) {
      console.error('Failed to buy NFT:', error);
      toast.error(error.message || 'Failed to buy NFT');
      return { success: false, error: error.message };
    }
  }

  // Cancel listing
  async cancelListing(wallet, listingId) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      if (error) throw error;

      toast.success('Listing cancelled');
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel listing:', error);
      toast.error(error.message || 'Failed to cancel listing');
      return { success: false, error: error.message };
    }
  }

  // Get active listings
  async getListings(filters = {}) {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.collectionId) {
        query = query.eq('collection_id', filters.collectionId);
      }

      if (filters.sellerAddress) {
        query = query.eq('seller_address', filters.sellerAddress);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, listings: data };
    } catch (error) {
      console.error('Failed to get listings:', error);
      return { success: false, listings: [] };
    }
  }

  // Get listing by ID
  async getListing(listingId) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) throw error;

      return { success: true, listing: data };
    } catch (error) {
      console.error('Failed to get listing:', error);
      return { success: false, listing: null };
    }
  }
}

export default new MarketplaceService();

