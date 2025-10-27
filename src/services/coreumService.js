// Coreum Native NFT Service
// File: src/services/coreumService.js
// Handles collection creation and NFT minting using Coreum's native NFT module

import { SigningStargateClient } from '@cosmjs/stargate';
import { createCoreumRegistry, COREUM_MSG_TYPES } from '../lib/coreumTypes';
import toast from 'react-hot-toast';

const COREUM_CHAIN_ID = 'coreum-mainnet-1';
const COREUM_RPC = 'https://full-node.mainnet-1.coreum.dev:26657';
const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

class CoreumService {
  constructor() {
    this.client = null;
    this.registry = createCoreumRegistry();
  }

  // Initialize client with wallet
  async initClient(wallet) {
    try {
      if (!wallet) {
        throw new Error('Wallet not provided');
      }

      const offlineSigner = await wallet.getOfflineSigner(COREUM_CHAIN_ID);
      this.client = await SigningStargateClient.connectWithSigner(
        COREUM_RPC,
        offlineSigner,
        {
          registry: this.registry,
        }
      );

      return this.client;
    } catch (error) {
      console.error('Failed to initialize Coreum client:', error);
      throw error;
    }
  }

  // Create NFT Collection (Class) - Using Coreum AssetNFT Module
  async createCollection(signingClient, collectionData) {
    try {
      // Get accounts from signing client
      const accounts = await signingClient.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in signing client');
      }
      const senderAddress = accounts[0].address;

      // Store client reference
      this.client = signingClient;

      // Use Coreum's AssetNFT module
      const msgValue = {
        issuer: senderAddress,
        symbol: collectionData.symbol,
        name: collectionData.name,
        description: collectionData.description || '',
        uri: collectionData.uri || '', // IPFS metadata URL
        uriHash: '', // Optional
        data: '', // Optional
        features: collectionData.features || [], // Features: [1=burning, 2=freezing, 3=whitelisting, 4=disable_sending]
        royaltyRate: collectionData.royaltyRate || '0', // Royalty in basis points (e.g., "1000" = 10%)
      };

      const msgCreateClass = {
        typeUrl: COREUM_MSG_TYPES.IssueClass,
        value: msgValue,
      };

      // Estimate fee
      const fee = {
        amount: [{ denom: 'ucore', amount: '100000' }], // 0.1 CORE
        gas: '200000',
      };

      // Broadcast transaction
      const result = await this.client.signAndBroadcast(
        senderAddress,
        [msgCreateClass],
        fee,
        'Create NFT Collection'
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      // Generate classId (Coreum format: symbol-issuerAddress)
      const classId = `${collectionData.symbol.toLowerCase()}-${senderAddress}`;

      toast.success('Collection created successfully!');
      return {
        success: true,
        classId: classId,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error(error.message || 'Failed to create collection');
      return { success: false, error: error.message };
    }
  }

  // Mint NFT - Using Coreum AssetNFT Module
  async mintNFT(signingClient, mintData) {
    try {
      // Get accounts from signing client
      const accounts = await signingClient.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in signing client');
      }
      const senderAddress = accounts[0].address;

      // Store client reference
      this.client = signingClient;

      const msgValue = {
        sender: senderAddress,
        classId: mintData.classId,
        id: mintData.tokenId,
        uri: mintData.uri, // IPFS metadata URL
        uriHash: '',
        recipient: mintData.recipient || senderAddress,
      };

      const msgMint = {
        typeUrl: COREUM_MSG_TYPES.Mint,
        value: msgValue,
      };

      const fee = {
        amount: [{ denom: 'ucore', amount: '50000' }], // 0.05 CORE
        gas: '150000',
      };

      const result = await this.client.signAndBroadcast(
        senderAddress,
        [msgMint],
        fee,
        'Mint NFT'
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      toast.success('NFT minted successfully!');
      return {
        success: true,
        tokenId: mintData.tokenId,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      toast.error(error.message || 'Failed to mint NFT');
      return { success: false, error: error.message };
    }
  }

  // Transfer NFT
  async transferNFT(signingClient, transferData) {
    try {
      // Get accounts from signing client
      const accounts = await signingClient.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in signing client');
      }
      const senderAddress = accounts[0].address;

      // Store client reference
      this.client = signingClient;

      const msgSend = {
        typeUrl: COREUM_MSG_TYPES.Send,
        value: {
          classId: transferData.classId,
          id: transferData.tokenId,
          sender: senderAddress,
          receiver: transferData.recipient,
        },
      };

      const fee = {
        amount: [{ denom: 'ucore', amount: '30000' }],
        gas: '100000',
      };

      const result = await this.client.signAndBroadcast(
        senderAddress,
        [msgSend],
        fee,
        'Transfer NFT'
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      toast.success('NFT transferred successfully!');
      return {
        success: true,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      toast.error(error.message || 'Failed to transfer NFT');
      return { success: false, error: error.message };
    }
  }

  // Query NFT ownership
  async queryNFTOwner(classId, tokenId) {
    try {
      const response = await fetch(
        `${COREUM_REST}/cosmos/nft/v1beta1/owner/${classId}/${tokenId}`
      );
      const data = await response.json();
      return data.owner;
    } catch (error) {
      console.error('Failed to query NFT owner:', error);
      return null;
    }
  }

  // Query all NFTs in a collection
  async queryCollectionNFTs(classId) {
    try {
      const response = await fetch(
        `${COREUM_REST}/cosmos/nft/v1beta1/classes/${classId}/nfts`
      );
      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error('Failed to query collection NFTs:', error);
      return [];
    }
  }

  // Query NFT details
  async queryNFT(classId, tokenId) {
    try {
      const response = await fetch(
        `${COREUM_REST}/cosmos/nft/v1beta1/nfts/${classId}/${tokenId}`
      );
      const data = await response.json();
      return data.nft;
    } catch (error) {
      console.error('Failed to query NFT:', error);
      return null;
    }
  }
}

export default new CoreumService();

