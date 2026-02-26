---
title: "feat: Frontend V3 Contract Upgrade"
type: feat
status: active
date: 2026-02-25
origin: docs/brainstorms/2026-02-25-frontend-v3-contract-upgrade-brainstorm.md
---

# feat: Frontend V3 Contract Upgrade

## Overview

Comprehensive frontend update to match the sc-quinty V3 smart contract API. This includes replacing all ABIs, updating contract call signatures, adding multi-winner prize creation, ERC-20 token selection (ETH + USDC), a global withdrawal banner, drag-to-rank winner selection, delegated verifier management, and removing all social handle fields.

## Problem Statement / Motivation

The smart contract system (sc-quinty) has been upgraded to V3 with breaking changes:
- New function signatures (removed socialHandle, added token param, selectWinner→selectWinners)
- New features (multi-winner bounties, ERC-20 support, pull-based withdrawals, delegated verifiers)
- New contract addresses (redeployed)

The frontend is currently non-functional against V3 contracts. This update restores full functionality and exposes all new features.

## Proposed Solution

Full parity update in one pass (see brainstorm: docs/brainstorms/2026-02-25-frontend-v3-contract-upgrade-brainstorm.md). Key UX decisions:
- **Prize tiers**: Simple split with auto-calculation (total + winner count)
- **Token selection**: Hardcoded ETH + USDC dropdown
- **Withdrawal**: Global banner in header with per-token withdraw
- **Winner selection**: Drag-to-rank visual interface
- **Delegated verifiers**: Address input + add/remove on quest detail page

## Technical Approach

### Phase 1: Contract Layer (Foundation)

All other changes depend on correct ABIs and addresses.

- [ ] Copy V3 ABI files from `sc-quinty/exported-abis/` to `fe-quinty/contracts/`
  - `Quinty.json` — Bounty contract ABI
  - `Quest.json` — Quest contract ABI
  - `QuintyReputation.json` — Reputation ABI (if used)
  - Files: `/contracts/Quinty.json`, `/contracts/Quest.json`

- [ ] Update `/src/utils/contracts.ts`
  - Update Quinty and Quest contract addresses to V3 deployed addresses
  - Add `USDC_BASE_SEPOLIA` constant (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
  - Add `ETH_ADDRESS` constant (`0x0000000000000000000000000000000000000000`)
  - Remove AirdropBounty import if present
  - Update ABI imports to match new file names

### Phase 2: Type Updates & Hook Refactoring

Update all TypeScript interfaces and data-fetching hooks to match V3 return shapes.

- [ ] Update `/src/hooks/useBounties.ts`
  - Remove `socialHandle` from `Submission` interface (was at line 10)
  - Add `token: string` and `prizes: bigint[]` to `Bounty` interface (lines 15-31)
  - Add `totalAmount: bigint` to `Bounty` interface
  - Update `getBounty` positional destructuring to match V3 return shape (lines 78-93)
  - Update `WinnerSelected` event to `WinnersSelected` (line 137)
  - Update any `selectWinner` references to `selectWinners`

- [ ] Update `/src/hooks/useQuests.ts`
  - Remove `socialHandle` from `Entry` interface (line 29)
  - Add `token: string` to `Quest` interface (lines 8-24)
  - Update `getQuest` positional destructuring to match V2 return shape (lines 68-81)

- [ ] Create `/src/hooks/useWithdrawals.ts` (NEW)
  - Poll `pendingBalance(ETH_ADDRESS, userAddress)` on Quinty contract
  - Poll `pendingBalance(USDC_BASE_SEPOLIA, userAddress)` on Quinty contract
  - Poll same on Quest contract
  - Aggregate totals across both contracts
  - Provide `withdrawETH()` and `withdrawToken(tokenAddr)` functions for each contract
  - Use `useReadContract` + `useWriteContract` from Wagmi
  - Refresh balances on block or after withdrawal tx confirmation

### Phase 3: Shared Components (New)

Build reusable components needed by multiple features.

- [ ] Create `/src/components/ui/TokenSelector.tsx` (NEW)
  - Dropdown with two options: ETH (default) and USDC
  - Show token icon (simple SVG) + name
  - Props: `value`, `onChange`, `disabled`
  - Uses shadcn/ui Select component
  - Returns token address (ETH_ADDRESS or USDC_BASE_SEPOLIA)

- [ ] Create `/src/components/WithdrawalBanner.tsx` (NEW)
  - Uses `useWithdrawals` hook
  - Shows persistent banner/badge in header when any pending balance > 0
  - Displays amounts per token (e.g., "0.5 ETH • 100 USDC available to withdraw")
  - One-click withdraw button per token type
  - Loading states during withdrawal transactions
  - Auto-hides when all balances are 0

- [ ] Create `/src/components/bounties/DragToRank.tsx` (NEW)
  - Visual ranked slot interface (1st, 2nd, 3rd... slots)
  - Number of slots = `prizes.length` from bounty creation
  - Submission cards can be dragged into slots
  - Show prize amount per slot
  - Validate: can't select more winners than prize tiers
  - Handle edge case: fewer submissions than prize slots (some slots stay empty)
  - Returns ordered array of submission IDs for `selectWinners()`
  - Use native HTML5 drag-and-drop or lightweight library (dnd-kit if already in deps, otherwise native)

- [ ] Create `/src/components/quests/VerifierManagement.tsx` (NEW)
  - Visible only to quest creator
  - Address input field + "Add Verifier" button
  - List of current verifiers with "Remove" button each
  - Calls `addVerifier(questId, address)` and `removeVerifier(questId, address)`
  - Basic address validation (0x + 40 hex chars)
  - Uses `useWriteContract` from Wagmi

### Phase 4: Form Updates

Update creation forms to support new features.

- [ ] Update `/src/components/bounties/BountyForm.tsx`
  - Add TokenSelector component (ETH default)
  - Add "Number of Winners" input (1-10, default 1)
  - Auto-calculate prize split based on winner count and total amount:
    - 1 winner = 100%
    - 2 winners = 60/40
    - 3 winners = 50/30/20
    - 4+ winners = proportional decrease, minimum 5% for last place
  - Display calculated prize breakdown preview
  - For ERC-20: implement approve-then-create flow
    1. Check `allowance` first
    2. If insufficient: show "Approve USDC" button → wait for tx
    3. Then auto-proceed to `createBounty`
  - Update `createBounty` call: add `prizes[]` array and `token` address parameter
  - Remove any social handle references from submission section
  - For ETH: `{ value: totalAmount }` as before
  - For ERC-20: no `msg.value`, contract pulls via `safeTransferFrom`

- [ ] Update `/src/components/quests/QuestForm.tsx`
  - Add TokenSelector component (ETH default)
  - For ERC-20: implement approve-then-create flow (same pattern as bounty)
  - Update `createQuest` call: add `token` address parameter
  - For ETH: `{ value: perQualifier * maxQualifiers }`
  - For ERC-20: no `msg.value`
  - Remove any social handle references

### Phase 5: Detail Page Updates

Update bounty and quest detail pages for new features.

- [ ] Update `/src/app/bounties/[id]/page.tsx`
  - Update `Bounty` and `Submission` interfaces to match V3 (remove socialHandle, add token/prizes/totalAmount)
  - Display token type with icon next to amounts (ETH icon or USDC icon)
  - Display prize tier breakdown (1st: X, 2nd: Y, 3rd: Z)
  - Replace single-winner selection with DragToRank component for multi-winner
  - Update `submitToBounty` call: remove socialHandle param
  - For ERC-20 submissions: implement approve-then-submit for 1% deposit
  - Update `selectWinner` → `selectWinners(bountyId, submissionIds[])` — takes array from DragToRank
  - Remove socialHandle display from submission cards (lines 727-734)
  - Show "Fewer winners than slots" messaging when applicable

- [ ] Update `/src/app/quests/[id]/page.tsx`
  - Update `Entry` and `Quest` interfaces (remove socialHandle, add token)
  - Display token type with icon next to reward amounts
  - Update `submitEntry` call: remove socialHandle param
  - Remove socialHandle display from entry cards (lines 646-654)
  - Add VerifierManagement component (visible only to quest creator)
  - Show delegated verifier badge on verification actions

### Phase 6: Header & Withdrawal Integration

- [ ] Update `/src/components/Header.tsx`
  - Import and render WithdrawalBanner component
  - Position between nav and profile section (around line 81-82)
  - Only render when wallet is connected

### Phase 7: Contract Manager Updates

Update the manager components that orchestrate contract interactions.

- [ ] Update `/src/components/BountyManager.tsx`
  - Update `createBounty` args (lines 87-99): add `prizes[]` and `token` params
  - Update `submitToBounty` (lines 107-130): remove socialHandle, handle ERC-20 deposit approval
  - Update `selectWinner` → `selectWinners` (lines 132-139): accept array of submission IDs

- [ ] Update `/src/components/QuestManager.tsx`
  - Update `createQuest` args (lines 67-80): add `token` param
  - Handle ERC-20 approval flow before creation
  - Remove socialHandle from quest submission calls

### Phase 8: Cleanup & Polish

- [ ] Remove all socialHandle/SocialAccount references
  - Search codebase for `socialHandle`, `social_handle`, `SocialAccount`
  - Remove from interfaces, form fields, display components, and any utility functions
  - Verify no dead imports or unused types remain

- [ ] Add token icons
  - Create or import simple ETH and USDC SVG icons
  - Use inline with amount displays throughout bounty/quest cards and detail pages

- [ ] Test all flows end-to-end
  - ETH bounty creation (single winner)
  - ETH bounty creation (multi-winner)
  - USDC bounty creation (approve + create flow)
  - Bounty submission (ETH deposit)
  - Bounty submission (USDC deposit with approval)
  - Multi-winner selection via drag-to-rank
  - ETH quest creation
  - USDC quest creation (approve + create)
  - Quest entry submission
  - Quest verification (by creator)
  - Quest verification (by delegated verifier)
  - Add/remove delegated verifier
  - Withdrawal of pending ETH
  - Withdrawal of pending USDC
  - Withdrawal banner appears/disappears correctly

## ERC-20 Approval Flow (Detail)

Standard two-step pattern used in BountyForm, QuestForm, and bounty submission:

```typescript
// 1. Check current allowance
const allowance = await tokenContract.read.allowance([userAddress, contractAddress]);

// 2. If insufficient, request approval
if (allowance < requiredAmount) {
  const approveTx = await tokenContract.write.approve([contractAddress, requiredAmount]);
  await waitForTransactionReceipt({ hash: approveTx });
}

// 3. Proceed with creation/submission (no msg.value for ERC-20)
const createTx = await bountyContract.write.createBounty([...args]);
```

**UX states:** "Approve USDC" button → spinner → "Creating Bounty" → success

## Prize Split Auto-Calculation

```typescript
function calculatePrizeSplit(totalAmount: bigint, winnerCount: number): bigint[] {
  if (winnerCount === 1) return [totalAmount];
  if (winnerCount === 2) return [totalAmount * 60n / 100n, totalAmount * 40n / 100n];
  if (winnerCount === 3) return [totalAmount * 50n / 100n, totalAmount * 30n / 100n, totalAmount * 20n / 100n];
  // 4+ winners: proportional with minimum 5% for last
  // ... implementation detail
}
```

## What We're NOT Building

(See brainstorm: docs/brainstorms/2026-02-25-frontend-v3-contract-upgrade-brainstorm.md)

- Dynamic token whitelist resolution (querying allowedTokens)
- Advanced manual prize tier entry (per-rank custom amounts)
- Batch withdrawal (withdraw all tokens at once)
- Pause indicator in UI (admin-only concern)

## Acceptance Criteria

### Functional Requirements

- [ ] All contract ABIs updated to V3 versions
- [ ] All contract addresses point to V3 deployments
- [ ] Bounty creation supports ETH and USDC with token selector
- [ ] Bounty creation supports 1-10 winners with auto-calculated prize split
- [ ] Quest creation supports ETH and USDC with token selector
- [ ] ERC-20 flows handle approval step before creation/submission
- [ ] Multi-winner selection uses drag-to-rank interface
- [ ] Withdrawal banner shows pending balances and enables one-click withdraw
- [ ] Delegated verifiers can be added/removed on quest detail page
- [ ] All socialHandle fields removed from forms and displays
- [ ] Token type displayed with icon on all amount displays

### Non-Functional Requirements

- [ ] No TypeScript compilation errors
- [ ] All existing functionality preserved (no regressions)
- [ ] ERC-20 approval UX is clear (loading states, error messages)
- [ ] Drag-to-rank is usable on mobile (touch events)

## Dependencies

- V3 contract ABIs from `sc-quinty/exported-abis/`
- V3 contract addresses (from deployment — currently partially deployed, will use latest addresses)
- USDC contract address on Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-02-25-frontend-v3-contract-upgrade-brainstorm.md](docs/brainstorms/2026-02-25-frontend-v3-contract-upgrade-brainstorm.md) — Key decisions: simple split prizes, ETH+USDC dropdown, global withdrawal banner, drag-to-rank winners, include verifier UI, full parity scope

### Internal References

- Contract API: `sc-quinty/CLAUDE.md` — full V3 function signatures and integration patterns
- Exported ABIs: `sc-quinty/exported-abis/` — Quinty.json, Quest.json, constants.ts
- Existing hooks pattern: `src/hooks/useBounties.ts`, `src/hooks/useQuests.ts`
- Existing form pattern: `src/components/bounties/BountyForm.tsx`
- Header component: `src/components/Header.tsx`
