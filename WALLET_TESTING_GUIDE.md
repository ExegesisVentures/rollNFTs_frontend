# Comprehensive Wallet Testing Guide

## 🧪 Complete Testing Checklist for Keplr, Leap, and Cosmostation

This guide provides a comprehensive testing strategy for the wallet integration. Test each scenario systematically to ensure bulletproof functionality.

---

## Prerequisites

### Browser Setup
- [ ] Chrome/Brave (latest version)
- [ ] Firefox (latest version)  
- [ ] Safari (if on Mac)
- [ ] Clear browser cache before testing

### Wallet Extensions
Install at least one wallet to start, then test with all three:
- [ ] **Keplr**: https://www.keplr.app/download
- [ ] **Leap**: https://www.leapwallet.io/download
- [ ] **Cosmostation**: https://www.cosmostation.io/wallet

### Account Setup
- [ ] Create test accounts in each wallet
- [ ] Ensure Coreum mainnet is added
- [ ] Have some test COREUM tokens (if testing transactions)

---

## 🔍 Testing Scenarios

### 1. Wallet Detection Tests

#### Test 1.1: No Wallets Installed
**Setup**: Uninstall all wallet extensions
**Steps**:
1. Open the app
2. Click "Connect Wallet" button
3. Modal should open

**Expected**:
- [ ] Modal displays "No Wallets Detected" message
- [ ] Shows installation links for all three wallets (Keplr, Leap, Cosmostation)
- [ ] Each installation link opens correct wallet website
- [ ] UI clearly guides user to install a wallet

**Screenshot**: Save screenshot of "No Wallets Detected" state

---

#### Test 1.2: Only Keplr Installed
**Setup**: Install only Keplr extension
**Steps**:
1. Refresh page
2. Click "Connect Wallet"

**Expected**:
- [ ] Modal shows only Keplr in wallet list
- [ ] Keplr has blue icon (🔵)
- [ ] Leap and Cosmostation are not shown
- [ ] No error messages displayed

---

#### Test 1.3: Multiple Wallets Installed
**Setup**: Install Keplr, Leap, and Cosmostation
**Steps**:
1. Refresh page
2. Click "Connect Wallet"

**Expected**:
- [ ] All three wallets appear in modal
- [ ] Each wallet has correct icon (🔵 Keplr, 🟣 Leap, 🟠 Cosmostation)
- [ ] Wallets are listed in correct order
- [ ] Each wallet button is clickable

---

### 2. Connection Flow Tests

#### Test 2.1: Successful Keplr Connection
**Steps**:
1. Click "Connect Wallet"
2. Click "Keplr" in modal
3. Approve connection in Keplr popup
4. Approve chain addition if prompted

**Expected**:
- [ ] Modal shows "Connecting..." state
- [ ] Keplr popup appears requesting approval
- [ ] After approval, modal closes automatically
- [ ] Header shows connected state:
  - [ ] Balance displayed (e.g., "0.000000 COREUM")
  - [ ] Wallet type badge shows "Keplr"
  - [ ] Address shown (e.g., "core1abc...xyz123")
- [ ] Toast notification: "Connected to Keplr!"
- [ ] No error messages

**Screenshot**: Save connected header state

---

#### Test 2.2: Successful Leap Connection
**Steps**:
1. Disconnect Keplr (if connected)
2. Click "Connect Wallet"
3. Click "Leap" in modal
4. Approve in Leap extension

**Expected**:
- [ ] Same flow as Keplr
- [ ] Header shows "Leap" as wallet type
- [ ] Balance and address display correctly
- [ ] Toast notification: "Connected to Leap!"

---

#### Test 2.3: Successful Cosmostation Connection
**Steps**:
1. Disconnect previous wallet
2. Click "Connect Wallet"
3. Click "Cosmostation" in modal
4. Approve in Cosmostation extension

**Expected**:
- [ ] Same flow as other wallets
- [ ] Header shows "Cosmostation" as wallet type
- [ ] Balance and address display correctly
- [ ] Toast notification: "Connected to Cosmostation!"

---

#### Test 2.4: Reject Connection
**Steps**:
1. Click "Connect Wallet"
2. Click any wallet
3. **Reject** the connection in wallet popup

**Expected**:
- [ ] Modal stays open
- [ ] Error message appears: "Connection was rejected. Please try again."
- [ ] User can retry by clicking wallet again
- [ ] No app crash or freeze
- [ ] Can close modal and try again later

---

#### Test 2.5: Close Popup Without Action
**Steps**:
1. Click "Connect Wallet"
2. Click any wallet
3. Close wallet popup without approving or rejecting

**Expected**:
- [ ] Modal stays open
- [ ] Error message displayed
- [ ] User can retry connection
- [ ] App remains functional

---

### 3. Connected State Tests

#### Test 3.1: Verify Connected UI
**Setup**: Connect any wallet
**Verify**:
- [ ] **Balance Display**:
  - [ ] Shows on desktop view (hidden on mobile)
  - [ ] Format: "X.XXXXXX COREUM"
  - [ ] Has blue background with border
- [ ] **Wallet Badge**:
  - [ ] Shows wallet name (Keplr/Leap/Cosmostation)
  - [ ] Hidden on mobile, shown on tablet+
- [ ] **Address Display**:
  - [ ] Format: "core1abc...xyz123"
  - [ ] Uses monospace font
  - [ ] Always visible
- [ ] **Dropdown Chevron**:
  - [ ] Down arrow visible
  - [ ] Indicates dropdown menu

---

#### Test 3.2: Dropdown Menu
**Steps**:
1. Connect wallet
2. Click on address button

**Expected**:
- [ ] Dropdown opens below address
- [ ] Shows two options:
  1. [ ] "📋 Copy Address"
  2. [ ] "🔌 Disconnect"
- [ ] Dropdown has dark background
- [ ] Border and shadow visible
- [ ] Hover effects work on menu items

---

#### Test 3.3: Copy Address
**Steps**:
1. Open dropdown menu
2. Click "Copy Address"

**Expected**:
- [ ] Address copied to clipboard (verify by pasting)
- [ ] Toast notification: "Address copied to clipboard!"
- [ ] Dropdown closes automatically
- [ ] Full address copied (not truncated version)

**Verify**: Paste address in text editor to confirm full address

---

#### Test 3.4: Balance Updates
**Setup**: Connect wallet
**Steps**:
1. Note current balance
2. Wait 10 seconds
3. Send COREUM to your address from another wallet
4. Wait up to 10 seconds

**Expected**:
- [ ] Balance automatically updates without page refresh
- [ ] New balance reflects transaction
- [ ] Update happens within polling interval (10s)
- [ ] No errors in console

---

### 4. Account Change Tests

#### Test 4.1: Switch Account in Wallet
**Setup**: Connect wallet, have multiple accounts
**Steps**:
1. Open wallet extension
2. Switch to different account
3. Wait a few seconds

**Expected**:
- [ ] App detects account change automatically
- [ ] Header updates with new address
- [ ] Balance updates for new account
- [ ] No page refresh required
- [ ] No errors or disconnect

---

#### Test 4.2: Switch Chain in Wallet
**Steps**:
1. Connect to Coreum
2. Open wallet, switch to different chain (e.g., Cosmos Hub)
3. Try to interact with app

**Expected**:
- [ ] App detects wrong chain
- [ ] Shows appropriate error or prompt
- [ ] Asks user to switch back to Coreum
- [ ] Doesn't crash or show confusing errors

---

### 5. Disconnection Tests

#### Test 5.1: Normal Disconnect
**Steps**:
1. Connect wallet
2. Click address dropdown
3. Click "Disconnect"

**Expected**:
- [ ] Dropdown closes
- [ ] Header changes to "Connect Wallet" button
- [ ] Toast notification: "Wallet disconnected"
- [ ] Balance cleared
- [ ] LocalStorage cleared (check DevTools → Application → Local Storage)
- [ ] Balance polling stops (check Network tab)

---

#### Test 5.2: Disconnect Then Reconnect
**Steps**:
1. Connect wallet
2. Disconnect
3. Click "Connect Wallet" again
4. Reconnect same wallet

**Expected**:
- [ ] Connection works normally
- [ ] Previous state doesn't interfere
- [ ] Balance fetched fresh
- [ ] No stale data displayed

---

### 6. Persistence & Auto-Reconnect Tests

#### Test 6.1: Page Refresh
**Setup**: Connect wallet
**Steps**:
1. Note current connected wallet and balance
2. Refresh page (F5 or Cmd+R)
3. Wait for page to load

**Expected**:
- [ ] Wallet automatically reconnects
- [ ] Same wallet type shown
- [ ] Same address shown
- [ ] Balance refreshed and updated
- [ ] No "Connect Wallet" button shown
- [ ] Process is seamless (no flash of disconnected state)

---

#### Test 6.2: Navigate Between Pages
**Setup**: Connect wallet
**Steps**:
1. Visit Home page → Collections → Create → My NFTs
2. Check header on each page

**Expected**:
- [ ] Wallet stays connected across all pages
- [ ] Balance always visible
- [ ] Address unchanged
- [ ] No reconnection prompts

---

#### Test 6.3: Close & Reopen Browser
**Setup**: Connect wallet
**Steps**:
1. Close entire browser (not just tab)
2. Reopen browser
3. Navigate to app

**Expected**:
- [ ] Wallet reconnects automatically
- [ ] If wallet is locked, shows "Connect Wallet"
- [ ] LocalStorage persists wallet preference
- [ ] Can reconnect easily

---

#### Test 6.4: Lock Wallet Then Refresh
**Setup**: Connect wallet
**Steps**:
1. Lock wallet extension
2. Refresh page

**Expected**:
- [ ] Auto-reconnect fails gracefully
- [ ] Shows "Connect Wallet" button
- [ ] No error messages to user
- [ ] User can reconnect after unlocking wallet
- [ ] Console shows appropriate debug message

---

### 7. Protected Pages Tests

#### Test 7.1: Access Create Page Without Wallet
**Steps**:
1. Ensure wallet is disconnected
2. Navigate to `/create`

**Expected**:
- [ ] Shows "Wallet Not Connected" empty state
- [ ] Lock icon (🔐) displayed
- [ ] Message: "Please connect your wallet to create NFTs"
- [ ] "Connect Wallet" button visible
- [ ] Click button opens wallet modal
- [ ] After connecting, page content appears

---

#### Test 7.2: Access My NFTs Without Wallet
**Steps**:
1. Disconnect wallet
2. Navigate to `/my-nfts`

**Expected**:
- [ ] Shows "Wallet Not Connected" empty state
- [ ] "Connect Wallet" button opens modal
- [ ] After connecting, attempts to load user's NFTs
- [ ] Shows appropriate message if no NFTs found

---

#### Test 7.3: Buy NFT Without Wallet
**Steps**:
1. Disconnect wallet
2. Go to any NFT detail page
3. Click "Buy Now"

**Expected**:
- [ ] Error toast: "Please connect your wallet first"
- [ ] Wallet modal opens automatically
- [ ] After connecting, can proceed with purchase

---

### 8. Error Handling Tests

#### Test 8.1: Network Error During Connection
**Setup**: Simulate network issue
**Steps**:
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to connect wallet

**Expected**:
- [ ] Shows network error message
- [ ] User-friendly message (not technical jargon)
- [ ] Can retry after restoring connection
- [ ] App doesn't crash

---

#### Test 8.2: Balance Fetch Failure
**Steps**:
1. Connect wallet
2. Block balance API endpoint in DevTools Network tab
3. Wait for next balance update

**Expected**:
- [ ] Balance shows previous value or "0.000000"
- [ ] No error shown to user
- [ ] Console logs error for debugging
- [ ] Retries on next polling cycle

---

#### Test 8.3: Multiple Rapid Connections
**Steps**:
1. Open wallet modal
2. Rapidly click different wallets
3. Approve first one that prompts

**Expected**:
- [ ] Only one connection succeeds
- [ ] No duplicate connections
- [ ] App state consistent
- [ ] No errors or crashes

---

### 9. UI/UX Tests

#### Test 9.1: Loading States
**Verify** during connection:
- [ ] "Connecting..." text appears on selected wallet
- [ ] Button shows loading animation
- [ ] Other wallets disabled during connection
- [ ] User can't double-click to cause issues

---

#### Test 9.2: Responsive Design
**Test on**:
- [ ] **Desktop (1920x1080)**:
  - Balance, wallet name, and address all visible
  - Dropdown works correctly
- [ ] **Tablet (768px)**:
  - Wallet name visible
  - Balance visible
  - Address truncated appropriately
- [ ] **Mobile (375px)**:
  - Balance hidden
  - Wallet name hidden
  - Only address shown
  - Dropdown still functional

---

#### Test 9.3: Dark Theme Consistency
**Verify**:
- [ ] Modal has dark background
- [ ] Text is readable (good contrast)
- [ ] Buttons have hover effects
- [ ] Borders visible but subtle
- [ ] Icons clear and visible

---

#### Test 9.4: Accessibility
**Test with**:
- [ ] Keyboard navigation (Tab key)
- [ ] Can open modal with keyboard
- [ ] Can select wallet with Enter
- [ ] Can close modal with Escape
- [ ] Focus indicators visible
- [ ] Screen reader announces changes (if available)

---

### 10. Performance Tests

#### Test 10.1: Initial Load Time
**Measure**:
- [ ] Time from page load to ready state
- [ ] Wallet service doesn't slow down initial render
- [ ] Modal loads quickly when opened
- [ ] No blocking operations

**Expected**: Page should load in <2 seconds on good connection

---

#### Test 10.2: Memory Usage
**Steps**:
1. Open DevTools → Performance → Memory
2. Connect wallet
3. Navigate between pages
4. Disconnect wallet
5. Check for memory leaks

**Expected**:
- [ ] No significant memory leaks
- [ ] Event listeners cleaned up on disconnect
- [ ] Polling stops when disconnected

---

#### Test 10.3: Balance Polling Performance
**Verify**:
- [ ] Polling interval is 10 seconds (not faster)
- [ ] Network requests are efficient
- [ ] No redundant API calls
- [ ] Polling stops immediately on disconnect

---

### 11. Edge Cases

#### Test 11.1: Wallet Extension Disabled
**Steps**:
1. Connect wallet
2. Disable wallet extension in browser
3. Refresh page

**Expected**:
- [ ] Auto-reconnect fails gracefully
- [ ] Shows "Connect Wallet" button
- [ ] No console errors
- [ ] Can re-enable and reconnect

---

#### Test 11.2: Expired Session
**Steps**:
1. Connect wallet
2. Leave page open for extended period (30+ min)
3. Try to use wallet function

**Expected**:
- [ ] Detects expired session
- [ ] Prompts to reconnect
- [ ] Or automatically refreshes connection
- [ ] User isn't stuck

---

#### Test 11.3: Corrupted LocalStorage
**Steps**:
1. Connect wallet
2. Open DevTools → Application → Local Storage
3. Manually corrupt wallet-storage data
4. Refresh page

**Expected**:
- [ ] App doesn't crash
- [ ] Falls back to disconnected state
- [ ] User can connect normally
- [ ] LocalStorage repaired on next connection

---

#### Test 11.4: Multiple Tabs
**Steps**:
1. Open app in two tabs
2. Connect wallet in Tab 1
3. Check Tab 2

**Expected**:
- [ ] Tab 2 may not sync automatically (acceptable)
- [ ] Refresh Tab 2 shows connected state
- [ ] No conflicts between tabs
- [ ] Disconnecting in one tab doesn't break the other

---

### 12. Integration Tests

#### Test 12.1: Create NFT with Connected Wallet
**Steps**:
1. Connect wallet
2. Navigate to Create page
3. Fill form and submit

**Expected**:
- [ ] Form loads correctly
- [ ] Wallet address used for minting (when implemented)
- [ ] No connection issues during process

---

#### Test 12.2: View My NFTs
**Steps**:
1. Connect wallet
2. Navigate to My NFTs
3. API called with wallet address

**Expected**:
- [ ] Correct address sent to API
- [ ] NFTs loaded for that address
- [ ] Empty state if no NFTs
- [ ] Filter buttons work

---

#### Test 12.3: Purchase Flow
**Steps**:
1. Connect wallet
2. Find NFT to buy
3. Click "Buy Now"
4. Confirm purchase

**Expected**:
- [ ] Wallet address used for transaction
- [ ] Signing prompt appears (when implemented)
- [ ] Transaction completes successfully
- [ ] Balance updates after purchase

---

## 📋 Test Report Template

After completing tests, fill out:

```
Test Date: __________
Tester: __________
Browser: __________ (version: ______)
OS: __________

Wallets Tested:
- [ ] Keplr (version: ______)
- [ ] Leap (version: ______)
- [ ] Cosmostation (version: ______)

Results Summary:
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

Critical Issues Found:
1. ___________
2. ___________

Minor Issues Found:
1. ___________
2. ___________

Overall Assessment:
[ ] Ready for production
[ ] Needs minor fixes
[ ] Needs major fixes

Notes:
_________________________________
_________________________________
```

---

## 🐛 Bug Report Template

If you find issues, report using:

```markdown
**Bug Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Wallet**: Keplr / Leap / Cosmostation / All

**Browser**: Chrome / Firefox / Safari (version: ___)

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Console Errors**:
```
[Paste console errors]
```

**Additional Context**:
[Any other relevant information]
```

---

## ✅ Sign-Off Checklist

Before declaring wallet integration complete:

### Functionality
- [ ] All three wallets connect successfully
- [ ] Auto-reconnect works reliably
- [ ] Balance updates correctly
- [ ] Disconnect works properly
- [ ] Account switching detected
- [ ] Protected pages enforce wallet requirement

### UI/UX
- [ ] Modal design polished
- [ ] Header displays correctly
- [ ] Toast notifications work
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Responsive on all sizes

### Performance
- [ ] No memory leaks
- [ ] Efficient balance polling
- [ ] Fast initial load
- [ ] No blocking operations

### Error Handling
- [ ] All error scenarios covered
- [ ] User-friendly messages
- [ ] Graceful degradation
- [ ] Console logging for debugging

### Code Quality
- [ ] No linter errors
- [ ] Clean code structure
- [ ] Proper comments
- [ ] Reusable utilities
- [ ] Type safety (if applicable)

### Documentation
- [ ] README updated
- [ ] Testing guide complete (this doc)
- [ ] Integration docs written
- [ ] API references clear

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All tests passed
- [ ] Reviewed by at least 2 people
- [ ] Tested on staging environment
- [ ] Environment variables configured
- [ ] Error monitoring set up
- [ ] Analytics configured (if needed)
- [ ] Backup plan prepared
- [ ] Rollback procedure documented

---

**Happy Testing! 🎉**

*If you find any issues or have questions, refer to WALLET_INTEGRATION_COMPLETE.md for technical details.*



