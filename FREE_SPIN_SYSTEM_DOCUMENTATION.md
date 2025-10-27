# Free Spin Wheel System - Complete Documentation

## Overview

This document provides a complete guide to the 3D Free Spin Wheel system implementation for the RollNFTs platform. This feature allows collections to create engaging spin campaigns where users can win NFT prizes and other rewards.

## System Architecture

### Database Schema

The system uses 4 main tables in Supabase:

1. **`free_spin_campaigns`** - Campaign configurations
2. **`free_spin_whitelist`** - Whitelist management for restricted campaigns
3. **`free_spin_history`** - Records all spin attempts and results
4. **`free_spin_prize_inventory`** - Tracks NFT availability and distribution

**SQL Schema Location:** `supabase-free-spin-schema.sql`

### Key Features

- ✅ **Server-Side RNG** - Fair prize selection using probability-based distribution
- ✅ **Atomic Operations** - Database functions prevent race conditions and double-spending
- ✅ **Whitelist Support** - Optional whitelist with configurable spins per wallet
- ✅ **Prize Inventory** - Tracks NFT availability with reservation system
- ✅ **3D Animations** - Realistic physics-based wheel spinning
- ✅ **Real-time Updates** - Optimistic UI with server confirmation
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Error Handling** - Comprehensive error handling with rollback mechanisms

## File Structure

### Frontend Components

```
src/
├── components/
│   ├── Wheel3D.jsx                    # 3D spinning wheel with physics
│   ├── Wheel3D.scss                   # Wheel styling with animations
│   ├── SpinWheel.jsx                  # Container with state management
│   └── SpinWheel.scss                 # Container styling
├── pages/
│   ├── FreeSpins.jsx                  # Landing page listing all campaigns
│   ├── FreeSpins.scss                 # Landing page styles
│   ├── FreeSpinDetail.jsx             # Individual campaign page
│   ├── FreeSpinDetail.scss            # Detail page styles
│   ├── AdminSpinCampaign.jsx          # Admin campaign management
│   ├── AdminSpinCampaign.scss         # Admin styles
│   └── CollectionDetail.jsx           # Updated with spin wheel integration
├── services/
│   └── freeSpinService.js             # Backend API integration
└── App.jsx                             # Updated with new routes
```

### Backend Schema

```
supabase-free-spin-schema.sql          # Complete database schema with functions
```

## Component Details

### 1. Wheel3D Component

**Location:** `src/components/Wheel3D.jsx`

The core 3D spinning wheel with realistic physics and animations.

**Props:**
- `segments` (Array) - Prize segments to display
- `onSpinComplete` (Function) - Callback when spin finishes
- `isSpinning` (Boolean) - Controls spin state
- `targetSegmentIndex` (Number) - Which segment to land on
- `size` (Number) - Wheel diameter in pixels (default: 400)
- `disabled` (Boolean) - Disable interactions

**Features:**
- Cubic easing for realistic deceleration
- SVG-based segments for precise rendering
- 5-7 full rotations before landing
- Random variance within target segment
- Golden ring decoration
- Glow effects during spin
- Accessibility support

### 2. SpinWheel Component

**Location:** `src/components/SpinWheel.jsx`

Container component managing spin logic, eligibility, and prize display.

**Props:**
- `campaignId` (String) - Campaign UUID
- `embedded` (Boolean) - Embedded mode for collection pages
- `onPrizeWon` (Function) - Callback when prize is won

**Features:**
- Wallet connection check
- Eligibility verification
- Spin execution
- Prize modal display
- NFT claim functionality
- Spin history display
- Real-time stats

### 3. FreeSpins Page

**Location:** `src/pages/FreeSpins.jsx`

Landing page displaying all available spin campaigns.

**Features:**
- Campaign grid layout
- Filter by availability
- Eligibility checking
- Campaign statistics
- Collection links
- "How It Works" section

### 4. FreeSpinDetail Page

**Location:** `src/pages/FreeSpinDetail.jsx`

Dedicated page for individual spin campaigns.

**Features:**
- Full campaign details
- Embedded spin wheel
- Campaign statistics
- Prize list with probabilities
- Collection banner integration

### 5. AdminSpinCampaign Page

**Location:** `src/pages/AdminSpinCampaign.jsx`

Admin interface for managing spin campaigns.

**Features:**
- Campaign creation
- Prize configuration
- Whitelist management (bulk upload)
- Campaign statistics
- Collection selection

## Service Layer

### freeSpinService

**Location:** `src/services/freeSpinService.js`

Complete API wrapper with security and error handling.

**Key Methods:**

#### Public Methods

```javascript
// Get all active campaigns (optionally filtered by collection)
getActiveCampaigns(collectionId?)

// Get campaign by ID with collection details
getCampaignById(campaignId)

// Check if wallet can spin
checkSpinEligibility(campaignId, walletAddress)

// Execute a spin (server-side RNG)
executeSpin(campaignId, walletAddress)

// Claim NFT prize
claimPrize(historyId, walletAddress)

// Get user's spin history
getSpinHistory(campaignId, walletAddress)

// Get campaign statistics
getCampaignStats(campaignId)
```

#### Admin Methods

```javascript
// Create new campaign
createCampaign(campaignData)

// Add addresses to whitelist
addToWhitelist(campaignId, addresses)

// Add NFTs to prize inventory
addPrizeInventory(campaignId, nftIds)
```

## Database Functions

### check_and_use_spin()

Atomic function that validates and consumes a spin in a single transaction.

**Parameters:**
- `p_campaign_id` - Campaign UUID
- `p_wallet_address` - User wallet

**Returns:**
- `can_spin` - Boolean
- `spins_remaining` - Integer
- `error_message` - String

**Checks:**
- Campaign exists and is active
- Campaign hasn't ended
- Whitelist requirements (if enabled)
- Spin count limits

### reserve_prize()

Atomic function to reserve an NFT from inventory.

**Parameters:**
- `p_campaign_id` - Campaign UUID
- `p_wallet_address` - User wallet
- `p_nft_id` - NFT UUID

**Returns:**
- `success` - Boolean
- `inventory_id` - UUID
- `error_message` - String

**Features:**
- SKIP LOCKED for concurrency
- First-available selection
- Reservation tracking

## Routes

```javascript
// Public Routes
/free-spins                        // Landing page
/free-spins/:campaignId            // Campaign detail page

// Admin Routes
/admin/spin-campaigns              // Campaign management

// Collection Integration
/collection/:id                    // Now includes spin wheel if campaign exists
```

## Integration Guide

### Step 1: Database Setup

Run the SQL schema:

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f supabase-free-spin-schema.sql
```

Or paste into Supabase SQL editor.

### Step 2: Create a Campaign

1. Navigate to `/admin/spin-campaigns`
2. Click "Create Campaign"
3. Select your collection
4. Configure prizes:
   - Add prize segments
   - Set probabilities (must sum to 1.0)
   - Choose colors
5. Set spins per wallet
6. Enable whitelist if needed
7. Set start/end dates (optional)
8. Submit

### Step 3: Add NFTs to Inventory (Optional)

If using NFT prizes, you need to add NFTs to the inventory:

```javascript
await freeSpinService.addPrizeInventory(campaignId, [nftId1, nftId2, ...]);
```

### Step 4: Manage Whitelist (If Enabled)

1. Go to campaign card
2. Click "Manage Whitelist"
3. Paste wallet addresses (one per line)
4. Submit

### Step 5: Test the Wheel

1. Visit `/free-spins` or your collection page
2. Connect wallet
3. Click "Spin the Wheel"
4. Claim prizes if NFT won

## Prize Configuration

### Prize Object Structure

```javascript
{
  type: 'nft' | 'message' | 'token',
  label: 'Prize Name',
  nft_id: 'uuid',              // For NFT prizes
  probability: 0.25,           // 25% chance
  color: '#667eea',            // Segment color
  fallback_message: 'string'   // If NFT inventory empty
}
```

### Example Prize Setup

```javascript
const prizes = [
  {
    type: 'nft',
    label: 'Legendary NFT',
    nft_id: 'uuid-1',
    probability: 0.05,  // 5% chance
    color: '#FFD700'
  },
  {
    type: 'nft',
    label: 'Rare NFT',
    nft_id: 'uuid-2',
    probability: 0.15,  // 15% chance
    color: '#C0C0C0'
  },
  {
    type: 'message',
    label: 'Try Again',
    text: 'Better luck next time!',
    probability: 0.80,  // 80% chance
    color: '#667eea'
  }
];
```

## Security Considerations

### Implemented Protections

1. **Server-Side RNG** - Prize selection happens on server, not client
2. **Atomic Operations** - Database functions prevent race conditions
3. **Spin Validation** - Multiple checks before allowing spin
4. **Result Hashing** - Verification hash prevents tampering
5. **Inventory Locking** - SKIP LOCKED prevents double-claiming
6. **Whitelist Verification** - Enforced at database level

### Best Practices

1. Always validate campaign ownership before admin actions
2. Use whitelist for exclusive campaigns
3. Monitor spin stats for unusual patterns
4. Keep prize inventory stocked
5. Test thoroughly before launching

## Troubleshooting

### Common Issues

**Issue:** Spin button disabled
- **Check:** Wallet connected?
- **Check:** Spins remaining?
- **Check:** Whitelist requirements met?
- **Check:** Campaign active?

**Issue:** No prizes appear
- **Check:** Prizes configured in campaign?
- **Check:** Probabilities sum to 1.0?
- **Check:** NFT inventory populated?

**Issue:** Claim fails
- **Check:** NFT still in inventory?
- **Check:** Transaction permissions?
- **Check:** Network connection?

**Issue:** Wheel doesn't spin
- **Check:** Browser supports CSS transforms?
- **Check:** JavaScript enabled?
- **Check:** Console for errors?

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Campaign not found" | Invalid campaign ID | Check campaign exists |
| "Wallet not whitelisted" | Not on whitelist | Add wallet to whitelist |
| "No spins remaining" | Used all spins | Wait or create new campaign |
| "Campaign has ended" | Past end date | Update end date or create new |
| "No prizes available" | Empty inventory | Add NFTs to inventory |

## Performance Optimization

### Database Indexes

All necessary indexes are created by the schema:
- Campaign lookups by collection
- Whitelist lookups by wallet
- History queries
- Inventory status checks

### Frontend Optimization

1. **Lazy Loading** - Spin components only load when needed
2. **Optimistic UI** - Immediate feedback before server response
3. **Debouncing** - Prevents multiple simultaneous spins
4. **Caching** - Eligibility checks cached per component

### Mobile Optimization

- Responsive wheel sizing
- Touch-friendly controls
- Reduced animations on low-end devices
- Prefers-reduced-motion support

## Future Enhancements

Potential features for future iterations:

1. **Token Prizes** - Support for fungible token rewards
2. **Multi-Prize** - Win multiple prizes per spin
3. **Streak Bonuses** - Rewards for consecutive spins
4. **Social Sharing** - Share wins on social media
5. **Analytics Dashboard** - Detailed campaign analytics
6. **Scheduled Campaigns** - Auto-start/stop campaigns
7. **Dynamic Probabilities** - Adjust odds based on inventory
8. **Referral System** - Earn spins for referrals

## Testing Checklist

### Before Launch

- [ ] Database schema deployed
- [ ] Campaign created with prizes
- [ ] Probabilities sum to 1.0
- [ ] NFT inventory populated
- [ ] Whitelist configured (if needed)
- [ ] Test spin as whitelisted user
- [ ] Test spin as non-whitelisted user
- [ ] Test claim functionality
- [ ] Verify transaction success
- [ ] Check mobile responsiveness
- [ ] Test with slow network
- [ ] Verify error handling
- [ ] Check admin access controls

### Post-Launch Monitoring

- [ ] Monitor spin success rate
- [ ] Track prize distribution
- [ ] Watch for error patterns
- [ ] Check inventory levels
- [ ] Verify transaction completion
- [ ] Monitor user engagement

## Support

For issues or questions:

1. Check this documentation
2. Review error messages in console
3. Check database logs
4. Verify configuration
5. Test with different wallets

## Conclusion

This Free Spin Wheel system provides a complete, production-ready solution for engaging your NFT community. The system is:

- ✅ **Secure** - Server-side validation and atomic operations
- ✅ **Fair** - Probability-based RNG with verification
- ✅ **Scalable** - Efficient database queries with indexes
- ✅ **User-Friendly** - Beautiful 3D animations and clear feedback
- ✅ **Flexible** - Whitelist, inventory, and prize options
- ✅ **Maintainable** - Well-documented and error-handled

Enjoy engaging your community with exciting spin-to-win campaigns!

---

**File Locations Summary:**

**Components:** `src/components/Wheel3D.jsx`, `src/components/SpinWheel.jsx`  
**Pages:** `src/pages/FreeSpins.jsx`, `src/pages/FreeSpinDetail.jsx`, `src/pages/AdminSpinCampaign.jsx`  
**Service:** `src/services/freeSpinService.js`  
**Schema:** `supabase-free-spin-schema.sql`  
**Routes:** `src/App.jsx` (updated)  
**Integration:** `src/pages/CollectionDetail.jsx` (updated)

