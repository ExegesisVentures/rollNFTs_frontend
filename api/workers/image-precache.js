// Background Worker: Image Pre-Caching
// File: api/workers/image-precache.js
// Batch processes images to pre-cache in Supabase Storage

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nfts = [] } = req.body;

  if (nfts.length === 0) {
    return res.status(400).json({ error: 'No NFTs provided' });
  }

  console.log(`🖼️ Pre-caching images for ${nfts.length} NFTs`);
  const startTime = Date.now();

  const results = {
    total: nfts.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Process in batches to avoid timeouts
  const BATCH_SIZE = 10;
  const API_BASE = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
    const batch = nfts.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nfts.length / BATCH_SIZE)}`);

    // Process batch in parallel
    const promises = batch.map(async (nft) => {
      if (!nft.image) {
        results.skipped++;
        return;
      }

      try {
        // Pre-cache both thumbnail and full-size
        const [thumbnailRes, fullRes] = await Promise.all([
          // Thumbnail (256x256)
          fetch(`${API_BASE}/api/images/optimize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ipfsUrl: nft.image,
              nftId: nft.id,
              size: 'thumbnail',
            }),
            timeout: 15000,
          }),
          // Full-size (1024px)
          fetch(`${API_BASE}/api/images/optimize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ipfsUrl: nft.image,
              nftId: nft.id,
              size: 'full',
            }),
            timeout: 15000,
          }),
        ]);

        if (thumbnailRes.ok && fullRes.ok) {
          results.success++;
          console.log(`✅ Pre-cached ${nft.id}`);
        } else {
          results.failed++;
          results.errors.push({
            nftId: nft.id,
            error: `HTTP ${thumbnailRes.status}/${fullRes.status}`,
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          nftId: nft.id,
          error: error.message,
        });
        console.warn(`⚠️ Failed to pre-cache ${nft.id}:`, error.message);
      }
    });

    await Promise.allSettled(promises);

    // Small delay between batches to avoid overwhelming the system
    if (i + BATCH_SIZE < nfts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✅ Pre-caching complete in ${duration}ms: ${results.success}/${results.total} successful`);

  return res.status(200).json({
    success: true,
    duration,
    results,
    timestamp: new Date().toISOString(),
  });
}

