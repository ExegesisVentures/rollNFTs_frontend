// Quick Test: Blockchain Sync API
// Run this in browser console on https://rollnfts.vercel.app/collections

async function testBlockchainSync() {
  console.log('🔄 Testing blockchain sync API...');
  
  try {
    const response = await fetch('/api/sync/blockchain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('✅ API Response:', data);
    console.log('');
    console.log(`📊 Collections synced: ${data.collections || 0}`);
    console.log(`📊 Total found: ${data.total_found || 0}`);
    console.log(`📊 Success: ${data.success ? 'YES' : 'NO'}`);
    
    if (data.errors && data.errors.length > 0) {
      console.warn('⚠️ Errors:', data.errors);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testBlockchainSync();

