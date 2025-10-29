// Test Script: Verify NFT Images Retrieval
// File: test-nft-images.js
// Usage: node test-nft-images.js [collection_id]

const COREUM_REST = 'https://full-node.mainnet-1.coreum.dev:1317';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fetch metadata from URI
async function fetchMetadataFromURI(uri) {
  if (!uri) return null;
  
  try {
    // Convert IPFS URI to HTTP if needed
    let httpUrl = uri;
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      httpUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
    } else if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
      httpUrl = `https://gateway.pinata.cloud/ipfs/${uri}`;
    }
    
    log(`  📥 Fetching metadata from: ${httpUrl}`, 'cyan');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(httpUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      log(`  ⚠️  HTTP ${response.status}: ${response.statusText}`, 'yellow');
      return null;
    }
    
    const metadata = await response.json();
    return metadata;
    
  } catch (error) {
    log(`  ❌ Failed: ${error.message}`, 'red');
    return null;
  }
}

// Fetch collection metadata
async function testCollectionMetadata(classId) {
  try {
    log(`\n${'='.repeat(80)}`, 'bright');
    log(`Testing Collection: ${classId}`, 'bright');
    log('='.repeat(80), 'bright');
    
    // Fetch collection info from blockchain
    const response = await fetch(`${COREUM_REST}/coreum/asset/nft/v1/classes/${classId}`);
    
    if (!response.ok) {
      log(`❌ Failed to fetch collection: HTTP ${response.status}`, 'red');
      return;
    }
    
    const data = await response.json();
    const classInfo = data.class;
    
    log(`\n📦 Collection Info:`, 'blue');
    log(`  Name: ${classInfo.name}`);
    log(`  Symbol: ${classInfo.symbol}`);
    log(`  URI: ${classInfo.uri || 'None'}`);
    log(`  Data: ${classInfo.data ? (classInfo.data.length > 100 ? classInfo.data.substring(0, 100) + '...' : classInfo.data) : 'None'}`);
    
    // Try to parse embedded metadata
    let embeddedMetadata = null;
    if (classInfo.data) {
      try {
        embeddedMetadata = JSON.parse(classInfo.data);
        log(`\n✅ Embedded Metadata (from data field):`, 'green');
        log(`  ${JSON.stringify(embeddedMetadata, null, 2)}`);
      } catch (e) {
        log(`\n⚠️  Data field is not JSON`, 'yellow');
      }
    }
    
    // Fetch metadata from URI if available
    if (classInfo.uri) {
      log(`\n🔄 Fetching metadata from URI...`, 'cyan');
      const uriMetadata = await fetchMetadataFromURI(classInfo.uri);
      
      if (uriMetadata) {
        log(`\n✅ URI Metadata:`, 'green');
        log(`  ${JSON.stringify(uriMetadata, null, 2)}`);
        
        if (uriMetadata.image) {
          log(`\n🖼️  Collection Image URL: ${uriMetadata.image}`, 'green');
        } else {
          log(`\n⚠️  No image found in URI metadata`, 'yellow');
        }
      }
    } else {
      log(`\n⚠️  No URI specified for collection`, 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Error testing collection: ${error.message}`, 'red');
  }
}

// Fetch and test NFTs in a collection
async function testNFTsInCollection(classId, limit = 5) {
  try {
    log(`\n${'='.repeat(80)}`, 'bright');
    log(`Testing NFTs in Collection: ${classId}`, 'bright');
    log('='.repeat(80), 'bright');
    
    // Fetch NFTs from blockchain
    const response = await fetch(
      `${COREUM_REST}/cosmos/nft/v1beta1/nfts?class_id=${classId}&pagination.limit=${limit}`
    );
    
    if (!response.ok) {
      log(`❌ Failed to fetch NFTs: HTTP ${response.status}`, 'red');
      return;
    }
    
    const data = await response.json();
    const nfts = data.nfts || [];
    
    log(`\n📊 Found ${nfts.length} NFTs (showing first ${limit})`, 'blue');
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      log(`\n${'-'.repeat(80)}`, 'cyan');
      log(`NFT #${i + 1}: ${nft.id}`, 'bright');
      log('-'.repeat(80), 'cyan');
      
      log(`  Token ID: ${nft.id}`);
      log(`  Owner: ${nft.owner || 'Unknown'}`);
      log(`  URI: ${nft.uri || 'None'}`);
      log(`  Data: ${nft.data ? (nft.data.length > 100 ? nft.data.substring(0, 100) + '...' : nft.data) : 'None'}`);
      
      // Try to parse embedded metadata
      let embeddedMetadata = null;
      if (nft.data) {
        try {
          embeddedMetadata = JSON.parse(nft.data);
          log(`\n  ✅ Embedded Metadata:`, 'green');
          log(`    ${JSON.stringify(embeddedMetadata, null, 2).split('\n').join('\n    ')}`);
        } catch (e) {
          log(`\n  ⚠️  Data field is not JSON`, 'yellow');
        }
      }
      
      // Fetch metadata from URI if available
      if (nft.uri) {
        log(`\n  🔄 Fetching metadata from URI...`, 'cyan');
        const uriMetadata = await fetchMetadataFromURI(nft.uri);
        
        if (uriMetadata) {
          log(`\n  ✅ URI Metadata:`, 'green');
          log(`    ${JSON.stringify(uriMetadata, null, 2).split('\n').join('\n    ')}`);
          
          if (uriMetadata.image) {
            log(`\n  🖼️  NFT Image URL: ${uriMetadata.image}`, 'green');
            
            // Try to access the image
            try {
              let imageUrl = uriMetadata.image;
              if (imageUrl.startsWith('ipfs://')) {
                const hash = imageUrl.replace('ipfs://', '');
                imageUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
              }
              
              const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
              if (imgResponse.ok) {
                log(`  ✅ Image is accessible (${imgResponse.headers.get('content-type')})`, 'green');
              } else {
                log(`  ⚠️  Image not accessible: HTTP ${imgResponse.status}`, 'yellow');
              }
            } catch (imgError) {
              log(`  ❌ Failed to check image: ${imgError.message}`, 'red');
            }
          } else {
            log(`\n  ⚠️  No image found in URI metadata`, 'yellow');
          }
        }
      } else {
        log(`\n  ⚠️  No URI specified for NFT`, 'yellow');
      }
      
      // Check if image is in embedded metadata
      if (embeddedMetadata?.image) {
        log(`\n  🖼️  Image found in embedded metadata: ${embeddedMetadata.image}`, 'green');
      }
    }
    
    log(`\n${'='.repeat(80)}`, 'bright');
    log('Test Complete', 'bright');
    log('='.repeat(80), 'bright');
    
  } catch (error) {
    log(`\n❌ Error testing NFTs: ${error.message}`, 'red');
  }
}

// List all collections
async function listAllCollections() {
  try {
    log(`\n${'='.repeat(80)}`, 'bright');
    log('Fetching All Collections from Coreum Blockchain', 'bright');
    log('='.repeat(80), 'bright');
    
    const response = await fetch(
      `${COREUM_REST}/coreum/asset/nft/v1/classes?pagination.limit=20`
    );
    
    if (!response.ok) {
      log(`❌ Failed to fetch collections: HTTP ${response.status}`, 'red');
      return [];
    }
    
    const data = await response.json();
    const classes = data.classes || [];
    
    log(`\n📦 Found ${classes.length} collections (showing first 20):\n`, 'blue');
    
    classes.forEach((classData, i) => {
      const classInfo = classData.class || classData;
      log(`${i + 1}. ${classInfo.id}`, 'cyan');
      log(`   Name: ${classInfo.name || 'N/A'}`, 'reset');
      log(`   Symbol: ${classInfo.symbol || 'N/A'}`, 'reset');
      log(`   Has URI: ${classInfo.uri ? '✅' : '❌'}`, classInfo.uri ? 'green' : 'red');
    });
    
    return classes.map(c => (c.class || c).id);
    
  } catch (error) {
    log(`\n❌ Error listing collections: ${error.message}`, 'red');
    return [];
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const collectionId = args[0];
  
  log('\n🚀 NFT Image Retrieval Test', 'bright');
  
  if (!collectionId || collectionId === 'list') {
    // List all collections
    const collections = await listAllCollections();
    
    log(`\n\n💡 Usage:`, 'yellow');
    log(`  node test-nft-images.js <collection_id>`, 'reset');
    log(`\nExample:`, 'yellow');
    if (collections.length > 0) {
      log(`  node test-nft-images.js ${collections[0]}`, 'cyan');
    }
    
  } else {
    // Test specific collection
    await testCollectionMetadata(collectionId);
    await testNFTsInCollection(collectionId, 5);
    
    log(`\n\n💡 Summary:`, 'yellow');
    log(`  ✅ If you see image URLs above, those images should display in your app`, 'green');
    log(`  ⚠️  If no image URLs, the collection may not have proper metadata URIs`, 'yellow');
    log(`  ❌ If images are not accessible, there may be IPFS gateway issues`, 'red');
    log(`\n  Run blockchain sync to import these images into your database:`, 'cyan');
    log(`    POST /api/sync/blockchain`, 'bright');
    log(`    Body: { "syncNFTs": true, "collectionId": "${collectionId}" }`, 'reset');
  }
  
  log('\n');
}

main();

