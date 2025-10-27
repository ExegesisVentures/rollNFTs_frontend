# Free Spin Wheel - Quick Start Guide

## 🎡 Getting Started in 5 Minutes

This guide will help you set up your first spin campaign quickly.

## Prerequisites

- ✅ Supabase project configured
- ✅ RollNFTs app running
- ✅ Wallet connected
- ✅ At least one collection created

## Step 1: Deploy Database Schema (1 minute)

### Option A: Supabase Dashboard

1. Open your Supabase project
2. Go to **SQL Editor**
3. Open `supabase-free-spin-schema.sql`
4. Copy and paste the entire file
5. Click **Run**

### Option B: Command Line

```bash
psql -h your-supabase-host.supabase.co -U postgres -d postgres -f supabase-free-spin-schema.sql
```

✅ You should see: "CREATE TABLE", "CREATE INDEX", "CREATE FUNCTION" messages

## Step 2: Access Admin Panel (30 seconds)

1. Start your app: `npm run dev`
2. Navigate to: `http://localhost:5173/admin/spin-campaigns`
3. Connect your wallet

## Step 3: Create Your First Campaign (2 minutes)

1. Click **"+ Create Campaign"**

2. Fill in the form:
   ```
   Collection: [Select your collection]
   Campaign Name: "Welcome Spin"
   Description: "Spin to win exclusive NFTs!"
   Spins Per Wallet: 1
   Require Whitelist: ❌ (unchecked for testing)
   ```

3. Add Prizes (must sum to 1.0):
   ```
   Prize 1: Label: "Common NFT", Probability: 0.70, Color: #4ECDC4
   Prize 2: Label: "Rare NFT", Probability: 0.25, Color: #FFA07A
   Prize 3: Label: "Legendary NFT", Probability: 0.05, Color: #FFD700
   ```

4. Click **"+ Add Prize"** for each prize
5. Verify probabilities sum to 1.0
6. Click **"Create Campaign"**

✅ You should see: "Campaign created successfully!"

## Step 4: Test the Wheel (1 minute)

### Option A: Via Free Spins Page

1. Navigate to: `http://localhost:5173/free-spins`
2. You should see your campaign card
3. Click on it
4. Click **"SPIN THE WHEEL"**

### Option B: Via Collection Page

1. Navigate to: `http://localhost:5173/collection/YOUR_COLLECTION_ID`
2. Scroll below the banner
3. You should see the spin wheel
4. Click **"SPIN THE WHEEL"**

## Expected Behavior

1. **Before Spin:**
   - ✅ Green badge shows "1 Spin Available"
   - ✅ Button is enabled

2. **During Spin:**
   - 🎡 Wheel rotates 5-7 times
   - ⏱️ Takes 4-5 seconds
   - ✨ Glow effect appears

3. **After Spin:**
   - 🎉 Prize modal appears
   - 📝 Shows what you won
   - 📊 Updates spin count

## Troubleshooting

### Issue: "Campaign not found"

**Solution:** Make sure you're using the correct collection ID

### Issue: "No spins remaining"

**Solution:** Each wallet gets the configured number of spins. Try a different wallet or increase `spins_per_wallet`

### Issue: Wheel doesn't spin

**Solution:** 
1. Check browser console for errors
2. Ensure wallet is connected
3. Verify campaign is active

### Issue: "Probabilities must sum to 1.0"

**Solution:** Adjust your prize probabilities. Example:
- Prize 1: 0.70 (70%)
- Prize 2: 0.25 (25%)
- Prize 3: 0.05 (5%)
- Total: 1.00 ✅

## What's Next?

### Add NFT Prizes

For NFT prizes, you need to populate the inventory:

```javascript
// In browser console or admin panel
const campaignId = 'your-campaign-id';
const nftIds = ['nft-uuid-1', 'nft-uuid-2', 'nft-uuid-3'];

await freeSpinService.addPrizeInventory(campaignId, nftIds);
```

### Enable Whitelist

1. Edit campaign
2. Check "Require Whitelist"
3. Click "Manage Whitelist"
4. Add addresses (one per line):
   ```
   core1abc123...
   core1def456...
   core1ghi789...
   ```

### Customize Appearance

Edit the campaign wheel colors in the prize configuration to match your brand.

## Testing Checklist

- [ ] Campaign appears on `/free-spins` page
- [ ] Campaign appears on collection page
- [ ] Wallet connection works
- [ ] Spin executes successfully
- [ ] Prize modal displays correctly
- [ ] Spin count updates
- [ ] "No spins remaining" message after limit
- [ ] Mobile view works

## Advanced: Production Setup

Before launching to real users:

1. **Set End Date:**
   - Campaigns with no end date run indefinitely
   - Add end date for limited-time events

2. **Configure Realistic Probabilities:**
   ```javascript
   Common Prize: 0.70 (70%)
   Rare Prize: 0.20 (20%)
   Epic Prize: 0.08 (8%)
   Legendary Prize: 0.02 (2%)
   ```

3. **Stock NFT Inventory:**
   - Add plenty of NFTs for each prize tier
   - Monitor inventory levels
   - System shows fallback message when empty

4. **Enable Whitelist for Exclusive Campaigns:**
   - Use CSV imports for large lists
   - Consider holder snapshots
   - Test with whitelisted and non-whitelisted wallets

## Support Resources

- 📚 Full Documentation: `FREE_SPIN_SYSTEM_DOCUMENTATION.md`
- 🗄️ Database Schema: `supabase-free-spin-schema.sql`
- 💻 Service API: `src/services/freeSpinService.js`
- 🎨 Components: `src/components/Wheel3D.jsx` & `SpinWheel.jsx`

## Success!

You now have a fully functional spin-to-win campaign! 🎉

Your users can:
- ✅ View campaigns on landing page
- ✅ Spin the wheel
- ✅ Win prizes
- ✅ See their spin history

You can:
- ✅ Create multiple campaigns
- ✅ Manage whitelists
- ✅ Track statistics
- ✅ Add NFT prizes

---

**Need Help?**

Common issues are covered in the troubleshooting section above. For complex problems, check the full documentation.

**Happy Spinning! 🎡**

