// User Profile Service
// File: src/services/profileService.js

import { supabase } from '../lib/supabase';

class ProfileService {
  /**
   * Get user profile by wallet address
   */
  async getProfile(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          return await this.createDefaultProfile(walletAddress);
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create default profile for new user
   */
  async createDefaultProfile(walletAddress) {
    try {
      const displayName = `User ${walletAddress.slice(0, 8)}`;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          wallet_address: walletAddress,
          display_name: displayName,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating default profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(walletAddress, updates) {
    try {
      // Validate username uniqueness if updating username
      if (updates.username) {
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('wallet_address')
          .eq('username', updates.username)
          .neq('wallet_address', walletAddress)
          .single();

        if (existing) {
          return { success: false, error: 'Username already taken' };
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user stats (call after transactions)
   */
  async updateUserStats(walletAddress) {
    try {
      // Get sales count and volume
      const { data: salesData } = await supabase
        .from('sales')
        .select('price')
        .eq('seller_address', walletAddress);

      // Get purchases count
      const { data: purchasesData } = await supabase
        .from('sales')
        .select('price')
        .eq('buyer_address', walletAddress);

      const totalSales = salesData?.length || 0;
      const totalPurchases = purchasesData?.length || 0;
      const totalVolume = salesData?.reduce((sum, sale) => sum + parseFloat(sale.price), 0) || 0;

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          total_sales: totalSales,
          total_purchases: totalPurchases,
          total_volume: totalVolume,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating user stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(walletAddress, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Add user activity
   */
  async addActivity(activityData) {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error adding activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user favorites
   */
  async getFavorites(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('favorited_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting favorites:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Add to favorites
   */
  async addFavorite(walletAddress, nftTokenId, collectionId) {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          wallet_address: walletAddress,
          nft_token_id: nftTokenId,
          collection_id: collectionId,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove from favorites
   */
  async removeFavorite(walletAddress, nftTokenId) {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('nft_token_id', nftTokenId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(walletAddress, unreadOnly = false) {
    try {
      let query = supabase
        .from('user_notifications')
        .select('*')
        .eq('wallet_address', walletAddress);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking notification read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(walletAddress) {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('wallet_address', walletAddress)
        .eq('read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user following list
   */
  async getFollowing(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('user_following')
        .select('following_address, followed_at')
        .eq('follower_address', walletAddress)
        .order('followed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting following:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get user followers
   */
  async getFollowers(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('user_following')
        .select('follower_address, followed_at')
        .eq('following_address', walletAddress)
        .order('followed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting followers:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerAddress, followingAddress) {
    try {
      const { data, error } = await supabase
        .from('user_following')
        .insert({
          follower_address: followerAddress,
          following_address: followingAddress,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerAddress, followingAddress) {
    try {
      const { error } = await supabase
        .from('user_following')
        .delete()
        .eq('follower_address', followerAddress)
        .eq('following_address', followingAddress);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerAddress, followingAddress) {
    try {
      const { data, error } = await supabase
        .from('user_following')
        .select('id')
        .eq('follower_address', followerAddress)
        .eq('following_address', followingAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { success: true, isFollowing: !!data };
    } catch (error) {
      console.error('Error checking following status:', error);
      return { success: false, error: error.message, isFollowing: false };
    }
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(walletAddress) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('wallet_address', walletAddress);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating last seen:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload profile avatar to Supabase Storage
   */
  async uploadAvatar(walletAddress, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${walletAddress}/avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('nft-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('nft-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile(walletAddress, { avatar_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload profile banner to Supabase Storage
   */
  async uploadBanner(walletAddress, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${walletAddress}/banner.${fileExt}`;
      const filePath = `banners/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('nft-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('nft-images')
        .getPublicUrl(filePath);

      // Update profile with new banner URL
      await this.updateProfile(walletAddress, { banner_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading banner:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search profiles by username or display name
   */
  async searchProfiles(query, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_address, username, display_name, avatar_url, bio')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq('profile_visibility', 'public')
        .limit(limit);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error searching profiles:', error);
      return { success: false, error: error.message, data: [] };
    }
  }
}

export default new ProfileService();

