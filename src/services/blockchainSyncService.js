// Coreum Blockchain Sync Service
// File: src/services/blockchainSyncService.js
// Syncs all NFT collections and NFTs from Coreum blockchain to database

const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

class BlockchainSyncService {
  /**
   * Fetch all NFT classes from Coreum blockchain
   * Uses pagination to get all classes
   */
  async fetchAllNFTClasses() {
    try {
      console.log('🔄 Fetching all NFT classes from Coreum blockchain...');
      
      const allClasses = [];
      let nextKey = null;
      let pageCount = 0;
      const maxPages = 100; // Safety limit
      
      do {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount}...`);
        
        // Build pagination query
        let url = `${COREUM_REST}/coreum/asset/nft/v1/classes?pagination.limit=100`;
        if (nextKey) {
          url += `&pagination.key=${encodeURIComponent(nextKey)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ HTTP error! status: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.classes && data.classes.length > 0) {
          console.log(`✅ Found ${data.classes.length} classes on page ${pageCount}`);
          allClasses.push(...data.classes);
        }
        
        // Get next page key
        nextKey = data.pagination?.next_key;
        
        // Safety check
        if (pageCount >= maxPages) {
          console.warn('⚠️ Reached max page limit');
          break;
        }
        
      } while (nextKey);
      
      console.log(`✅ Total NFT classes found: ${allClasses.length}`);
      return allClasses;
      
    } catch (error) {
      console.error('❌ Failed to fetch NFT classes:', error);
      throw error;
    }
  }

  /**
   * Fetch all NFTs in a specific class
   */
  async fetchNFTsInClass(classId) {
    try {
      console.log(`🔄 Fetching NFTs for class: ${classId}`);
      
      const allNFTs = [];
      let nextKey = null;
      let pageCount = 0;
      const maxPages = 100; // Safety limit
      
      do {
        pageCount++;
        
        let url = `${COREUM_REST}/cosmos/nft/v1beta1/nfts?class_id=${classId}&pagination.limit=100`;
        if (nextKey) {
          url += `&pagination.key=${encodeURIComponent(nextKey)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ HTTP error for class ${classId}! status: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.nfts && data.nfts.length > 0) {
          allNFTs.push(...data.nfts);
        }
        
        nextKey = data.pagination?.next_key;
        
        if (pageCount >= maxPages) break;
        
      } while (nextKey);
      
      console.log(`✅ Found ${allNFTs.length} NFTs in class ${classId}`);
      return allNFTs;
      
    } catch (error) {
      console.error(`❌ Failed to fetch NFTs for class ${classId}:`, error);
      return [];
    }
  }

  /**
   * Parse class data to collection format
   */
  parseClassToCollection(classData) {
    try {
      const classInfo = classData.class || classData;
      
      // Parse metadata if it's JSON
      let metadata = {};
      if (classInfo.data) {
        try {
          metadata = JSON.parse(classInfo.data);
        } catch (e) {
          // If not JSON, treat as description
          metadata = { description: classInfo.data };
        }
      }
      
      return {
        collection_id: classInfo.id,
        name: classInfo.name || classInfo.symbol || classInfo.id,
        symbol: classInfo.symbol || '',
        description: metadata.description || classInfo.description || '',
        cover_image: metadata.image || metadata.cover_image || '',
        banner_image: metadata.banner_image || '',
        creator_address: classInfo.issuer || '',
        metadata_uri: classInfo.uri || '',
        features_burning: classInfo.features?.includes('burning') || false,
        features_freezing: classInfo.features?.includes('freezing') || false,
        features_whitelisting: classInfo.features?.includes('whitelisting') || false,
        features_disable_sending: classInfo.features?.includes('disable_sending') || false,
        royalty_bps: classInfo.royalty_rate ? parseInt(classInfo.royalty_rate) : 0,
        synced_from_blockchain: true,
        last_synced_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to parse class data:', error);
      return null;
    }
  }

  /**
   * Parse NFT data to database format
   */
  parseNFTData(nftData, classId) {
    try {
      // Parse metadata if it's JSON
      let metadata = {};
      if (nftData.data) {
        try {
          metadata = JSON.parse(nftData.data);
        } catch (e) {
          metadata = { description: nftData.data };
        }
      }
      
      return {
        collection_id: classId,
        token_id: nftData.id,
        name: metadata.name || nftData.name || nftData.id,
        description: metadata.description || '',
        image: metadata.image || '',
        metadata_uri: nftData.uri || '',
        owner_address: nftData.owner || '',
        synced_from_blockchain: true,
        last_synced_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to parse NFT data:', error);
      return null;
    }
  }

  /**
   * Sync all collections and NFTs to database
   * This is the main sync function
   */
  async syncAllToDatabase() {
    try {
      console.log('🚀 Starting full blockchain sync...');
      
      // Fetch all classes from blockchain
      const classes = await this.fetchAllNFTClasses();
      
      if (!classes || classes.length === 0) {
        console.log('ℹ️ No NFT classes found on blockchain');
        return {
          success: true,
          collections: 0,
          nfts: 0,
        };
      }
      
      let collectionsCount = 0;
      let nftsCount = 0;
      
      // Process each class
      for (const classData of classes) {
        try {
          const collection = this.parseClassToCollection(classData);
          
          if (!collection) continue;
          
          // Store collection info for API call
          collectionsCount++;
          
          // Also fetch NFTs in this class (optional, can be slow)
          // const nfts = await this.fetchNFTsInClass(collection.collection_id);
          // nftsCount += nfts.length;
          
        } catch (error) {
          console.error(`❌ Failed to process class:`, error);
        }
      }
      
      console.log(`✅ Sync complete! Collections: ${collectionsCount}, NFTs: ${nftsCount}`);
      
      return {
        success: true,
        collections: collectionsCount,
        nfts: nftsCount,
        data: classes.map(c => this.parseClassToCollection(c)).filter(Boolean),
      };
      
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync single collection by class ID
   */
  async syncCollection(classId) {
    try {
      console.log(`🔄 Syncing collection: ${classId}`);
      
      // Fetch class details
      const response = await fetch(`${COREUM_REST}/coreum/asset/nft/v1/classes/${classId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch class ${classId}`);
      }
      
      const data = await response.json();
      const collection = this.parseClassToCollection(data);
      
      if (!collection) {
        throw new Error('Failed to parse collection data');
      }
      
      // Fetch NFTs in this collection
      const nfts = await this.fetchNFTsInClass(classId);
      const parsedNFTs = nfts
        .map(nft => this.parseNFTData(nft, classId))
        .filter(Boolean);
      
      console.log(`✅ Synced collection ${classId}: ${parsedNFTs.length} NFTs`);
      
      return {
        success: true,
        collection,
        nfts: parsedNFTs,
      };
      
    } catch (error) {
      console.error(`❌ Failed to sync collection ${classId}:`, error);
      throw error;
    }
  }
}

export default new BlockchainSyncService();

