// Bulk Mint Service
// File: src/services/bulkMintService.js
// Handles bulk minting operations with premium fee

import supabase from '../lib/supabase';
import coreumService from './coreumService';
import imageService from './imageService';
import toast from 'react-hot-toast';

const BULK_MINT_FEE = '500000'; // 0.5 CORE per batch (in ucore)
const TREASURY_ADDRESS = 'core1wxgp4edry80allxrm20s5yq67wt7jcejj3w29l';

class BulkMintService {
  // Create bulk mint job
  async createBulkMintJob(wallet, jobData) {
    try {
      const { collectionId, items, totalCount } = jobData;

      const accounts = await wallet.getKey('coreum-mainnet-1');
      const userAddress = accounts.bech32Address;

      // Calculate total fee
      const estimatedGas = totalCount * 50000; // 0.05 CORE per NFT
      const serviceFee = 500000; // 0.5 CORE flat fee
      const totalFee = estimatedGas + serviceFee;

      // Create job in database
      const { data: job, error } = await supabase
        .from('bulk_mint_jobs')
        .insert({
          user_address: userAddress,
          collection_id: collectionId,
          total_items: totalCount,
          completed_items: 0,
          status: 'pending',
          service_fee: serviceFee,
          estimated_gas: estimatedGas,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert all items
      const itemsToInsert = items.map((item, index) => ({
        job_id: job.id,
        token_id: item.tokenId || `${collectionId}-${Date.now()}-${index}`,
        name: item.name,
        description: item.description,
        image_url: item.imageUrl,
        metadata: item.metadata || {},
        status: 'pending',
      }));

      const { error: itemsError } = await supabase
        .from('bulk_mint_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(`Bulk mint job created! ${totalCount} items queued.`);

      return {
        success: true,
        jobId: job.id,
        totalFee: totalFee,
        message: `Job created. Fee: ${totalFee / 1000000} CORE`,
      };
    } catch (error) {
      console.error('Failed to create bulk mint job:', error);
      toast.error(error.message || 'Failed to create bulk mint job');
      return { success: false, error: error.message };
    }
  }

  // Process bulk mint job (mints all NFTs)
  async processBulkMintJob(wallet, jobId) {
    try {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('bulk_mint_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Get all pending items
      const { data: items, error: itemsError } = await supabase
        .from('bulk_mint_items')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'pending');

      if (itemsError) throw itemsError;

      // Update job status
      await supabase
        .from('bulk_mint_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId);

      // Process each item
      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        try {
          // Upload metadata to IPFS
          const metadata = {
            name: item.name,
            description: item.description,
            image: item.image_url,
            attributes: item.metadata?.attributes || [],
          };

          const metadataResult = await imageService.uploadMetadataToIPFS(metadata);

          if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
          }

          // Mint NFT
          const mintResult = await coreumService.mintNFT(wallet, {
            classId: job.collection_id,
            tokenId: item.token_id,
            uri: metadataResult.url,
          });

          if (mintResult.success) {
            // Update item status
            await supabase
              .from('bulk_mint_items')
              .update({
                status: 'completed',
                tx_hash: mintResult.txHash,
                minted_at: new Date().toISOString(),
              })
              .eq('id', item.id);

            successCount++;

            // Update job progress
            await supabase
              .from('bulk_mint_jobs')
              .update({ completed_items: successCount })
              .eq('id', jobId);
          } else {
            throw new Error(mintResult.error);
          }
        } catch (itemError) {
          console.error(`Failed to mint item ${item.id}:`, itemError);
          failCount++;

          // Update item status
          await supabase
            .from('bulk_mint_items')
            .update({
              status: 'failed',
              error_message: itemError.message,
            })
            .eq('id', item.id);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Update job final status
      await supabase
        .from('bulk_mint_jobs')
        .update({
          status: successCount === items.length ? 'completed' : 'partial',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      toast.success(`Bulk mint complete! ${successCount} success, ${failCount} failed.`);

      return {
        success: true,
        successCount,
        failCount,
        total: items.length,
      };
    } catch (error) {
      console.error('Failed to process bulk mint job:', error);

      // Update job status to failed
      await supabase
        .from('bulk_mint_jobs')
        .update({ status: 'failed' })
        .eq('id', jobId);

      toast.error(error.message || 'Bulk mint failed');
      return { success: false, error: error.message };
    }
  }

  // Get job status
  async getJobStatus(jobId) {
    try {
      const { data: job, error } = await supabase
        .from('bulk_mint_jobs')
        .select('*, bulk_mint_items(*)')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      return { success: true, job };
    } catch (error) {
      console.error('Failed to get job status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's bulk mint jobs
  async getUserJobs(userAddress) {
    try {
      const { data: jobs, error } = await supabase
        .from('bulk_mint_jobs')
        .select('*')
        .eq('user_address', userAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, jobs };
    } catch (error) {
      console.error('Failed to get user jobs:', error);
      return { success: false, jobs: [] };
    }
  }
}

export default new BulkMintService();

