# NFT Launchpad System - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [How Launchpads Work](#how-launchpads-work)
3. [Database Schema](#database-schema)
4. [User Flows](#user-flows)
5. [API Services](#api-services)
6. [Frontend Components](#frontend-components)
7. [Vetting Process](#vetting-process)
8. [Technical Implementation](#technical-implementation)
9. [Admin Guide](#admin-guide)
10. [Creator Guide](#creator-guide)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The NFT Launchpad system enables collection creators to launch their NFTs with controlled, on-demand minting. Unlike traditional bulk minting, launchpads mint NFTs only when users purchase them, providing better control and flexibility.

### Key Features

- ✅ **On-Demand Minting**: NFTs are minted only when purchased
- ✅ **Whitelist Support**: Restrict early access to specific addresses
- ✅ **Flexible Pricing**: Set custom mint prices per launchpad
- ✅ **Vetting System**: "Vetted" badge for verified projects
- ✅ **Creator Controls**: Manage whitelist, cancel anytime, view analytics
- ✅ **Reveal Mechanics**: Support for pre-reveal placeholders
- ✅ **Admin Dashboard**: Review and approve vetting applications

---

## 🚀 How Launchpads Work

### 1. Collection Creation
Before creating a launchpad, you must first create an NFT collection.

```javascript
// Collection must exist first
Collection created → class_id assigned → Ready for launchpad
```

### 2. Launchpad Setup
Creators configure their launchpad with:
- **Mint Price**: Cost per NFT (in CORE)
- **Max Supply**: Total NFTs available
- **Max Per Wallet**: Optional limit per user
- **Start/End Times**: Launch schedule
- **Whitelist Settings**: Optional early access phase
- **Metadata URIs**: Base URI for revealed NFTs, placeholder for pre-reveal

### 3. Minting Process

```
User clicks "Mint" 
  → Check eligibility (whitelist, limits, timing)
  → Generate token ID (sequential)
  → Create NFT mint transaction
  → Send payment to creator
  → Record mint in database
  → Update launchpad stats
```

### 4. Lifecycle States

```
pending → active → completed
                 ↘ cancelled
```

- **Pending**: Created but not yet activated
- **Active**: Live and accepting mints
- **Completed**: Sold out or ended
- **Cancelled**: Creator stopped the launchpad

---

## 🗄️ Database Schema

### Launchpads Table

**File**: `supabase-launchpad-schema.sql`

```sql
CREATE TABLE launchpads (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections(id),
  class_id TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  banner_image TEXT,
  
  -- Minting parameters
  mint_price NUMERIC NOT NULL,
  mint_price_denom TEXT DEFAULT 'ucore',
  max_supply INTEGER NOT NULL,
  max_per_wallet INTEGER,
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  
  -- Whitelist
  is_whitelist_only BOOLEAN DEFAULT FALSE,
  whitelist_mint_limit INTEGER,
  whitelist_end_time TIMESTAMP,
  
  -- Status
  status TEXT DEFAULT 'pending',
  total_minted INTEGER DEFAULT 0,
  total_raised NUMERIC DEFAULT 0,
  
  -- Vetting
  is_vetted BOOLEAN DEFAULT FALSE,
  vetted_at TIMESTAMP,
  vetted_by TEXT,
  
  -- Metadata
  base_uri TEXT,
  placeholder_uri TEXT,
  is_revealed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Related Tables

1. **launchpad_mints**: Individual mint records
2. **launchpad_whitelist**: Whitelisted addresses
3. **launchpad_vetting_applications**: Vetting requests
4. **launchpad_analytics**: Performance metrics

---

## 👥 User Flows

### Creator Flow

```
1. Create Collection
2. Navigate to "Create Launchpad"
3. Configure launchpad parameters
4. (Optional) Add whitelist addresses
5. Activate launchpad
6. (Optional) Apply for "Vetted" badge
7. Monitor analytics
8. (Optional) Cancel and handle remaining NFTs
```

### Minter Flow

```
1. Browse active launchpads
2. Select launchpad
3. Check eligibility
4. Select quantity (if allowed)
5. Confirm mint transaction
6. Receive NFT(s)
```

### Admin Flow

```
1. Access Admin Dashboard
2. Review pending vetting applications
3. Check project details, socials, team info
4. Approve/Reject/Request Changes
5. Grant "Vetted" badge (on approval)
```

---

## 🔌 API Services

### LaunchpadService
**File**: `src/services/launchpadService.js`

#### Key Methods

```javascript
// Create launchpad
await launchpadService.createLaunchpad(launchpadData);

// Mint through launchpad
await launchpadService.mintFromLaunchpad({
  launchpadId,
  minterAddress,
  tokenId,
  txHash
});

// Check eligibility
await launchpadService.checkMintEligibility(launchpadId, userAddress);

// Manage whitelist
await launchpadService.addToWhitelist(launchpadId, addresses, adderAddress);
await launchpadService.removeFromWhitelist(launchpadId, address, removerAddress);

// Cancel launchpad
await launchpadService.cancelLaunchpad(launchpadId, userAddress, reason, postAction);

// Get stats
await launchpadService.getLaunchpadStats(launchpadId);
```

### AdminLaunchpadService
**File**: `src/services/adminLaunchpadService.js`

#### Key Methods

```javascript
// Review applications
await adminLaunchpadService.getPendingApplications(filters);
await adminLaunchpadService.approveApplication(appId, adminAddress, notes);
await adminLaunchpadService.rejectApplication(appId, adminAddress, reason);
await adminLaunchpadService.requestChanges(appId, adminAddress, notes);

// Manage vetted badges
await adminLaunchpadService.grantVettedBadge(launchpadId, adminAddress, notes);
await adminLaunchpadService.revokeVettedBadge(launchpadId, adminAddress, reason);

// Platform stats
await adminLaunchpadService.getPlatformStats();
await adminLaunchpadService.getApplicationStats();
```

---

## 🎨 Frontend Components

### Pages Created

1. **CreateLaunchpad.jsx** - Launchpad creation form
   - Location: `src/pages/CreateLaunchpad.jsx`
   - Route: `/launchpads/create`

2. **Launchpads.jsx** - Browse/list all launchpads
   - Location: `src/pages/Launchpads.jsx`
   - Route: `/launchpads`

3. **LaunchpadDetail.jsx** - Individual launchpad with mint
   - Location: `src/pages/LaunchpadDetail.jsx`
   - Route: `/launchpads/:id`

4. **ManageLaunchpad.jsx** - Creator dashboard
   - Location: `src/pages/ManageLaunchpad.jsx`
   - Route: `/launchpads/:id/manage`

5. **LaunchpadVettingApplication.jsx** - Apply for vetted badge
   - Location: `src/pages/LaunchpadVettingApplication.jsx`
   - Route: `/launchpads/:id/apply-vetting`

6. **AdminLaunchpadDashboard.jsx** - Admin review interface
   - Location: `src/pages/AdminLaunchpadDashboard.jsx`
   - Route: `/admin/launchpads`

### Component Structure

```
src/
├── pages/
│   ├── CreateLaunchpad.jsx
│   ├── CreateLaunchpad.scss
│   ├── Launchpads.jsx
│   ├── Launchpads.scss
│   ├── LaunchpadDetail.jsx
│   ├── LaunchpadDetail.scss
│   ├── ManageLaunchpad.jsx
│   ├── ManageLaunchpad.scss
│   ├── LaunchpadVettingApplication.jsx
│   ├── LaunchpadVettingApplication.scss
│   ├── AdminLaunchpadDashboard.jsx
│   └── AdminLaunchpadDashboard.scss
├── services/
│   ├── launchpadService.js
│   └── adminLaunchpadService.js
└── components/
    └── VerifiedBadge.jsx (existing, enhanced for launchpads)
```

---

## ✅ Vetting Process

### What is Vetting?

Vetting is a manual review process where admins verify the legitimacy and quality of a launchpad project. Approved projects receive a "Vetted" badge.

### Requirements for Vetting

**Automatic Checks:**
- Collection must be created
- Launchpad must be configured
- Project must have social presence

**Manual Review:**
- Project description (min 100 characters)
- Team information and background
- Roadmap and utility description
- Social media presence (Website/Twitter/Discord)
- Art samples (optional)
- KYC status (optional but recommended)

### Application Process

1. **Creator Submits Application**
   ```javascript
   // Navigate to launchpad
   /launchpads/:id/apply-vetting
   
   // Fill application form
   - Project details
   - Team info
   - Social links
   - Roadmap
   - Art samples
   ```

2. **Admin Reviews**
   ```javascript
   // Admin dashboard
   /admin/launchpads
   
   // Review options
   - Approve → Grant vetted badge
   - Reject → Provide reason
   - Request Changes → Ask for updates
   ```

3. **Badge Granted**
   - Upon approval, `is_vetted` flag set to `true`
   - Vetted badge appears on launchpad
   - Higher visibility in browse page

### Vetting Status Flow

```
pending → under_review → approved → VETTED ✓
                       ↘ rejected
                       ↘ requires_changes → resubmit → under_review
```

---

## 🛠️ Technical Implementation

### Minting Transaction Flow

```javascript
// 1. Generate token IDs
const startTokenId = launchpad.total_minted + 1;
const tokenIds = Array.from(
  { length: mintQuantity },
  (_, i) => `${startTokenId + i}`
);

// 2. Build mint messages
const msgs = tokenIds.map(tokenId => ({
  typeUrl: '/coreum.asset.nft.v1.MsgMint',
  value: {
    sender: minterAddress,
    classId: launchpad.class_id,
    id: tokenId,
    uri: metadataUri,
    data: null
  }
}));

// 3. Add payment message
msgs.push({
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: {
    fromAddress: minterAddress,
    toAddress: creatorAddress,
    amount: [{ denom: 'ucore', amount: totalAmount }]
  }
});

// 4. Sign and broadcast
const result = await signAndBroadcast(msgs);

// 5. Record in database
await launchpadService.mintFromLaunchpad({
  launchpadId, minterAddress, tokenId, txHash
});
```

### Whitelist Checking

```javascript
// Check if in whitelist phase
const now = new Date();
const isWhitelistPhase = 
  launchpad.is_whitelist_only || 
  (launchpad.whitelist_end_time && new Date(launchpad.whitelist_end_time) > now);

if (isWhitelistPhase) {
  // Query whitelist
  const whitelistEntry = await getWhitelistEntry(launchpadId, userAddress);
  
  if (!whitelistEntry) {
    return { canMint: false, reason: 'Not whitelisted' };
  }
  
  if (whitelistEntry.mints_used >= whitelistEntry.max_mints) {
    return { canMint: false, reason: 'Allocation exhausted' };
  }
}
```

### Auto-Increment Triggers

```sql
-- Automatically update total_minted on new mint
CREATE TRIGGER trigger_increment_launchpad_minted
AFTER INSERT ON launchpad_mints
FOR EACH ROW
EXECUTE FUNCTION increment_launchpad_minted();

-- Function implementation
CREATE OR REPLACE FUNCTION increment_launchpad_minted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE launchpads 
  SET 
    total_minted = total_minted + 1,
    total_raised = total_raised + NEW.mint_price,
    updated_at = NOW()
  WHERE id = NEW.launchpad_id;
  
  -- Auto-complete if sold out
  UPDATE launchpads
  SET status = 'completed'
  WHERE id = NEW.launchpad_id 
    AND total_minted >= max_supply;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 👨‍💼 Admin Guide

### Accessing Admin Dashboard

1. Ensure your wallet is configured as admin:
   ```bash
   # Add to .env.local
   REACT_APP_ADMIN_ADDRESS_1=core1xxxxx...
   REACT_APP_ADMIN_ADDRESS_2=core1yyyyy...
   ```

2. Navigate to `/admin/launchpads`

### Reviewing Applications

**Application Details Include:**
- Project name and description
- Team information
- Social media links
- Roadmap and utility
- Art samples
- KYC status
- Launchpad configuration

**Review Actions:**

1. **Approve**
   - Grant vetted badge
   - Optional admin notes
   - Badge appears immediately

2. **Reject**
   - Provide rejection reason (required)
   - Creator can reapply after addressing issues
   - Optional admin notes

3. **Request Changes**
   - Specify what needs improvement
   - Application returns to creator
   - They can resubmit after changes

### Best Practices

- ✅ Check social media presence and engagement
- ✅ Verify team credentials and background
- ✅ Assess artwork quality and originality
- ✅ Review roadmap feasibility
- ✅ Check for copyright violations
- ✅ Consider project utility and value proposition
- ❌ Don't approve without thorough review
- ❌ Don't reject without clear reasons

---

## 👨‍🎨 Creator Guide

### Creating a Launchpad

1. **Prerequisites**
   - Create NFT collection first
   - Connect wallet
   - Have banner image ready (1200x400px recommended)

2. **Configuration**
   ```javascript
   Required:
   - Collection selection
   - Launchpad name
   - Mint price
   - Max supply
   - Start time
   - Base URI for metadata
   
   Optional:
   - Description
   - Banner image
   - End time
   - Max per wallet
   - Whitelist settings
   - Placeholder URI (pre-reveal)
   ```

3. **Whitelist Setup**
   ```
   If using whitelist:
   - Enable "Whitelist Only" OR set "Whitelist End Time"
   - Add addresses after creation
   - Set max mints per address
   - Manage via "Manage Launchpad" page
   ```

### Managing Your Launchpad

Navigate to `/launchpads/:id/manage` to:

- **View Analytics**
  - Total minted
  - Unique minters
  - Revenue generated
  - Recent activity

- **Manage Whitelist**
  - Add addresses (bulk)
  - Remove addresses
  - View allocation status

- **Cancel Launchpad**
  - Stop minting
  - Choose action for remaining NFTs:
    - Do nothing
    - Mint to your wallet
    - Burn slots

### Applying for Vetted Badge

1. Navigate to your launchpad
2. Click "Apply for Vetted Badge"
3. Fill application form:
   - Project description (min 100 chars)
   - Team information
   - Social links (at least one required)
   - Roadmap
   - Utility description
   - Team background
   - Art samples (optional)
   - KYC status (optional)

4. Submit and wait for admin review
5. Check application status

### Post-Cancellation Options

**mint_remaining**:
- All remaining tokens minted to your wallet
- Execute from manage page
- Useful for team reserves or giveaways

**burn_remaining**:
- Permanently remove unminted slots
- Reduces total supply
- Cannot be undone

**none**:
- Leave slots unminted
- Can execute action later
- Collection supply stays as configured

---

## 🐛 Troubleshooting

### Common Issues

**1. "Collection not found"**
- **Cause**: Collection doesn't exist
- **Solution**: Create collection first

**2. "Not authorized to create launchpad"**
- **Cause**: Wallet doesn't own collection
- **Solution**: Connect with creator wallet

**3. "Launchpad already exists for this collection"**
- **Cause**: Active launchpad already present
- **Solution**: Cancel existing or use different collection

**4. "Not whitelisted"**
- **Cause**: Address not in whitelist during whitelist phase
- **Solution**: Wait for public phase or contact creator

**5. "Maximum mints per wallet reached"**
- **Cause**: Hit max_per_wallet limit
- **Solution**: Use different wallet or wait for creator to adjust

**6. "Start time must be in the future"**
- **Cause**: Selected past date
- **Solution**: Choose future date/time

**7. "Application already submitted"**
- **Cause**: Pending vetting application exists
- **Solution**: Wait for admin review

### Database Issues

**Trigger not firing:**
```sql
-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_increment_launchpad_minted';

-- Recreate if missing
\i supabase-launchpad-schema.sql
```

**RLS policy blocking:**
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'launchpads';

-- Grant service role if needed
ALTER TABLE launchpads ENABLE ROW LEVEL SECURITY;
```

### Performance Optimization

**Slow queries:**
```sql
-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_launchpads_status 
ON launchpads(status, start_time);

CREATE INDEX IF NOT EXISTS idx_launchpad_mints_launchpad 
ON launchpad_mints(launchpad_id, minted_at DESC);
```

**High load:**
- Use database views for complex queries
- Cache stats in frontend
- Implement pagination for large lists

---

## 📊 Analytics & Metrics

### Launchpad Stats

Available via `getLaunchpadStats()`:
```javascript
{
  totalMinted: 150,
  totalRaised: 1500000000, // ucore
  maxSupply: 1000,
  uniqueMinters: 95,
  recent24h: 25,
  completionPercentage: "15.00",
  avgMintPrice: 10000000
}
```

### Platform Stats (Admin)

```javascript
{
  totalLaunchpads: 50,
  activeLaunchpads: 12,
  vettedLaunchpads: 8,
  totalMints: 5000,
  totalRevenue: 50000000000,
  uniqueParticipants: 1200,
  vettingRate: "16.00"
}
```

---

## 🔒 Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Creators can manage their launchpads
CREATE POLICY "Creators can update their own launchpads" 
ON launchpads FOR UPDATE 
USING (auth.uid()::text = creator_address);

-- Service role has full access
CREATE POLICY "Service can manage analytics" 
ON launchpad_analytics FOR ALL 
USING (auth.role() = 'service_role');
```

### Admin Access Control

```javascript
// Check admin status before operations
static ADMIN_ADDRESSES = [
  process.env.REACT_APP_ADMIN_ADDRESS_1,
  process.env.REACT_APP_ADMIN_ADDRESS_2
].filter(Boolean);

isAdmin(address) {
  return AdminLaunchpadService.ADMIN_ADDRESSES.includes(address);
}
```

### Transaction Security

- All mints require wallet signature
- Payment messages verify amounts
- NFT ownership verified on-chain
- No private keys stored

---

## 🎯 Future Enhancements

### Potential Features

1. **Dutch Auction Pricing**
   - Price decreases over time
   - Rewards early minters

2. **Tiered Pricing**
   - Different prices for different phases
   - Whitelist vs public pricing

3. **Partial Refunds**
   - If cancelled early
   - Proportional to unminted supply

4. **NFT Staking**
   - Lock NFTs for rewards
   - Governance rights

5. **Lottery/Raffle Minting**
   - Enter raffle to mint
   - Random selection

6. **Cross-chain Bridging**
   - Mint on other chains
   - Bridge NFTs

7. **Advanced Analytics**
   - Holder distribution
   - Trading volume
   - Rarity stats

---

## 📝 Summary

The NFT Launchpad system provides a comprehensive solution for controlled NFT launches with:

- ✅ **10 database tables** with triggers and views
- ✅ **2 backend services** with 30+ methods
- ✅ **6 frontend pages** with full CRUD operations
- ✅ **Vetting system** with admin review
- ✅ **Analytics** for creators and admins
- ✅ **Security** with RLS and access control
- ✅ **Flexibility** with whitelist, pricing, timing controls

All code follows best practices with proper error handling, validation, and user feedback.

---

**Version**: 1.0.0  
**Last Updated**: October 23, 2025  
**Author**: Exegesis Ventures  
**Project**: RollNFTs Marketplace on Coreum

