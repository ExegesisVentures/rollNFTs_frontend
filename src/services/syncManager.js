// Sync Manager Service
// File: src/services/syncManager.js
// Orchestrates all blockchain syncing and image pre-caching

class SyncManager {
  constructor() {
    this.syncing = false;
    this.lastSync = null;
    this.listeners = [];
  }

  /**
   * Check if initial sync is needed
   * @returns {Promise<boolean>}
   */
  async needsInitialSync() {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      
      // If we have no collections in database, we need initial sync
      return !data.success || !data.data || data.data.length === 0;
    } catch (error) {
      console.error('Failed to check sync status:', error);
      return true; // Assume we need sync if check fails
    }
  }

  /**
   * Trigger initial blockchain sync
   * @returns {Promise<Object>}
   */
  async triggerInitialSync() {
    if (this.syncing) {
      console.log('⚠️ Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncing = true;
    this.notifyListeners({ status: 'syncing', message: 'Syncing blockchain data...' });

    try {
      console.log('🔄 Triggering initial blockchain sync...');

      // Call the sync endpoint
      const response = await fetch('/api/sync/blockchain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncNFTs: true, // Sync NFTs too
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      
      this.lastSync = new Date();
      this.notifyListeners({ 
        status: 'complete', 
        message: `Synced ${result.collections} collections, ${result.nfts} NFTs`,
        result,
      });

      console.log('✅ Initial sync complete:', result);
      return result;

    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      this.notifyListeners({ 
        status: 'error', 
        message: error.message,
      });
      throw error;
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Subscribe to sync status updates
   * @param {Function} listener - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onSyncUpdate(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of sync status change
   * @param {Object} status
   */
  notifyListeners(status) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Get sync status
   * @returns {Object}
   */
  getStatus() {
    return {
      syncing: this.syncing,
      lastSync: this.lastSync,
    };
  }
}

export default new SyncManager();

