// Bulk Transfer Service
// File: src/services/bulkTransferService.js
// Handles bulk NFT transfers with premium fee

import supabase from '../lib/supabase';
import coreumService from './coreumService';
import toast from 'react-hot-toast';

const BULK_TRANSFER_FEE = '300000'; // 0.3 CORE per batch (in ucore)
const TREASURY_ADDRESS = 'core1wxgp4edry80allxrm20s5yq67wt7jcejj3w29l';

class BulkTransferService {
  // Execute bulk transfer
  async bulkTransfer(signingClient, senderAddress, transferData) {
    try {
      const { transfers } = transferData; // Array of { classId, tokenId, recipient }

      // Calculate total fee
      const estimatedGas = transfers.length * 30000; // 0.03 CORE per transfer
      const serviceFee = 300000; // 0.3 CORE flat fee
      const totalFee = estimatedGas + serviceFee;

      toast.loading(`Processing ${transfers.length} transfers...`);

      // Log bulk transfer job
      const { data: job, error: jobError } = await supabase
        .from('bulk_transfer_jobs')
        .insert({
          user_address: senderAddress,
          total_items: transfers.length,
          completed_items: 0,
          status: 'processing',
          service_fee: serviceFee,
          estimated_gas: estimatedGas,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process each transfer
      let successCount = 0;
      let failCount = 0;
      const results = [];

      for (const transfer of transfers) {
        try {
          const transferResult = await coreumService.transferNFT(signingClient, {
            classId: transfer.classId,
            tokenId: transfer.tokenId,
            recipient: transfer.recipient,
          });

          if (transferResult.success) {
            successCount++;
            results.push({
              tokenId: transfer.tokenId,
              success: true,
              txHash: transferResult.txHash,
            });

            // Log in database
            await supabase.from('bulk_transfer_items').insert({
              job_id: job.id,
              class_id: transfer.classId,
              token_id: transfer.tokenId,
              recipient: transfer.recipient,
              tx_hash: transferResult.txHash,
              status: 'completed',
            });
          } else {
            throw new Error(transferResult.error);
          }
        } catch (transferError) {
          console.error(`Failed to transfer ${transfer.tokenId}:`, transferError);
          failCount++;
          results.push({
            tokenId: transfer.tokenId,
            success: false,
            error: transferError.message,
          });

          // Log failure
          await supabase.from('bulk_transfer_items').insert({
            job_id: job.id,
            class_id: transfer.classId,
            token_id: transfer.tokenId,
            recipient: transfer.recipient,
            status: 'failed',
            error_message: transferError.message,
          });
        }

        // Update job progress
        await supabase
          .from('bulk_transfer_jobs')
          .update({ completed_items: successCount + failCount })
          .eq('id', job.id);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Update job final status
      await supabase
        .from('bulk_transfer_jobs')
        .update({
          status: successCount === transfers.length ? 'completed' : 'partial',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      toast.dismiss();
      toast.success(
        `Bulk transfer complete! ${successCount} success, ${failCount} failed.`
      );

      return {
        success: true,
        jobId: job.id,
        successCount,
        failCount,
        total: transfers.length,
        totalFee: totalFee / 1000000,
        results,
      };
    } catch (error) {
      toast.dismiss();
      console.error('Bulk transfer failed:', error);
      toast.error(error.message || 'Bulk transfer failed');
      return { success: false, error: error.message };
    }
  }

  // Parse CSV for bulk transfer
  parseCSV(csvContent) {
    try {
      const lines = csvContent.trim().split('\n');
      const transfers = [];

      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('class') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [classId, tokenId, recipient] = line.split(',').map((s) => s.trim());

        if (!classId || !tokenId || !recipient) {
          throw new Error(`Invalid line ${i + 1}: Missing required fields`);
        }

        if (!recipient.startsWith('core1')) {
          throw new Error(`Invalid line ${i + 1}: Recipient must be a Coreum address`);
        }

        transfers.push({ classId, tokenId, recipient });
      }

      if (transfers.length === 0) {
        throw new Error('No valid transfers found in CSV');
      }

      return { success: true, transfers };
    } catch (error) {
      console.error('CSV parse error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's bulk transfer jobs
  async getUserJobs(userAddress) {
    try {
      const { data: jobs, error } = await supabase
        .from('bulk_transfer_jobs')
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

export default new BulkTransferService();

