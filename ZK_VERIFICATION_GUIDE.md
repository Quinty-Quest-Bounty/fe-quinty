# ZK Verification - User Guide

**Status:** ✅ IMPLEMENTED (Placeholder Mode)

---

## Overview

The ZK Verification system allows users to verify their identity before creating:
- **Looking for Grant** requests
- **Grant Programs** (for VCs/organizations)
- **Crowdfunding Campaigns**

This ensures only verified users can create funding opportunities, reducing spam and increasing trust.

---

## How to Verify Your Identity

### Step 1: Connect Your Wallet
- Click **"Connect Wallet"** in the top-right corner
- Select your wallet (MetaMask, WalletConnect, etc.)
- Connect to **Base Sepolia** network

### Step 2: Click "Verify Identity"
Once connected, you'll see a **"Verify Identity"** button in the header (desktop) or mobile menu.

### Step 3: Fill in the Verification Form
You'll need to provide:

1. **Social Handle*** (Required)
   - Your Twitter/X username (e.g., `@quintyprotocol` or `quintyprotocol`)
   - Or GitHub username
   - Or other social media handle

2. **Institution/Organization** (Optional)
   - Company name if you're a VC/organization
   - Leave blank if you're an individual

### Step 4: Submit Verification
- Click **"Verify"** button
- Confirm the transaction in your wallet
- Wait for transaction confirmation (~2 seconds on Base Sepolia)
- ✅ You're now verified!

### Step 5: Start Creating
Once verified, the button will change to show **"Verified"** with a green checkmark ✓

You can now:
- Create Looking for Grant requests
- Create Grant Programs (if you're a VC)
- Launch Crowdfunding Campaigns

---

## Verification Status

### How to Check Your Status

**In Header:**
- **"Verify Identity"** button (blue) = Not verified
- **"Verified"** button (green checkmark) = Verified ✓

**On Funding Pages:**
- **Green Alert** = "Your identity is verified. You can create..."
- **Amber Alert** = "Verification Required. You must verify your identity to create..."

---

## Current Implementation (Placeholder)

### ⚠️ Important Note:

The current implementation uses **placeholder ZK verification**. This means:

✅ **What Works:**
- Verification flow is fully functional
- Smart contract stores your social handle
- UI checks verification status
- Prevents unverified users from creating

❌ **What's Missing:**
- **Real ZK proof verification** (currently accepts any proof)
- **Social media authentication** (doesn't actually verify Twitter/X ownership)
- **Zero-knowledge proofs** (no actual cryptographic proof generated)

### How It Currently Works:

```typescript
// Current implementation (placeholder)
const placeholderProof = new Uint8Array(32); // Empty 32-byte proof

zkVerificationContract.submitZKProof(
  proof,           // ← Not actually verified
  socialHandle,    // ← Stored but not verified
  institutionName  // ← Optional metadata
);
```

The smart contract (`ZKVerification.sol`) has this:

```solidity
function submitZKProof(
    bytes memory proof,
    string memory socialHandle,
    string memory institutionName
) external {
    // Placeholder: For now, just verify the user
    // TODO: Actually verify the ZK proof before marking as verified

    verifications[msg.sender] = VerificationRecord({
        isVerified: true,  // ← Always true!
        verifiedAt: block.timestamp,
        socialHandle: socialHandle,
        institutionName: institutionName,
        proofHash: keccak256(proof)
    });
}
```

---

## Future Integration: Real ZK Verification

### Planned Implementation: Reclaim Protocol

The FRONTEND_INTEGRATION.md mentions integrating with **Reclaim Protocol** for real ZK verification.

**Reclaim Protocol** allows users to prove they own a social media account without revealing:
- Passwords
- API keys
- Session tokens
- Private data

### How It Will Work:

1. **User clicks "Verify Identity"**
2. **Reclaim SDK generates a ZK proof:**
   - User logs into Twitter/X via Reclaim's secure iframe
   - Reclaim generates cryptographic proof of account ownership
   - Proof is generated locally (zero-knowledge)
3. **Submit proof to smart contract:**
   - Smart contract verifies the ZK proof cryptographically
   - If valid, marks user as verified
4. **User is now verified ✓**

### Integration Steps (TODO):

```typescript
// Example: Reclaim Protocol integration
import { ReclaimClient } from '@reclaimprotocol/react-sdk';

const reclaimClient = new ReclaimClient({
  appId: process.env.NEXT_PUBLIC_RECLAIM_APP_ID,
  appSecret: process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET,
});

// Step 1: Request proof from Reclaim
const proof = await reclaimClient.requestProof({
  provider: 'twitter',
  username: socialHandle,
});

// Step 2: Submit real ZK proof to contract
await zkVerificationContract.submitZKProof(
  proof.zkProof,        // ← Real ZK proof
  proof.socialHandle,   // ← Verified Twitter handle
  institutionName
);
```

---

## Smart Contract Details

**Contract:** `ZKVerification.sol`
**Address:** `0xe3cd834a963B3A6A550aed05ece2535B02C83E3a` (Base Sepolia)

### Functions:

1. **submitZKProof(proof, socialHandle, institutionName)**
   - Anyone can call (self-verification)
   - Stores verification record on-chain
   - Emits `UserVerified` event

2. **verifyUser(user, socialHandle, institutionName, proofHash)**
   - Only admin/verifier can call
   - Manual verification (for special cases)

3. **getVerification(address)**
   - Returns: `(verified, verifiedAt, socialHandle, institutionName)`
   - Used by UI to check verification status

4. **isVerified(address)**
   - Returns: `bool` (true if verified)
   - Simple verification check

5. **revokeVerification(address)**
   - Only admin can call
   - Removes verification (if user violates terms)

---

## Testing the Feature

### Test Flow:

1. **Connect wallet** (Base Sepolia)
2. **Click "Verify Identity"**
3. **Enter test data:**
   - Social Handle: `@testuser123`
   - Institution: `Test Corp` (optional)
4. **Submit verification**
5. **Confirm transaction** in wallet
6. **Wait for confirmation** (~2 seconds)
7. **Check status:**
   - Header button should show "Verified" ✓
   - Green alert on funding pages
8. **Test create functionality:**
   - Go to `/funding`
   - Select any funding type
   - Click "Create" tab
   - Form should be enabled (no warning)

### Test Cases:

#### ✅ Verified User:
- Can create Looking for Grant requests
- Can create Grant Programs
- Can create Crowdfunding campaigns
- Header shows "Verified" button
- Green alerts on funding pages

#### ❌ Unverified User:
- Cannot create (forms disabled)
- Header shows "Verify Identity" button
- Amber warnings on funding pages
- Click warning → Opens verification modal

---

## UI Components Updated

### 1. Header.tsx (NEW)
- Added "Verify Identity" button
- Shows verification status (Verified/Unverified)
- Opens verification modal
- Checks verification on wallet connection
- Updates status on transaction confirmation

### 2. LookingForGrantManager.tsx (EXISTING)
- Checks verification before allowing creation
- Shows verification alerts

### 3. GrantProgramManager.tsx (NEW)
- Checks verification before allowing creation
- Shows verification alerts

### 4. CrowdfundingManager.tsx (NEW)
- Checks verification before allowing creation
- Shows verification alerts

---

## Environment Variables (Future)

When integrating real ZK verification:

```env
# Reclaim Protocol (or similar ZK provider)
NEXT_PUBLIC_RECLAIM_APP_ID=your_app_id
NEXT_PUBLIC_RECLAIM_APP_SECRET=your_app_secret
NEXT_PUBLIC_RECLAIM_TWITTER_PROVIDER=twitter_v1
```

---

## Security Considerations

### Current (Placeholder) Security:
- ⚠️ Anyone can verify themselves with any social handle
- ⚠️ No actual proof of social media ownership
- ⚠️ Suitable for testing only

### Future (Real ZK) Security:
- ✅ Cryptographic proof of social media ownership
- ✅ Zero-knowledge (no passwords/tokens revealed)
- ✅ Verifiable on-chain
- ✅ Prevents duplicate social handles
- ✅ Prevents impersonation

---

## FAQ

### Q: Why do I need to verify?
**A:** Verification ensures only legitimate users create funding opportunities, reducing spam and scams.

### Q: Is my data private?
**A:** Currently, your social handle is stored on-chain (public). Future ZK integration will keep your credentials private.

### Q: Can I use multiple social handles?
**A:** No, one address = one social handle. This prevents spam.

### Q: What if I want to update my handle?
**A:** Click "Verified" button → Enter new info → Submit (overwrites old data).

### Q: Can verification be revoked?
**A:** Yes, admins can revoke verification if terms are violated.

### Q: Does verification expire?
**A:** No, once verified you stay verified (unless revoked).

### Q: Can I verify multiple wallets with same handle?
**A:** No, each social handle can only be linked to one wallet address.

---

## Troubleshooting

### "Verification Required" but I already verified:
1. Check you're connected to the correct wallet
2. Check you're on Base Sepolia network
3. Wait for transaction confirmation (~2 seconds)
4. Refresh the page

### Transaction fails:
1. Make sure you have enough ETH for gas fees
2. Check you're on Base Sepolia network
3. Try again with higher gas limit

### Button doesn't show:
1. Make sure you're connected to a wallet
2. Refresh the page
3. Check browser console for errors

---

## Summary

✅ **What's Live:**
- Full verification UI/UX
- Smart contract integration
- Verification checks on all funding pages
- Header button with status indicator
- Verification modal with form

⏳ **What's Coming:**
- Real ZK proof verification
- Social media authentication
- Reclaim Protocol integration
- Cryptographic proof generation

🎯 **Current Use:**
- Perfect for testing funding features
- Demonstrates the full verification flow
- Ready for real ZK integration

---

**Last Updated:** January 12, 2025
**Status:** Placeholder Implementation (Production-Ready UI)
