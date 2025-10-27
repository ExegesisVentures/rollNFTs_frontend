# 🎡 Free Spin Wheel System - Visual Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  FreeSpins.jsx  │  │ FreeSpinDetail   │  │ CollectionDetail │  │
│  │  Landing Page   │→ │  Campaign Page   │  │  With Spin Wheel │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘  │
│           │                     │                      │             │
│           └─────────────────────┴──────────────────────┘             │
│                                  │                                   │
│                    ┌─────────────▼────────────┐                     │
│                    │   SpinWheel.jsx          │                     │
│                    │   (Container Component)   │                     │
│                    └─────────────┬────────────┘                     │
│                                  │                                   │
│                    ┌─────────────▼────────────┐                     │
│                    │   Wheel3D.jsx            │                     │
│                    │   (3D Wheel Animation)   │                     │
│                    └──────────────────────────┘                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ API Calls
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                      SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                  ┌───────────────────────────┐                       │
│                  │  freeSpinService.js       │                       │
│                  │  • getActiveCampaigns()   │                       │
│                  │  • getCampaignById()      │                       │
│                  │  • checkSpinEligibility() │                       │
│                  │  • executeSpin()          │                       │
│                  │  • claimPrize()           │                       │
│                  │  • getSpinHistory()       │                       │
│                  └───────────┬───────────────┘                       │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ Database Queries
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                      DATABASE LAYER (Supabase)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Tables                                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • free_spin_campaigns   - Campaign configs                 │   │
│  │  • free_spin_whitelist   - Access control                   │   │
│  │  • free_spin_history     - Spin records                     │   │
│  │  • free_spin_prize_inv   - NFT inventory                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Functions                                       │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • check_and_use_spin()  - Atomic spin validation          │   │
│  │  • reserve_prize()       - Atomic prize reservation         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## User Flow: Spinning the Wheel

```
                        ┌──────────────────┐
                        │  User arrives    │
                        │  at collection   │
                        │  or free spins   │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Connect wallet  │
                        └────────┬─────────┘
                                 │
                                 ▼
                   ┌─────────────────────────┐
                   │  Check eligibility      │
                   │  • Whitelist status     │
                   │  • Spins remaining      │
                   │  • Campaign active      │
                   └──────────┬──────────────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
                   ▼                     ▼
          ┌────────────────┐    ┌──────────────┐
          │  Not eligible  │    │   Eligible   │
          │  Show reason   │    │  Show wheel  │
          └────────────────┘    └──────┬───────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  User clicks    │
                              │  "SPIN" button  │
                              └────────┬────────┘
                                       │
                                       ▼
                         ┌─────────────────────────┐
                         │  Server validates       │
                         │  and selects prize      │
                         │  (Server-side RNG)      │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │  3D wheel animates      │
                         │  (4-5 second spin)      │
                         │  Lands on target        │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │  Prize modal displays   │
                         │  Show what was won      │
                         └──────────┬──────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
                ┌─────────────────┐   ┌───────────────┐
                │  NFT Prize      │   │   Message     │
                │  Show claim btn │   │   Try again   │
                └────────┬────────┘   └───────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │  User clicks claim  │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────────┐
                │  NFT transferred        │
                │  Transaction hash shown │
                └─────────────────────────┘
```

## Admin Flow: Creating a Campaign

```
                     ┌──────────────────────┐
                     │  Admin connects      │
                     │  wallet              │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │  Navigate to         │
                     │  /admin/spin-campaigns│
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │  Click "Create       │
                     │  Campaign"           │
                     └──────────┬───────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Fill campaign details:       │
                │  • Select collection          │
                │  • Enter name & description   │
                │  • Set dates (optional)       │
                │  • Configure spins per wallet │
                │  • Enable/disable whitelist   │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Add prizes:                  │
                │  • Prize label                │
                │  • Probability (0-1)          │
                │  • Color                      │
                │  • Repeat for each prize      │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Verify probabilities = 1.0   │
                └───────────────┬───────────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │  Submit campaign     │
                     └──────────┬───────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
    ┌──────────────────────┐      ┌─────────────────────┐
    │  Whitelist required? │      │  Public campaign    │
    │  Add addresses       │      │  Ready to use!      │
    └──────────────────────┘      └─────────────────────┘
```

## Data Flow: Spin Execution

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SPIN EXECUTION FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. User clicks "SPIN"
   │
   ▼
2. Frontend → freeSpinService.executeSpin(campaignId, wallet)
   │
   ▼
3. Database → check_and_use_spin(campaignId, wallet)
   │
   ├─→ Load campaign (FOR UPDATE lock)
   ├─→ Validate active status
   ├─→ Validate date range
   ├─→ Check whitelist (if required)
   ├─→ Check spin count
   ├─→ Decrement available spins (atomic)
   │
   ▼
4. Select prize (server-side)
   │
   ├─→ Get campaign prizes
   ├─→ Generate random number
   ├─→ Select based on probability
   │
   ▼
5. Handle prize based on type
   │
   ├─→ IF NFT:
   │   ├─→ reserve_prize(campaignId, wallet, nftId)
   │   ├─→ Lock inventory item (SKIP LOCKED)
   │   ├─→ Mark as reserved
   │   └─→ Return NFT details
   │
   └─→ IF Message:
       └─→ Return message text
   │
   ▼
6. Record in history
   │
   ├─→ Insert into free_spin_history
   ├─→ Store prize data
   ├─→ Generate verification hash
   ├─→ Set initial status
   │
   ▼
7. Return result to frontend
   │
   ├─→ Prize details
   ├─→ Target segment index
   ├─→ Spins remaining
   ├─→ History ID
   │
   ▼
8. Frontend triggers animation
   │
   ├─→ Wheel rotates to target
   ├─→ 4-5 second animation
   ├─→ Lands on correct segment
   │
   ▼
9. Display prize modal
   │
   ├─→ Show prize details
   ├─→ Show claim button (if NFT)
   ├─→ Update spin count
   │
   ▼
10. User claims (if NFT)
    │
    ├─→ freeSpinService.claimPrize(historyId, wallet)
    ├─→ Transfer NFT on blockchain
    ├─→ Update inventory status → "claimed"
    ├─→ Update history status → "completed"
    └─→ Show transaction hash
```

## Security Flow: Attack Prevention

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY VALIDATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

Attack: Double Spinning
│
├─→ Prevention: Atomic check_and_use_spin() function
│   ├─→ Lock row with FOR UPDATE
│   ├─→ Validate and decrement in single transaction
│   └─→ Second attempt sees updated count
│
├─→ Result: ✅ Second spin rejected

Attack: Prize Manipulation
│
├─→ Prevention: Server-side RNG
│   ├─→ Client sends no prize data
│   ├─→ Server calculates prize based on probabilities
│   ├─→ Verification hash prevents tampering
│   └─→ Client cannot influence outcome
│
├─→ Result: ✅ Fair and secure

Attack: Inventory Conflicts
│
├─→ Prevention: SKIP LOCKED on prize reservation
│   ├─→ reserve_prize() uses FOR UPDATE SKIP LOCKED
│   ├─→ First winner locks the row
│   ├─→ Second winner skips and gets next available
│   └─→ No duplicate claims possible
│
├─→ Result: ✅ Each NFT claimed once

Attack: Whitelist Bypass
│
├─→ Prevention: Database-level enforcement
│   ├─→ check_and_use_spin() validates whitelist
│   ├─→ Unique constraint on campaign + wallet
│   ├─→ Cannot bypass via multiple requests
│   └─→ Row Level Security policies
│
├─→ Result: ✅ Only whitelisted can spin

Attack: Excessive Spins
│
├─→ Prevention: Atomic decrement with constraints
│   ├─→ CHECK constraint: spins_used <= spins_allowed
│   ├─→ Update fails if constraint violated
│   ├─→ Transaction rolls back
│   └─→ Error returned to client
│
├─→ Result: ✅ Cannot exceed limit

Attack: Network Failures
│
├─→ Prevention: Idempotent operations
│   ├─→ History records with unique IDs
│   ├─→ Status tracking (pending → completed)
│   ├─→ Retry logic for failed claims
│   └─→ Optimistic UI with server confirmation
│
├─→ Result: ✅ Graceful failure handling
```

## Component Hierarchy

```
App.jsx
│
├─ Header.jsx
│
├─ Routes
│   │
│   ├─ /free-spins
│   │   └─ FreeSpins.jsx
│   │       ├─ Campaign Cards (grid)
│   │       └─ Filter Controls
│   │
│   ├─ /free-spins/:campaignId
│   │   └─ FreeSpinDetail.jsx
│   │       ├─ Campaign Header
│   │       ├─ SpinWheel (embedded=false)
│   │       │   ├─ Wheel3D
│   │       │   ├─ Spin Button
│   │       │   ├─ Prize Modal
│   │       │   └─ Spin History
│   │       └─ Campaign Sidebar
│   │           ├─ Details
│   │           ├─ Stats
│   │           └─ Prize List
│   │
│   ├─ /collection/:id
│   │   └─ CollectionDetail.jsx
│   │       ├─ Collection Header
│   │       ├─ SpinWheel (embedded=true) ← NEW!
│   │       │   └─ (same structure as above)
│   │       └─ NFT Grid
│   │
│   └─ /admin/spin-campaigns
│       └─ AdminSpinCampaign.jsx
│           ├─ Campaign List
│           ├─ Create Modal
│           │   ├─ Form Fields
│           │   └─ Prize Editor
│           └─ Whitelist Modal
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    SpinWheel Component State                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Initial State:                                                │
│  ├─ campaign: null                                             │
│  ├─ loading: true                                              │
│  ├─ spinning: false                                            │
│  ├─ canSpin: false                                             │
│  ├─ spinsRemaining: 0                                          │
│  ├─ targetSegment: null                                        │
│  └─ prizeResult: null                                          │
│                                                                │
│  On Mount:                                                     │
│  ├─ loadCampaign() → Set campaign                             │
│  ├─ checkEligibility() → Set canSpin, spinsRemaining          │
│  └─ loadSpinHistory() → Set history                           │
│                                                                │
│  On Spin Click:                                                │
│  ├─ Set spinning: true                                         │
│  ├─ executeSpin() → Get prizeResult, targetSegment            │
│  ├─ Trigger Wheel3D animation                                 │
│  └─ Wait for animation complete                               │
│                                                                │
│  On Spin Complete:                                             │
│  ├─ Set spinning: false                                        │
│  ├─ Show prize modal                                           │
│  ├─ Update spinsRemaining                                      │
│  └─ Refresh history                                            │
│                                                                │
│  On Claim:                                                     │
│  ├─ Set claimingPrize: true                                    │
│  ├─ claimPrize() → Get txHash                                 │
│  ├─ Update prizeResult.claimed                                 │
│  ├─ Show success message                                       │
│  └─ Set claimingPrize: false                                   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING FLOW                       │
└──────────────────────────────────────────────────────────────┘

Error Occurs
│
├─→ Service Layer (freeSpinService.js)
│   ├─→ Catch error
│   ├─→ Log to console
│   ├─→ Transform to AppError
│   └─→ Throw to component
│
├─→ Component Layer (SpinWheel.jsx)
│   ├─→ Catch in try/catch
│   ├─→ Display toast notification
│   ├─→ Reset spinning state
│   ├─→ Clear loading indicators
│   └─→ Show error state to user
│
└─→ Database Layer (Postgres)
    ├─→ Constraint violation
    ├─→ Transaction rollback
    ├─→ Return error to service
    └─→ Preserve data integrity

Common Errors:
│
├─ "Campaign not found"
│  └─→ Invalid campaign ID or deleted
│
├─ "Wallet not whitelisted"
│  └─→ Add wallet to whitelist
│
├─ "No spins remaining"
│  └─→ User exceeded limit
│
├─ "Campaign has ended"
│  └─→ Past end date
│
├─ "No prizes available"
│  └─→ Empty inventory
│
└─ "Transaction failed"
   └─→ Blockchain error, retry
```

## Performance Optimization Map

```
┌──────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION STRATEGIES                    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Database Level:                                               │
│  ├─ Indexes on frequently queried columns                     │
│  ├─ Composite indexes for joins                               │
│  ├─ FOR UPDATE locks only when needed                         │
│  ├─ SKIP LOCKED for concurrent access                         │
│  └─ Materialized stats (cached counts)                        │
│                                                                │
│  Service Level:                                                │
│  ├─ Batched eligibility checks                                │
│  ├─ Cached campaign data                                      │
│  ├─ Debounced API calls                                       │
│  ├─ Promise.all for parallel queries                          │
│  └─ Retry logic with exponential backoff                      │
│                                                                │
│  Frontend Level:                                               │
│  ├─ React.memo for expensive renders                          │
│  ├─ useMemo for computed values                               │
│  ├─ useCallback for event handlers                            │
│  ├─ Lazy loading for heavy components                         │
│  ├─ Optimistic UI updates                                     │
│  ├─ RequestAnimationFrame for animations                      │
│  └─ Image lazy loading                                        │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

This visual diagram should help understand how all the pieces fit together! 🎡

