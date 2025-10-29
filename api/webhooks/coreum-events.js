// Blockchain Event Webhook
// File: api/webhooks/coreum-events.js
// Receives real-time events from Coreum blockchain
// In production, configure Coreum node to send events here

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Verify webhook signature (security)
  const signature = req.headers['x-coreum-signature'];
  const webhookSecret = process.env.COREUM_WEBHOOK_SECRET;
  
  // TODO: Implement proper signature verification
  if (webhookSecret && signature !== webhookSecret) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_type, data } = req.body;

    console.log(`📡 Received blockchain event: ${event_type}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event_type) {
      case 'nft.mint':
        await handleNFTMint(data, supabase);
        break;

      case 'nft.transfer':
        await handleNFTTransfer(data, supabase);
        break;

      case 'nft.burn':
        await handleNFTBurn(data, supabase);
        break;

      case 'class.create':
        await handleClassCreate(data, supabase);
        break;

      default:
        console.log(`⚠️ Unknown event type: ${event_type}`);
    }

    return res.status(200).json({
      success: true,
      event_type,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Handle NFT mint event
async function handleNFTMint(data, supabase) {
  const { class_id, token_id, owner, uri, metadata } = data;

  console.log(`🎨 Processing NFT mint: ${class_id}/${token_id}`);

  try {
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch (e) {
        parsedMetadata = { raw: metadata };
      }
    }

    const nft = {
      collection_id: class_id,
      token_id,
      name: parsedMetadata.name || token_id,
      description: parsedMetadata.description || '',
      image: parsedMetadata.image || uri || '',
      metadata: parsedMetadata,
      metadata_uri: uri || '',
      owner_address: owner,
      synced_from_blockchain: true,
      last_synced_at: new Date().toISOString(),
      minted_at: new Date().toISOString(),
    };

    // Upsert NFT
    const { error } = await supabase
      .from('nfts')
      .upsert(nft, {
        onConflict: 'collection_id,token_id',
      });

    if (error) {
      console.error('Failed to save NFT:', error);
    } else {
      console.log(`✅ Saved NFT: ${class_id}/${token_id}`);

      // Trigger image pre-cache (fire and forget)
      if (nft.image) {
        triggerImagePreCache([{
          id: `${class_id}-${token_id}`,
          image: nft.image,
        }]);
      }
    }
  } catch (error) {
    console.error('Failed to handle NFT mint:', error);
  }
}

// Handle NFT transfer event
async function handleNFTTransfer(data, supabase) {
  const { class_id, token_id, from, to } = data;

  console.log(`🔄 Processing NFT transfer: ${class_id}/${token_id} from ${from} to ${to}`);

  try {
    const { error } = await supabase
      .from('nfts')
      .update({
        owner_address: to,
        last_synced_at: new Date().toISOString(),
      })
      .eq('collection_id', class_id)
      .eq('token_id', token_id);

    if (error) {
      console.error('Failed to update NFT owner:', error);
    } else {
      console.log(`✅ Updated NFT owner: ${class_id}/${token_id}`);
    }
  } catch (error) {
    console.error('Failed to handle NFT transfer:', error);
  }
}

// Handle NFT burn event
async function handleNFTBurn(data, supabase) {
  const { class_id, token_id } = data;

  console.log(`🔥 Processing NFT burn: ${class_id}/${token_id}`);

  try {
    // Mark as burned (or delete)
    const { error } = await supabase
      .from('nfts')
      .update({
        owner_address: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('collection_id', class_id)
      .eq('token_id', token_id);

    if (error) {
      console.error('Failed to mark NFT as burned:', error);
    } else {
      console.log(`✅ Marked NFT as burned: ${class_id}/${token_id}`);
    }
  } catch (error) {
    console.error('Failed to handle NFT burn:', error);
  }
}

// Handle new collection creation
async function handleClassCreate(data, supabase) {
  const { class_id, name, symbol, issuer, uri } = data;

  console.log(`📦 Processing new collection: ${class_id}`);

  try {
    const collection = {
      collection_id: class_id,
      name: name || symbol || class_id,
      symbol: symbol || '',
      creator_address: issuer,
      metadata_uri: uri || '',
      synced_from_blockchain: true,
      last_synced_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('collections')
      .upsert(collection, {
        onConflict: 'collection_id',
      });

    if (error) {
      console.error('Failed to save collection:', error);
    } else {
      console.log(`✅ Saved collection: ${class_id}`);
    }
  } catch (error) {
    console.error('Failed to handle class create:', error);
  }
}

// Trigger image pre-cache (fire and forget)
function triggerImagePreCache(nfts) {
  const API_BASE = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  fetch(`${API_BASE}/api/workers/image-precache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ nfts }),
  }).catch(err => console.warn('Pre-cache trigger failed:', err));
}

