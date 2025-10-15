# Reclaim Protocol Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Verification Cancelled" immediately

**Symptoms:**
- Verification window opens but closes quickly
- Alert shows "Twitter verification was cancelled or failed"
- Console shows initialization errors

**Possible Causes & Solutions:**

#### A. Invalid App ID or Secret
Check your `.env.local`:
```bash
NEXT_PUBLIC_RECLAIM_APP_ID=0xb3D1dA51D014BBaF95e94fd1BDE550f7FE4eCf7C
NEXT_PUBLIC_RECLAIM_APP_SECRET=0x7f8064249abedfa6546150efa48af4b9c54bc1ac833debfb42bc4a6b4beddc11
```

**Verify:**
1. Check that credentials match Reclaim dashboard
2. Ensure no extra spaces or quotes
3. Restart dev server after changing `.env.local`

#### B. Provider ID Mismatch
Current Twitter provider ID: `f9f383fd-32d9-4c54-942f-5e9fda349762`

**If this doesn't work:**
1. Go to Reclaim Dashboard: https://dev.reclaimprotocol.org/
2. Check your app's configured providers
3. Copy the exact Provider ID for Twitter/X
4. Update `TWITTER_PROVIDER_ID` in `src/hooks/useReclaimVerification.ts`

#### C. CORS / Network Issues
Check browser console for:
- CORS errors
- Network failures
- API endpoint issues

**Solution:**
```bash
# Clear cache and restart
rm -rf .next
pnpm run dev
```

---

### Issue 2: Window Opens But Nothing Happens

**Symptoms:**
- Verification window stays blank
- No Twitter login prompt appears
- Console shows no errors

**Solutions:**

#### Check Browser Console
Open DevTools (F12) and look for:
```
Initializing Reclaim with APP_ID: 0xb3D...
Reclaim initialized successfully
Request URL generated: https://...
Starting Reclaim session...
```

If you don't see these logs, the SDK isn't initializing.

#### Verify Popup Blockers
- Allow popups for `localhost:3000`
- Check browser settings
- Try different browser (Chrome recommended)

#### Check Reclaim Service Status
- Visit: https://status.reclaimprotocol.org/
- Ensure all services are operational

---

### Issue 3: Proof Generation Fails

**Symptoms:**
- User completes Twitter login
- Window closes but no success
- "No proof received" error

**Debug Steps:**

1. **Check Console Logs:**
```javascript
// Look for:
✅ Verification successful! Proofs received: [...]
Proof details: {...}
```

2. **Verify Callback:**
```javascript
// In useReclaimVerification.ts
reclaimProofRequest.startSession({
  onSuccess: (proofs) => {
    console.log("Proofs:", proofs); // Should see proof data
  }
});
```

3. **Check Proof Structure:**
```javascript
{
  "provider": "f9f383fd-32d9-4c54-942f-5e9fda349762",
  "claimData": {
    "context": "{\"username\":\"yourhandle\"}",
    ...
  }
}
```

---

## Debugging Tools

### 1. Enable Verbose Logging

Add to `useReclaimVerification.ts`:
```typescript
console.log("=== RECLAIM DEBUG START ===");
console.log("APP_ID:", APP_ID);
console.log("APP_SECRET:", APP_SECRET ? "✓ Set" : "✗ Missing");
console.log("Provider ID:", TWITTER_PROVIDER_ID);
```

### 2. Test API Credentials

Create test file `test-reclaim.ts`:
```typescript
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";

async function testReclaim() {
  try {
    const request = await ReclaimProofRequest.init(
      process.env.NEXT_PUBLIC_RECLAIM_APP_ID!,
      process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET!,
      "f9f383fd-32d9-4c54-942f-5e9fda349762"
    );
    console.log("✅ Reclaim initialized successfully");
    const url = await request.getRequestUrl();
    console.log("✅ Request URL generated:", url);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testReclaim();
```

### 3. Check Network Requests

In DevTools Network tab:
- Look for requests to `reclaimprotocol.org`
- Check response status (should be 200)
- Verify request headers

---

## Manual Testing Steps

### Complete Flow Test:

1. **Open Browser Console** (F12)
2. **Click "Verify Identity"**
3. **Watch Console Output:**
   ```
   Starting verification process...
   Initializing Reclaim with APP_ID: 0xb3D...
   Reclaim initialized successfully
   Request URL generated: https://...
   Starting Reclaim session...
   ```

4. **Complete Twitter Login** in popup
5. **Check for Success:**
   ```
   ✅ Verification successful! Proofs received: [...]
   Proof details: {...}
   Parsed result: {...}
   Submitting proof to smart contract...
   ```

6. **Confirm Transaction** in MetaMask
7. **Verify Badge** shows "Verified" ✓

---

## Environment Checklist

Before testing, verify:

- [ ] `.env.local` has correct credentials
- [ ] Dev server restarted after env changes
- [ ] Browser allows popups for localhost
- [ ] MetaMask connected to Base Sepolia
- [ ] Smart contract deployed at correct address
- [ ] CORS/network not blocking requests
- [ ] Using latest Reclaim SDK version

---

## Getting Provider ID

If you need to get or verify Twitter Provider ID:

1. Visit Reclaim Dashboard: https://dev.reclaimprotocol.org/
2. Login with your credentials
3. Go to "Applications" → Your App
4. Click "Providers"
5. Find "Twitter" or "X"
6. Copy the Provider ID (UUID format)
7. Update in `useReclaimVerification.ts`:
   ```typescript
   const TWITTER_PROVIDER_ID = "your-provider-id-here";
   ```

---

## Advanced Debugging

### Inspect Proof Data Structure

Add before submitting to contract:
```typescript
console.log("=== PROOF INSPECTION ===");
console.log("Raw proof:", result.proof);
console.log("Claim data:", result.claimData);
console.log("Provider:", result.claimData.provider);
console.log("Parameters:", result.claimData.parameters);
console.log("Context:", result.claimData.context);
```

### Test Contract Interaction

Test contract call independently:
```typescript
// Test if contract accepts proof format
await writeContract({
  address: zkVerificationAddress,
  abi: ZK_VERIFICATION_ABI,
  functionName: "submitZKProof",
  args: [
    "test_proof_string",
    "test_handle",
    "test_org"
  ],
});
```

---

## Contact Support

If issues persist:

1. **Reclaim Protocol:**
   - Discord: https://discord.gg/reclaimprotocol
   - Docs: https://docs.reclaimprotocol.org/
   - Support: support@reclaimprotocol.org

2. **Check Logs:**
   - Browser console errors
   - Network tab responses
   - Server logs (if applicable)

3. **Gather Info:**
   - Browser version
   - Network environment
   - Error messages
   - Console logs

---

## Success Indicators

When working correctly, you should see:

✅ Popup opens immediately
✅ Reclaim interface loads
✅ Twitter login prompt appears
✅ After login, window closes
✅ Success alert shows
✅ MetaMask transaction prompt
✅ After confirmation, "Verified" badge appears

---

**Last Updated:** 2025-10-15
**Reclaim SDK Version:** 4.5.1
