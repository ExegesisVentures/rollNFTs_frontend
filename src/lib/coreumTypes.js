// Coreum Message Type Definitions
// File: src/lib/coreumTypes.js
// Custom message type encoders for Coreum AssetNFT module

import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';

// Coreum AssetNFT Module Message Types
// These need to be manually encoded until Coreum publishes official protobuf packages

export const coreumAssetNFTTypes = [
  // MsgIssueClass - Create NFT Collection
  [
    '/coreum.asset.nft.v1.MsgIssueClass',
    {
      aminoType: 'coreum/MsgIssueClass',
      toProto: (value) => {
        // Manual protobuf encoding
        return {
          issuer: value.issuer,
          symbol: value.symbol,
          name: value.name,
          description: value.description || '',
          uri: value.uri || '',
          uriHash: value.uriHash || '',
          data: value.data || '',
          features: value.features || [],
          royaltyRate: value.royaltyRate || '0',
        };
      },
      fromProto: (value) => value,
    },
  ],
  // MsgMint - Mint NFT
  [
    '/coreum.asset.nft.v1.MsgMint',
    {
      aminoType: 'coreum/MsgMint',
      toProto: (value) => {
        return {
          sender: value.sender,
          classId: value.classId,
          id: value.id,
          uri: value.uri || '',
          uriHash: value.uriHash || '',
          recipient: value.recipient,
        };
      },
      fromProto: (value) => value,
    },
  ],
  // MsgBurn - Burn NFT
  [
    '/coreum.asset.nft.v1.MsgBurn',
    {
      aminoType: 'coreum/MsgBurn',
      toProto: (value) => {
        return {
          sender: value.sender,
          classId: value.classId,
          id: value.id,
        };
      },
      fromProto: (value) => value,
    },
  ],
];

// Create registry with Coreum types
export function createCoreumRegistry() {
  return new Registry([...defaultRegistryTypes, ...coreumAssetNFTTypes]);
}

// Message type URLs
export const COREUM_MSG_TYPES = {
  IssueClass: '/coreum.asset.nft.v1.MsgIssueClass',
  Mint: '/coreum.asset.nft.v1.MsgMint',
  Burn: '/coreum.asset.nft.v1.MsgBurn',
  Send: '/cosmos.nft.v1beta1.MsgSend', // Standard Cosmos NFT transfer
};

export default {
  coreumAssetNFTTypes,
  createCoreumRegistry,
  COREUM_MSG_TYPES,
};

