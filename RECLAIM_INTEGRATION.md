# Reclaim Protocol Integration - ZK Verification

## Overview

Quinty now uses **Reclaim Protocol** for production-ready zero-knowledge Twitter/X account verification. Users can verify their Twitter identity without exposing credentials.

---

## How It Works

### Flow:
```
User clicks "Verify Identity" button
  ↓
Modal opens with Reclaim Protocol explanation
  ↓
User clicks "Verify with Reclaim Protocol"
  ↓
New window opens with Reclaim verification
  ↓
User logs into Twitter/X (secure, no credentials exposed)
  ↓
Reclaim generates ZK proof of Twitter ownership
  ↓
Proof submitted to smart contract
  ↓
Contract verifies proof and marks user as verified ✅
```

---

## Configuration

### Environment Variables

Added to `.env.local`:
```env
NEXT_PUBLIC_RECLAIM_APP_ID=0xb3D1dA51D014BBaF95e94fd1BDE550f7FE4eCf7C
NEXT_PUBLIC_RECLAIM_APP_SECRET=0x7f8064249abedfa6546150efa48af4b9c54bc1ac833debfb42bc4a6b4beddc11
```

---

## Files Modified/Created

### 1. **New Hook: `src/hooks/useReclaimVerification.ts`**

Custom React hook for Reclaim Protocol integration:
- Initializes Reclaim SDK
- Opens verification window
- Listens for proof generation
- Returns proof and claim data

**Key Functions:**
```typescript
const { verifyTwitter, isVerifying, error } = useReclaimVerification();
```

### 2. **Updated: `src/components/Header.tsx`**

Modified verification flow:
- Replaced placeholder proof with real Reclaim integration
- Added Reclaim verification button
- Updated UI with "How It Works" instructions
- Shows loading states during verification

**Changes:**
- ✅ Real ZK proof generation via Reclaim
- ✅ Extracts Twitter handle from proof
- ✅ Submits proof to smart contract
- ✅ Better UX with loading states

### 3. **Environment: `.env.local`**

Added Reclaim credentials for production use.

---

## Smart Contract Integration

### ZK Verification Contract
**Address:** `0xe3cd834a963B3A6A550aed05ece2535B02C83E3a`

**Function Called:**
```solidity
function submitZKProof(
    string memory proof,
    string memory socialHandle,
    string memory institutionName
) external
```

**Parameters:**
- `proof`: JSON string from Reclaim Protocol containing ZK proof
- `socialHandle`: Twitter username extracted from proof
- `institutionName`: Optional organization name

---

## Testing

### Steps to Test:

1. **Start Development Server:**
```bash
pnpm run dev
```

2. **Connect Wallet:**
   - Click "Connect Wallet" in header
   - Connect with MetaMask/RainbowKit

3. **Open Verification Modal:**
   - Click "Verify Identity" button in header
   - Modal opens with Reclaim explanation

4. **Start Verification:**
   - Click "Verify with Reclaim Protocol" button
   - New window opens with Reclaim interface

5. **Complete Twitter Verification:**
   - Log into your Twitter/X account in Reclaim window
   - Reclaim generates zero-knowledge proof
   - Window closes automatically

6. **Proof Submission:**
   - Proof is submitted to smart contract
   - Transaction confirmation via MetaMask
   - Success alert shows verified Twitter handle

7. **Verification Status:**
   - "Verify Identity" button changes to green "Verified" badge
   - Status persists across sessions

---

## User Experience

### Before Verification:
- Button: "Verify Identity" (default style)
- Required for: Creating grants, crowdfunding, LFG requests

### During Verification:
- Button shows: "Opening Reclaim..." with spinner
- Reclaim window opens
- User authenticates with Twitter

### After Verification:
- Button changes to: "Verified" (green badge with checkmark)
- Badge persists
- Can create funding features

---

## Privacy & Security

### Zero-Knowledge Proof:
- ✅ No credentials stored on-chain
- ✅ No passwords exposed to frontend
- ✅ Only cryptographic proof of Twitter ownership
- ✅ Twitter handle extracted from proof

### Reclaim Protocol Benefits:
- Decentralized verification
- Privacy-preserving by design
- Tamper-proof proofs
- No centralized trust required

---

## Production Considerations

### Current Setup:
✅ Production-ready Reclaim credentials
✅ Real Twitter/X verification
✅ Smart contract integration
✅ Persistent verification status

### Future Enhancements:
- [ ] Add more social platforms (GitHub, LinkedIn)
- [ ] Batch verification for multiple accounts
- [ ] Verification expiry/renewal
- [ ] Advanced claim extraction

---

## Troubleshooting

### Issue: "Verification window closed"
**Solution:** User closed Reclaim window before completing verification. Try again.

### Issue: "No proof received"
**Solution:** Reclaim verification failed or timed out. Check:
- Valid Twitter account
- Internet connection
- Reclaim service status

### Issue: "Verification Failed"
**Solution:**
- Check console for Reclaim errors
- Verify environment variables are set
- Ensure smart contract is deployed

---

## API Reference

### `useReclaimVerification` Hook

```typescript
interface UseReclaimVerification {
  verifyTwitter: () => Promise<ReclaimVerificationResult | null>;
  isVerifying: boolean;
  error: string | null;
}

interface ReclaimVerificationResult {
  proof: string;
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
}
```

### Usage Example:

```typescript
const { verifyTwitter, isVerifying, error } = useReclaimVerification();

const handleVerify = async () => {
  const result = await verifyTwitter();
  if (result) {
    // Submit proof to contract
    console.log("Proof:", result.proof);
    console.log("Twitter handle:", result.claimData.context);
  }
};
```

---

## Resources

- **Reclaim Protocol Docs:** https://docs.reclaimprotocol.org/
- **SDK Documentation:** https://www.npmjs.com/package/@reclaimprotocol/js-sdk
- **Dashboard:** https://dev.reclaimprotocol.org/

---

## Status

✅ **PRODUCTION READY**

All components integrated and tested:
- ✅ Reclaim SDK installed
- ✅ Environment configured
- ✅ Custom hook created
- ✅ Header component updated
- ✅ Smart contract integration
- ✅ Build successful

---

**Built with ❤️ using Reclaim Protocol for privacy-preserving identity verification.**
