// Enhanced Wallet State Management with Persistence
// File: src/store/walletStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import walletService from '../services/walletService';

const useWalletStore = create(
  persist(
    (set, get) => ({
      // State
      isConnected: false,
      walletAddress: null,
      walletType: null, // 'keplr', 'leap', or 'cosmostation'
      balance: '0',
      isConnecting: false,
      error: null,
      account: null,

      // Actions
      connect: async (walletType) => {
        set({ isConnecting: true, error: null });
        
        try {
          const result = await walletService.connect(walletType);
          
          if (result.success) {
            // Save connection state
            walletService.saveConnectionState(walletType, result.address);
            
            set({
              isConnected: true,
              walletAddress: result.address,
              walletType: walletType,
              balance: result.balance,
              account: result.account,
              isConnecting: false,
              error: null,
            });
            
            // Start balance polling
            get().startBalancePolling();
            
            return { success: true };
          } else {
            set({
              isConnecting: false,
              error: result.error,
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMsg = error.message || 'Failed to connect wallet';
          set({
            isConnecting: false,
            error: errorMsg,
          });
          return { success: false, error: errorMsg };
        }
      },

      disconnect: () => {
        walletService.disconnect();
        get().stopBalancePolling();
        
        set({
          isConnected: false,
          walletAddress: null,
          walletType: null,
          balance: '0',
          account: null,
          error: null,
        });
      },

      setBalance: (balance) => set({ balance }),

      updateAddress: (address) => set({ walletAddress: address }),

      // Fetch balance
      fetchBalance: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;

        try {
          const balance = await walletService.getBalance(walletAddress);
          set({ balance });
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      },

      // Balance polling
      balancePollingInterval: null,
      
      startBalancePolling: () => {
        // Clear existing interval
        get().stopBalancePolling();
        
        // Fetch immediately
        get().fetchBalance();
        
        // Poll every 10 seconds
        const interval = setInterval(() => {
          get().fetchBalance();
        }, 10000);
        
        set({ balancePollingInterval: interval });
      },

      stopBalancePolling: () => {
        const { balancePollingInterval } = get();
        if (balancePollingInterval) {
          clearInterval(balancePollingInterval);
          set({ balancePollingInterval: null });
        }
      },

      // Auto-reconnect
      autoReconnect: async () => {
        try {
          const result = await walletService.autoReconnect();
          if (result && result.success) {
            set({
              isConnected: true,
              walletAddress: result.address,
              walletType: result.walletType,
              balance: result.balance,
              account: result.account,
            });
            get().startBalancePolling();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Auto-reconnect error:', error);
          return false;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Get wallet provider
      getWalletProvider: () => {
        const { walletType } = get();
        if (!walletType) return null;
        return walletService.getWalletProvider(walletType);
      },

      // Get signing client
      getSigningClient: async () => {
        const { walletType } = get();
        if (!walletType) {
          throw new Error('No wallet connected');
        }
        return await walletService.getSigningClient(walletType);
      },

      // Sign and broadcast transaction
      signAndBroadcast: async (messages, fee, memo = '') => {
        const { walletType } = get();
        if (!walletType) {
          throw new Error('No wallet connected');
        }
        return await walletService.signAndBroadcast(walletType, messages, fee, memo);
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        // Only persist these fields
        isConnected: state.isConnected,
        walletAddress: state.walletAddress,
        walletType: state.walletType,
        balance: state.balance,
      }),
    }
  )
);

// Setup account change listener
if (typeof window !== 'undefined') {
  window.addEventListener('walletAccountChanged', (event) => {
    const { detail } = event;
    if (detail && detail.success) {
      const store = useWalletStore.getState();
      store.connect(detail.walletType);
    }
  });
}

export default useWalletStore;



