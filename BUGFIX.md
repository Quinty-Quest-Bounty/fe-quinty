# Bug Fix: ABI Encoding Params/Values Length Mismatch

## Issue
Error when creating bounties:
```
ABI encoding params/values length mismatch. 
Expected length (params): 7 
Given length (values): 5
```

## Root Cause
The `createBounty` function in Quinty.sol requires **7 parameters**, but the frontend was only passing **5**.

### Contract Signature (Quinty.sol)
```solidity
function createBounty(
    string memory _description,
    uint256 _deadline,
    bool _allowMultipleWinners,
    uint256[] memory _winnerShares,
    uint256 _slashPercent,
    bool _hasOprec,           // MISSING!
    uint256 _oprecDeadline    // MISSING!
) external payable nonReentrant
```

### Frontend Call (BountyManager.tsx - BEFORE FIX)
```typescript
args: [
  descriptionWithMetadata,     // 1. _description
  BigInt(deadlineTimestamp),   // 2. _deadline
  newBounty.allowMultipleWinners, // 3. _allowMultipleWinners
  winnerSharesArg,             // 4. _winnerShares
  BigInt(slashPercent),        // 5. _slashPercent
  // Missing: 6. _hasOprec
  // Missing: 7. _oprecDeadline
]
```

## Fix Applied

### 1. Added Oprec Fields to State
```typescript
const [newBounty, setNewBounty] = useState({
  // ... existing fields
  hasOprec: false,
  oprecDeadline: "",
});
```

### 2. Updated createBounty Call
```typescript
const oprecDeadlineTimestamp = newBounty.hasOprec && newBounty.oprecDeadline
  ? Math.floor(new Date(newBounty.oprecDeadline).getTime() / 1000)
  : 0;

writeContract({
  // ... 
  args: [
    descriptionWithMetadata,
    BigInt(deadlineTimestamp),
    newBounty.allowMultipleWinners,
    winnerSharesArg,
    BigInt(slashPercent),
    newBounty.hasOprec,              // ✅ Added
    BigInt(oprecDeadlineTimestamp),  // ✅ Added
  ],
  value: parseETH(newBounty.amount),
});
```

### 3. Updated All Form Resets
Updated all `setNewBounty` calls to include:
```typescript
hasOprec: false,
oprecDeadline: "",
```

## Result
✅ Build successful  
✅ createBounty now passes all 7 required parameters  
✅ Oprec functionality ready for UI implementation  

## Next Steps
To enable oprec in the UI, add form fields in BountyManager.tsx:
```tsx
<Checkbox
  checked={newBounty.hasOprec}
  onCheckedChange={(checked) => 
    setNewBounty({ ...newBounty, hasOprec: checked })
  }
>
  Enable Pre-Bounty Recruitment (Oprec)
</Checkbox>

{newBounty.hasOprec && (
  <Input
    type="datetime-local"
    value={newBounty.oprecDeadline}
    onChange={(e) => 
      setNewBounty({ ...newBounty, oprecDeadline: e.target.value })
    }
  />
)}
```

## Files Modified
- `/fe-quinty/src/components/BountyManager.tsx`
  - Added `hasOprec` and `oprecDeadline` to state
  - Fixed `createBounty` args array (5 → 7 parameters)
  - Updated all form reset calls
