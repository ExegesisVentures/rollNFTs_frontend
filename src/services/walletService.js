// Comprehensive Wallet Service for Keplr, Leap, and Cosmostation
// File: src/services/walletService.js

import { SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { coreumRegistry } from 'coreum-js';

// Coreum Chain Configuration
const COREUM_CHAIN_CONFIG = {
  chainId: import.meta.env.VITE_COREUM_CHAIN_ID || 'coreum-mainnet-1',
  chainName: 'Coreum',
  rpc: import.meta.env.VITE_COREUM_RPC || 'https://full-node.mainnet-1.coreum.dev:26657',
  rest: import.meta.env.VITE_COREUM_REST || 'https://full-node.mainnet-1.coreum.dev:1317',
  bip44: {
    coinType: 990,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'core',
    bech32PrefixAccPub: 'corepub',
    bech32PrefixValAddr: 'corevaloper',
    bech32PrefixValPub: 'corevaloperpub',
    bech32PrefixConsAddr: 'corevalcons',
    bech32PrefixConsPub: 'corevalconspub',
  },
  currencies: [
    {
      coinDenom: 'COREUM',
      coinMinimalDenom: 'ucore',
      coinDecimals: 6,
      coinGeckoId: 'coreum',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'COREUM',
      coinMinimalDenom: 'ucore',
      coinDecimals: 6,
      coinGeckoId: 'coreum',
      gasPriceStep: {
        low: 0.0625,
        average: 0.1,
        high: 62.5,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'COREUM',
    coinMinimalDenom: 'ucore',
    coinDecimals: 6,
    coinGeckoId: 'coreum',
  },
  features: ['cosmwasm', 'ibc-transfer', 'ibc-go'],
};

// Wallet Types
export const WALLET_TYPES = {
  KEPLR: 'keplr',
  LEAP: 'leap',
  COSMOSTATION: 'cosmostation',
};

// Wallet Service Class
class WalletService {
  constructor() {
    this.currentWallet = null;
    this.currentWalletType = null;
    this.signingClient = null;
  }

  // Check if wallet is available
  isWalletAvailable(walletType) {
    switch (walletType) {
      case WALLET_TYPES.KEPLR:
        return typeof window !== 'undefined' && !!window.keplr;
      case WALLET_TYPES.LEAP:
        return typeof window !== 'undefined' && !!window.leap;
      case WALLET_TYPES.COSMOSTATION:
        return typeof window !== 'undefined' && !!window.cosmostation;
      default:
        return false;
    }
  }

  // Get all available wallets
  getAvailableWallets() {
    const wallets = [];
    if (this.isWalletAvailable(WALLET_TYPES.KEPLR)) {
      wallets.push({
        type: WALLET_TYPES.KEPLR,
        name: 'Keplr',
        icon: '🔵',
      });
    }
    if (this.isWalletAvailable(WALLET_TYPES.LEAP)) {
      wallets.push({
        type: WALLET_TYPES.LEAP,
        name: 'Leap',
        icon: '🟣',
      });
    }
    if (this.isWalletAvailable(WALLET_TYPES.COSMOSTATION)) {
      wallets.push({
        type: WALLET_TYPES.COSMOSTATION,
        name: 'Cosmostation',
        icon: '🟠',
      });
    }
    return wallets;
  }

  // Get wallet provider
  getWalletProvider(walletType) {
    switch (walletType) {
      case WALLET_TYPES.KEPLR:
        return window.keplr;
      case WALLET_TYPES.LEAP:
        return window.leap;
      case WALLET_TYPES.COSMOSTATION:
        return window.cosmostation;
      default:
        return null;
    }
  }

  // Suggest chain to wallet
  async suggestChain(walletType) {
    const provider = this.getWalletProvider(walletType);
    if (!provider) {
      throw new Error(`${walletType} wallet not found`);
    }

    try {
      // Different wallets have different methods
      if (walletType === WALLET_TYPES.COSMOSTATION) {
        // Cosmostation doesn't have experimentalSuggestChain
        // It should already support Coreum
        return;
      } else {
        // Keplr and Leap support experimentalSuggestChain
        await provider.experimentalSuggestChain(COREUM_CHAIN_CONFIG);
      }
    } catch (error) {
      console.error('Error suggesting chain:', error);
      throw error;
    }
  }

  // Enable wallet connection
  async enable(walletType) {
    const provider = this.getWalletProvider(walletType);
    if (!provider) {
      throw new Error(`${walletType} wallet not found. Please install the extension.`);
    }

    try {
      // Suggest chain first
      await this.suggestChain(walletType);

      // Enable wallet
      if (walletType === WALLET_TYPES.COSMOSTATION) {
        // Cosmostation uses different method
        await provider.cosmos.request({
          method: 'cos_requestAccount',
          params: { chainName: COREUM_CHAIN_CONFIG.chainId },
        });
      } else {
        // Keplr and Leap
        await provider.enable(COREUM_CHAIN_CONFIG.chainId);
      }

      return true;
    } catch (error) {
      console.error('Error enabling wallet:', error);
      throw error;
    }
  }

  // Get account information
  async getAccount(walletType) {
    const provider = this.getWalletProvider(walletType);
    if (!provider) {
      throw new Error(`${walletType} wallet not found`);
    }

    try {
      let account;
      if (walletType === WALLET_TYPES.COSMOSTATION) {
        // Cosmostation method
        account = await provider.cosmos.request({
          method: 'cos_account',
          params: { chainName: COREUM_CHAIN_CONFIG.chainId },
        });
        return {
          address: account.address,
          pubKey: account.publicKey,
        };
      } else {
        // Keplr and Leap
        const key = await provider.getKey(COREUM_CHAIN_CONFIG.chainId);
        return {
          address: key.bech32Address,
          pubKey: key.pubKey,
          name: key.name,
        };
      }
    } catch (error) {
      console.error('Error getting account:', error);
      throw error;
    }
  }

  // Get balance
  async getBalance(address) {
    try {
      const response = await fetch(
        `${COREUM_CHAIN_CONFIG.rest}/cosmos/bank/v1beta1/balances/${address}`
      );
      const data = await response.json();
      
      const ucoreBalance = data.balances?.find(
        (b) => b.denom === 'ucore'
      );
      
      if (ucoreBalance) {
        // Convert ucore to COREUM (divide by 1,000,000)
        const balance = parseFloat(ucoreBalance.amount) / 1000000;
        return balance.toFixed(6);
      }
      
      return '0.000000';
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0.000000';
    }
  }

  // Connect wallet
  async connect(walletType) {
    try {
      // Check if wallet is available
      if (!this.isWalletAvailable(walletType)) {
        throw new Error(`${walletType} wallet is not installed. Please install the extension.`);
      }

      // Enable wallet
      await this.enable(walletType);

      // Get account
      const account = await this.getAccount(walletType);

      // Get balance
      const balance = await this.getBalance(account.address);

      // Store current wallet
      this.currentWallet = account;
      this.currentWalletType = walletType;

      // Setup account change listener
      this.setupAccountListener(walletType);

      return {
        success: true,
        walletType,
        address: account.address,
        balance,
        account,
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect wallet',
      };
    }
  }

  // Setup account change listener
  setupAccountListener(walletType) {
    const provider = this.getWalletProvider(walletType);
    if (!provider) return;

    try {
      if (walletType === WALLET_TYPES.KEPLR || walletType === WALLET_TYPES.LEAP) {
        window.addEventListener('keplr_keystorechange', async () => {
          console.log('Account changed, updating...');
          // Reconnect with same wallet
          if (this.currentWalletType === walletType) {
            const result = await this.connect(walletType);
            // Trigger custom event for React to listen
            window.dispatchEvent(new CustomEvent('walletAccountChanged', { 
              detail: result 
            }));
          }
        });
      } else if (walletType === WALLET_TYPES.COSMOSTATION) {
        // Cosmostation has different event
        window.addEventListener('cosmostation_keystorechange', async () => {
          console.log('Cosmostation account changed, updating...');
          if (this.currentWalletType === walletType) {
            const result = await this.connect(walletType);
            window.dispatchEvent(new CustomEvent('walletAccountChanged', { 
              detail: result 
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error setting up account listener:', error);
    }
  }

  // Disconnect wallet
  disconnect() {
    this.currentWallet = null;
    this.currentWalletType = null;
    this.signingClient = null;
    
    // Clear any stored wallet data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnection');
    }
  }

  // Get signing client
  async getSigningClient(walletType) {
    try {
      const provider = this.getWalletProvider(walletType);
      if (!provider) {
        throw new Error(`${walletType} wallet not found`);
      }

      let offlineSigner;
      if (walletType === WALLET_TYPES.COSMOSTATION) {
        offlineSigner = await provider.cosmos.getOfflineSigner(COREUM_CHAIN_CONFIG.chainId);
      } else {
        offlineSigner = provider.getOfflineSigner(COREUM_CHAIN_CONFIG.chainId);
      }

      const client = await SigningStargateClient.connectWithSigner(
        COREUM_CHAIN_CONFIG.rpc,
        offlineSigner,
        {
          registry: new Registry([...defaultRegistryTypes, ...coreumRegistry]),
        }
      );

      this.signingClient = client;
      return client;
    } catch (error) {
      console.error('Error getting signing client:', error);
      throw error;
    }
  }

  // Sign and broadcast transaction
  async signAndBroadcast(walletType, messages, fee, memo = '') {
    try {
      const client = await this.getSigningClient(walletType);
      const account = await this.getAccount(walletType);

      const result = await client.signAndBroadcast(
        account.address,
        messages,
        fee,
        memo
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      return {
        success: true,
        transactionHash: result.transactionHash,
        height: result.height,
      };
    } catch (error) {
      console.error('Error signing and broadcasting:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Auto-reconnect on page load
  async autoReconnect() {
    try {
      if (typeof window === 'undefined') return null;

      const stored = localStorage.getItem('walletConnection');
      if (!stored) return null;

      const { walletType } = JSON.parse(stored);
      
      // Check if wallet is still available
      if (!this.isWalletAvailable(walletType)) {
        localStorage.removeItem('walletConnection');
        return null;
      }

      // Try to reconnect
      const result = await this.connect(walletType);
      if (result.success) {
        return result;
      } else {
        localStorage.removeItem('walletConnection');
        return null;
      }
    } catch (error) {
      console.error('Auto-reconnect error:', error);
      localStorage.removeItem('walletConnection');
      return null;
    }
  }

  // Save connection state
  saveConnectionState(walletType, address) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletConnection', JSON.stringify({
        walletType,
        address,
        timestamp: Date.now(),
      }));
    }
  }
}

// Create singleton instance
const walletService = new WalletService();

export default walletService;

// Export helpers
export const getWalletIcon = (walletType) => {
  switch (walletType) {
    case WALLET_TYPES.KEPLR:
      return '🔵';
    case WALLET_TYPES.LEAP:
      return '🟣';
    case WALLET_TYPES.COSMOSTATION:
      return '🟠';
    default:
      return '💼';
  }
};

export const getWalletName = (walletType) => {
  switch (walletType) {
    case WALLET_TYPES.KEPLR:
      return 'Keplr';
    case WALLET_TYPES.LEAP:
      return 'Leap';
    case WALLET_TYPES.COSMOSTATION:
      return 'Cosmostation';
    default:
      return 'Unknown';
  }
};



