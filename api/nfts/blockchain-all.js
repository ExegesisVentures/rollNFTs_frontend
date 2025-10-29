// API Endpoint: Get ALL NFTs from Coreum Blockchain
// File: api/nfts/blockchain-all.js
// Vercel Serverless Function
// Fetches NFTs directly from Coreum blockchain for real-time marketplace

const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { page = 1, limit = 20, collection_id } = req.query;
    
    console.log(`📡 Fetching NFTs from Coreum blockchain - Page: ${page}, Limit: ${limit}`);

    // If collection_id is specified, fetch from that collection
    if (collection_id) {
      const nfts = await fetchNFTsFromCollection(collection_id, parseInt(page), parseInt(limit));
      return res.status(200).json({
        success: true,
        data: nfts.data,
        pagination: nfts.pagination,
        source: 'blockchain'
      });
    }

    // Otherwise, fetch from all collections
    const allNFTs = await fetchAllNFTsFromBlockchain(parseInt(page), parseInt(limit));
    
    // Cache for 2 minutes (blockchain data changes less frequently)
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      data: allNFTs.data,
      pagination: allNFTs.pagination,
      source: 'blockchain'
    });
  } catch (error) {
    console.error('Error fetching NFTs from blockchain:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
}

// Fetch NFTs from a specific collection with pagination
async function fetchNFTsFromCollection(classId, page = 1, limit = 20) {
  try {
    const allNFTs = [];
    let nextKey = null;
    let fetchedCount = 0;
    const startIndex = (page - 1) * limit;
    let currentIndex = 0;

    // Keep fetching until we have enough NFTs for this page
    do {
      let url = `${COREUM_REST}/cosmos/nft/v1beta1/nfts?class_id=${classId}&pagination.limit=100`;
      if (nextKey) {
        url += `&pagination.key=${encodeURIComponent(nextKey)}`;
      }

      const response = await fetch(url);
      if (!response.ok) break;

      const data = await response.json();
      
      if (data.nfts && data.nfts.length > 0) {
        for (const nft of data.nfts) {
          if (currentIndex >= startIndex && fetchedCount < limit) {
            const parsed = await parseNFTData(nft, classId);
            if (parsed) {
              allNFTs.push(parsed);
              fetchedCount++;
            }
          }
          currentIndex++;
          if (fetchedCount >= limit) break;
        }
      }

      nextKey = data.pagination?.next_key;
      
      if (fetchedCount >= limit) break;
      
    } while (nextKey);

    return {
      data: allNFTs,
      pagination: {
        page,
        limit,
        total: currentIndex,
        hasMore: !!nextKey || currentIndex > (page * limit)
      }
    };
  } catch (error) {
    console.error(`Failed to fetch NFTs from collection ${classId}:`, error);
    return { data: [], pagination: { page, limit, total: 0, hasMore: false } };
  }
}

// Fetch NFTs from ALL collections
async function fetchAllNFTsFromBlockchain(page = 1, limit = 20) {
  try {
    console.log('🔄 Fetching all NFT classes first...');
    
    // First, get all NFT classes
    const classes = await fetchAllNFTClasses();
    console.log(`✅ Found ${classes.length} NFT classes on Coreum`);
    
    if (classes.length === 0) {
      return {
        data: [],
        pagination: { page, limit, total: 0, hasMore: false }
      };
    }

    const allNFTs = [];
    let totalFetched = 0;
    const startIndex = (page - 1) * limit;
    let currentGlobalIndex = 0;

    // Fetch NFTs from each class until we have enough for this page
    for (const classData of classes) {
      if (totalFetched >= limit) break;
      
      const classId = classData.class?.id || classData.id;
      if (!classId) continue;

      console.log(`📦 Fetching NFTs from class: ${classId}`);
      
      // Fetch NFTs from this class
      let nextKey = null;
      let classPageCount = 0;
      const maxPagesPerClass = 3; // Limit pages per class to avoid timeout

      do {
        classPageCount++;
        
        let url = `${COREUM_REST}/cosmos/nft/v1beta1/nfts?class_id=${classId}&pagination.limit=50`;
        if (nextKey) {
          url += `&pagination.key=${encodeURIComponent(nextKey)}`;
        }

        const response = await fetch(url, { timeout: 5000 });
        if (!response.ok) break;

        const data = await response.json();
        
        if (data.nfts && data.nfts.length > 0) {
          for (const nft of data.nfts) {
            // Check if this NFT should be included in current page
            if (currentGlobalIndex >= startIndex && totalFetched < limit) {
              const parsed = await parseNFTData(nft, classId);
              if (parsed) {
                allNFTs.push(parsed);
                totalFetched++;
              }
            }
            currentGlobalIndex++;
            
            if (totalFetched >= limit) break;
          }
        }

        nextKey = data.pagination?.next_key;
        
        if (totalFetched >= limit) break;
        if (classPageCount >= maxPagesPerClass) break;
        
      } while (nextKey);

      if (totalFetched >= limit) break;
    }

    console.log(`✅ Fetched ${allNFTs.length} NFTs for page ${page}`);

    return {
      data: allNFTs,
      pagination: {
        page,
        limit,
        total: currentGlobalIndex,
        hasMore: currentGlobalIndex > (page * limit)
      }
    };
  } catch (error) {
    console.error('Failed to fetch all NFTs:', error);
    return {
      data: [],
      pagination: { page, limit, total: 0, hasMore: false }
    };
  }
}

// Helper: Fetch all NFT classes from Coreum
async function fetchAllNFTClasses() {
  const allClasses = [];
  let nextKey = null;
  let pageCount = 0;
  const maxPages = 10; // Limit to avoid timeout

  do {
    pageCount++;
    
    let url = `${COREUM_REST}/coreum/asset/nft/v1/classes?pagination.limit=100`;
    if (nextKey) {
      url += `&pagination.key=${encodeURIComponent(nextKey)}`;
    }

    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) break;

    const data = await response.json();
    
    if (data.classes && data.classes.length > 0) {
      allClasses.push(...data.classes);
    }

    nextKey = data.pagination?.next_key;
    
    if (pageCount >= maxPages) break;
    
  } while (nextKey);

  return allClasses;
}

// Helper: Parse NFT data with metadata fetching
async function parseNFTData(nftData, classId) {
  try {
    let metadata = {};
    
    // Try to parse embedded data
    if (nftData.data) {
      try {
        metadata = JSON.parse(nftData.data);
      } catch (e) {
        metadata = { description: nftData.data };
      }
    }

    // If no image and URI exists, try to fetch metadata
    // Note: This can be slow, so we might want to fetch lazily
    if (!metadata.image && nftData.uri) {
      // For now, just store the URI - frontend will handle conversion
      metadata.image = nftData.uri;
    }

    return {
      id: `${classId}-${nftData.id}`, // Composite ID for uniqueness
      collection_id: classId,
      token_id: nftData.id,
      name: metadata.name || nftData.name || `NFT #${nftData.id}`,
      description: metadata.description || '',
      image: metadata.image || nftData.uri || '',
      metadata: metadata,
      metadata_uri: nftData.uri || '',
      owner_address: nftData.owner || '',
      source: 'blockchain'
    };
  } catch (error) {
    console.error('Failed to parse NFT:', error);
    return null;
  }
}

