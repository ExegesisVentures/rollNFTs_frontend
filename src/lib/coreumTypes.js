// Coreum Message Type Definitions
// File: src/lib/coreumTypes.js
// Custom message type encoders for Coreum AssetNFT module

import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { Writer, Reader } from 'protobufjs/minimal';

// Coreum AssetNFT Module Message Types
// Using protobufjs for proper encoding/decoding

const MsgIssueClass = {
  encode(message, writer = Writer.create()) {
    if (message.issuer) {
      writer.uint32(10).string(message.issuer);
    }
    if (message.symbol) {
      writer.uint32(18).string(message.symbol);
    }
    if (message.name) {
      writer.uint32(26).string(message.name);
    }
    if (message.description) {
      writer.uint32(34).string(message.description);
    }
    if (message.uri) {
      writer.uint32(42).string(message.uri);
    }
    if (message.uriHash) {
      writer.uint32(50).string(message.uriHash);
    }
    if (message.data) {
      writer.uint32(58).string(message.data);
    }
    if (message.royaltyRate) {
      writer.uint32(66).string(message.royaltyRate);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof Reader ? input : new Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = {};
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.issuer = reader.string();
          break;
        case 2:
          message.symbol = reader.string();
          break;
        case 3:
          message.name = reader.string();
          break;
        case 4:
          message.description = reader.string();
          break;
        case 5:
          message.uri = reader.string();
          break;
        case 6:
          message.uriHash = reader.string();
          break;
        case 7:
          message.data = reader.string();
          break;
        case 8:
          message.royaltyRate = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object) {
    return object;
  },
};

const MsgMint = {
  encode(message, writer = Writer.create()) {
    if (message.sender) {
      writer.uint32(10).string(message.sender);
    }
    if (message.classId) {
      writer.uint32(18).string(message.classId);
    }
    if (message.id) {
      writer.uint32(26).string(message.id);
    }
    if (message.uri) {
      writer.uint32(34).string(message.uri);
    }
    if (message.uriHash) {
      writer.uint32(42).string(message.uriHash);
    }
    if (message.recipient) {
      writer.uint32(50).string(message.recipient);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof Reader ? input : new Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = {};
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = reader.string();
          break;
        case 2:
          message.classId = reader.string();
          break;
        case 3:
          message.id = reader.string();
          break;
        case 4:
          message.uri = reader.string();
          break;
        case 5:
          message.uriHash = reader.string();
          break;
        case 6:
          message.recipient = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object) {
    return object;
  },
};

export const coreumAssetNFTTypes = [
  ['/coreum.asset.nft.v1.MsgIssueClass', MsgIssueClass],
  ['/coreum.asset.nft.v1.MsgMint', MsgMint],
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

