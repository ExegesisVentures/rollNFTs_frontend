// Verified Badge Service
// File: src/services/verifiedBadgeService.js
// Handles verification requests and badge management

import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const ADMIN_ADDRESSES = [
  'core1wxgp4edry80allxrm20s5yq67wt7jcejj3w29l', // Treasury address as admin
];

class VerifiedBadgeService {
  // Check if entity is verified
  async isVerified(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('verified', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        verified: !!data,
        badge: data || null,
      };
    } catch (error) {
      console.error('Failed to check verification:', error);
      return { success: false, verified: false };
    }
  }

  // Get badge for entity
  async getBadge(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, badge: data };
    } catch (error) {
      console.error('Failed to get badge:', error);
      return { success: false, badge: null };
    }
  }

  // Request verification
  async requestVerification(entityType, entityId, requestData) {
    try {
      const { requesterAddress, badgeLevel, supportingInfo } = requestData;

      // Check if already verified
      const verifiedCheck = await this.isVerified(entityType, entityId);
      if (verifiedCheck.verified) {
        toast.info('This entity is already verified!');
        return { success: false, message: 'Already verified' };
      }

      // Check for pending request
      const { data: existingRequest } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        toast.info('You already have a pending verification request');
        return { success: false, message: 'Request already exists' };
      }

      // Create verification request
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          requester_address: requesterAddress,
          requested_badge_level: badgeLevel || 'standard',
          supporting_info: supportingInfo || {},
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Verification request submitted!');
      return {
        success: true,
        request: data,
      };
    } catch (error) {
      console.error('Failed to request verification:', error);
      toast.error(error.message || 'Failed to request verification');
      return { success: false, error: error.message };
    }
  }

  // Check if address is admin
  isAdmin(address) {
    return ADMIN_ADDRESSES.includes(address);
  }

  // Admin: Approve verification request
  async approveVerification(requestId, adminAddress, verificationReason) {
    try {
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Unauthorized: Not an admin');
      }

      // Get request
      const { data: request, error: requestError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Update request status
      await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_by: adminAddress,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      // Create or update verified badge
      const { error: badgeError } = await supabase
        .from('verified_badges')
        .upsert({
          entity_type: request.entity_type,
          entity_id: request.entity_id,
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminAddress,
          badge_level: request.requested_badge_level,
          verification_reason: verificationReason,
        });

      if (badgeError) throw badgeError;

      toast.success('Verification approved!');
      return { success: true };
    } catch (error) {
      console.error('Failed to approve verification:', error);
      toast.error(error.message || 'Failed to approve verification');
      return { success: false, error: error.message };
    }
  }

  // Admin: Reject verification request
  async rejectVerification(requestId, adminAddress, adminNotes) {
    try {
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Unauthorized: Not an admin');
      }

      await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminAddress,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', requestId);

      toast.success('Verification request rejected');
      return { success: true };
    } catch (error) {
      console.error('Failed to reject verification:', error);
      toast.error(error.message || 'Failed to reject verification');
      return { success: false, error: error.message };
    }
  }

  // Admin: Revoke verification
  async revokeVerification(entityType, entityId, adminAddress) {
    try {
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Unauthorized: Not an admin');
      }

      await supabase
        .from('verified_badges')
        .update({ verified: false })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      toast.success('Verification revoked');
      return { success: true };
    } catch (error) {
      console.error('Failed to revoke verification:', error);
      toast.error(error.message || 'Failed to revoke verification');
      return { success: false, error: error.message };
    }
  }

  // Admin: Get all pending requests
  async getPendingRequests() {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, requests: data };
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return { success: false, requests: [] };
    }
  }

  // Get user's verification requests
  async getUserRequests(userAddress) {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('requester_address', userAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, requests: data };
    } catch (error) {
      console.error('Failed to get user requests:', error);
      return { success: false, requests: [] };
    }
  }
}

export default new VerifiedBadgeService();

