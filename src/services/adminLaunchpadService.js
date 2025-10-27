/**
 * Admin Launchpad Service
 * File: src/services/adminLaunchpadService.js
 * 
 * Admin-only operations for launchpad management:
 * - Review and approve/reject vetting applications
 * - Grant "Vetted" badge to launchpads
 * - Moderate launchpads
 * - View all applications and analytics
 */

import { supabase } from '../lib/supabase';

class AdminLaunchpadService {
  
  // Admin wallet addresses (should be in environment variables)
  static ADMIN_ADDRESSES = [
    process.env.REACT_APP_ADMIN_ADDRESS_1,
    process.env.REACT_APP_ADMIN_ADDRESS_2,
    'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj' // User's wallet address
  ].filter(Boolean);

  /**
   * Check if address is admin
   * @param {string} address - Wallet address
   * @returns {boolean} Is admin
   */
  isAdmin(address) {
    return AdminLaunchpadService.ADMIN_ADDRESSES.includes(address);
  }

  // ============================================================================
  // VETTING APPLICATION MANAGEMENT
  // ============================================================================

  /**
   * Get all pending vetting applications
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Pending applications
   */
  async getPendingApplications(filters = {}) {
    try {
      const { status = 'pending', sortBy = 'submitted_at' } = filters;

      let query = supabase
        .from('launchpad_vetting_applications')
        .select(`
          *,
          launchpads (
            id,
            name,
            class_id,
            description,
            banner_image,
            max_supply,
            mint_price,
            start_time,
            collections (
              name,
              symbol,
              cover_image
            )
          )
        `);

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        applications: data
      };
    } catch (error) {
      console.error('Error getting pending applications:', error);
      return {
        success: false,
        error: error.message,
        applications: []
      };
    }
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application details
   */
  async getApplicationById(applicationId) {
    try {
      const { data, error } = await supabase
        .from('launchpad_vetting_applications')
        .select(`
          *,
          launchpads (
            *,
            collections (
              *
            )
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      return {
        success: true,
        application: data
      };
    } catch (error) {
      console.error('Error getting application:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Review vetting application
   * @param {string} applicationId - Application ID
   * @param {string} adminAddress - Admin wallet address
   * @param {Object} reviewData - Review decision
   * @returns {Promise<Object>} Review result
   */
  async reviewApplication(applicationId, adminAddress, reviewData) {
    try {
      // Verify admin
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Not authorized: Admin access required');
      }

      const { action, adminNotes, rejectionReason } = reviewData;

      if (!['approve', 'reject', 'request_changes'].includes(action)) {
        throw new Error('Invalid action');
      }

      // Get application
      const { data: application } = await supabase
        .from('launchpad_vetting_applications')
        .select('*, launchpads(id)')
        .eq('id', applicationId)
        .single();

      if (!application) {
        throw new Error('Application not found');
      }

      // Update application status
      let newStatus = 'pending';
      if (action === 'approve') {
        newStatus = 'approved';
      } else if (action === 'reject') {
        newStatus = 'rejected';
      } else if (action === 'request_changes') {
        newStatus = 'requires_changes';
      }

      const { data: updatedApp, error: updateError } = await supabase
        .from('launchpad_vetting_applications')
        .update({
          status: newStatus,
          reviewed_by: adminAddress,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          rejection_reason: action === 'reject' ? rejectionReason : null
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // If approved, grant vetted badge to launchpad
      if (action === 'approve' && application.launchpads) {
        const { error: vettedError } = await supabase
          .from('launchpads')
          .update({
            is_vetted: true,
            vetted_at: new Date().toISOString(),
            vetted_by: adminAddress,
            vetting_notes: adminNotes
          })
          .eq('id', application.launchpads.id);

        if (vettedError) {
          console.error('Error granting vetted badge:', vettedError);
        }
      }

      return {
        success: true,
        application: updatedApp,
        message: `Application ${action}d successfully`
      };
    } catch (error) {
      console.error('Error reviewing application:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Approve vetting application
   * @param {string} applicationId - Application ID
   * @param {string} adminAddress - Admin wallet address
   * @param {string} adminNotes - Optional notes
   * @returns {Promise<Object>} Approval result
   */
  async approveApplication(applicationId, adminAddress, adminNotes = '') {
    return this.reviewApplication(applicationId, adminAddress, {
      action: 'approve',
      adminNotes
    });
  }

  /**
   * Reject vetting application
   * @param {string} applicationId - Application ID
   * @param {string} adminAddress - Admin wallet address
   * @param {string} rejectionReason - Reason for rejection
   * @param {string} adminNotes - Optional notes
   * @returns {Promise<Object>} Rejection result
   */
  async rejectApplication(applicationId, adminAddress, rejectionReason, adminNotes = '') {
    return this.reviewApplication(applicationId, adminAddress, {
      action: 'reject',
      rejectionReason,
      adminNotes
    });
  }

  /**
   * Request changes to application
   * @param {string} applicationId - Application ID
   * @param {string} adminAddress - Admin wallet address
   * @param {string} adminNotes - What needs to be changed
   * @returns {Promise<Object>} Request result
   */
  async requestChanges(applicationId, adminAddress, adminNotes) {
    return this.reviewApplication(applicationId, adminAddress, {
      action: 'request_changes',
      adminNotes
    });
  }

  // ============================================================================
  // VETTED BADGE MANAGEMENT
  // ============================================================================

  /**
   * Grant vetted badge to launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} adminAddress - Admin wallet address
   * @param {string} notes - Vetting notes
   * @returns {Promise<Object>} Grant result
   */
  async grantVettedBadge(launchpadId, adminAddress, notes = '') {
    try {
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Not authorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('launchpads')
        .update({
          is_vetted: true,
          vetted_at: new Date().toISOString(),
          vetted_by: adminAddress,
          vetting_notes: notes
        })
        .eq('id', launchpadId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad: data,
        message: 'Vetted badge granted successfully'
      };
    } catch (error) {
      console.error('Error granting vetted badge:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Revoke vetted badge from launchpad
   * @param {string} launchpadId - Launchpad ID
   * @param {string} adminAddress - Admin wallet address
   * @param {string} reason - Reason for revocation
   * @returns {Promise<Object>} Revoke result
   */
  async revokeVettedBadge(launchpadId, adminAddress, reason) {
    try {
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Not authorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('launchpads')
        .update({
          is_vetted: false,
          vetted_at: null,
          vetted_by: null,
          vetting_notes: `Revoked by ${adminAddress}: ${reason}`
        })
        .eq('id', launchpadId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad: data,
        message: 'Vetted badge revoked successfully'
      };
    } catch (error) {
      console.error('Error revoking vetted badge:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // LAUNCHPAD MODERATION
  // ============================================================================

  /**
   * Force cancel a launchpad (admin moderation)
   * @param {string} launchpadId - Launchpad ID
   * @param {string} adminAddress - Admin wallet address
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async forceCancelLaunchpad(launchpadId, adminAddress, reason) {
    try {
      if (!this.isAdmin(adminAddress)) {
        throw new Error('Not authorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('launchpads')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: adminAddress,
          cancellation_reason: `ADMIN MODERATION: ${reason}`
        })
        .eq('id', launchpadId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        launchpad: data,
        message: 'Launchpad cancelled by admin'
      };
    } catch (error) {
      console.error('Error force cancelling launchpad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all launchpads (admin view)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} All launchpads
   */
  async getAllLaunchpads(filters = {}) {
    try {
      const { status, vetted, sortBy = 'created_at' } = filters;

      let query = supabase
        .from('launchpads')
        .select(`
          *,
          collections (
            name,
            symbol,
            cover_image,
            verified
          )
        `);

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

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
      console.error('Error getting all launchpads:', error);
      return {
        success: false,
        error: error.message,
        launchpads: []
      };
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  /**
   * Get vetting application statistics
   * @returns {Promise<Object>} Application stats
   */
  async getApplicationStats() {
    try {
      // Total applications
      const { count: total } = await supabase
        .from('launchpad_vetting_applications')
        .select('id', { count: 'exact' });

      // Pending applications
      const { count: pending } = await supabase
        .from('launchpad_vetting_applications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      // Under review
      const { count: underReview } = await supabase
        .from('launchpad_vetting_applications')
        .select('id', { count: 'exact' })
        .eq('status', 'under_review');

      // Approved
      const { count: approved } = await supabase
        .from('launchpad_vetting_applications')
        .select('id', { count: 'exact' })
        .eq('status', 'approved');

      // Rejected
      const { count: rejected } = await supabase
        .from('launchpad_vetting_applications')
        .select('id', { count: 'exact' })
        .eq('status', 'rejected');

      // Requires changes
      const { count: requiresChanges } = await supabase
        .from('launchpad_vetting_applications')
        .select('id', { count: 'exact' })
        .eq('status', 'requires_changes');

      return {
        success: true,
        stats: {
          total,
          pending,
          underReview,
          approved,
          rejected,
          requiresChanges,
          approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get overall launchpad statistics
   * @returns {Promise<Object>} Platform-wide stats
   */
  async getPlatformStats() {
    try {
      // Total launchpads
      const { count: totalLaunchpads } = await supabase
        .from('launchpads')
        .select('id', { count: 'exact' });

      // Active launchpads
      const { count: activeLaunchpads } = await supabase
        .from('launchpads')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      // Vetted launchpads
      const { count: vettedLaunchpads } = await supabase
        .from('launchpads')
        .select('id', { count: 'exact' })
        .eq('is_vetted', true);

      // Total mints across all launchpads
      const { count: totalMints } = await supabase
        .from('launchpad_mints')
        .select('id', { count: 'exact' });

      // Total revenue
      const { data: revenueData } = await supabase
        .from('launchpads')
        .select('total_raised');

      const totalRevenue = revenueData?.reduce((sum, l) => sum + parseFloat(l.total_raised || 0), 0) || 0;

      // Unique participants
      const { data: mintsData } = await supabase
        .from('launchpad_mints')
        .select('minter_address');

      const uniqueParticipants = new Set(mintsData?.map(m => m.minter_address) || []).size;

      return {
        success: true,
        stats: {
          totalLaunchpads,
          activeLaunchpads,
          vettedLaunchpads,
          totalMints,
          totalRevenue,
          uniqueParticipants,
          vettingRate: totalLaunchpads > 0 ? ((vettedLaunchpads / totalLaunchpads) * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get recent admin activity
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivity(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('launchpad_vetting_applications')
        .select(`
          id,
          status,
          reviewed_by,
          reviewed_at,
          admin_notes,
          launchpads (
            name
          )
        `)
        .not('reviewed_by', 'is', null)
        .order('reviewed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        activities: data
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {
        success: false,
        error: error.message,
        activities: []
      };
    }
  }
}

export const adminLaunchpadService = new AdminLaunchpadService();

