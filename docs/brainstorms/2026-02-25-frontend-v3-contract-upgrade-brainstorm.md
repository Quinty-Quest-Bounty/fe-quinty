---
topic: Frontend V3 Contract Upgrade
date: 2026-02-25
status: complete
---

# Frontend V3 Contract Upgrade Brainstorm

## Context

The smart contract system (sc-quinty) has been upgraded to V3 with major changes:

- **Multi-winner bounties** — Up to 10 ranked prize tiers
- **ERC-20 token support** — ETH + whitelisted tokens (USDC on Base Sepolia)
- **Pull-based withdrawals** — All payouts credited to pendingWithdrawals mapping, users pull via withdrawETH()/withdrawToken()
- **Delegated verifiers** — Quest creators can delegate verification to other addresses
- **Removed social accounts** — socialHandle removed from submitToBounty() and submitEntry()
- **Pausable** — Emergency pause on all state-changing functions
- **rescueERC20** — Owner can rescue accidentally sent tokens

The frontend (fe-quinty) needs a full update to match the new contract API and expose new features.

## What We're Building

A comprehensive frontend update that:

1. **Replaces all contract ABIs** with V3 versions and updates contract addresses
2. **Updates all contract call signatures** — remove socialHandle, add token param, use new selectWinners (plural)
3. **Adds multi-winner prize creation** — simple split UI (total + winner count → auto-calculated tiers)
4. **Adds ERC-20 token selection** — ETH + USDC dropdown in bounty/quest creation forms
5. **Adds global withdrawal banner** — persistent header badge showing pending balance, one-click withdraw
6. **Adds drag-to-rank winner selection** — visual ranked slot interface for multi-winner judging
7. **Adds delegated verifier management** — address input + add/remove on quest detail page
8. **Removes social handle fields** from all submission forms

## Key Decisions

### 1. Prize tier UX: Simple split with auto-calculation
Creator enters total amount + number of winners. System calculates split (e.g., 50/30/20 for 3 winners, equal split for custom). This covers the majority of use cases without complex form UI. The contract accepts any prizes[] array, so we can always add advanced manual entry later.

### 2. Token selection: ETH + USDC only
Hardcoded dropdown with two options. No dynamic whitelist query needed. Matches current contract whitelist. When more tokens are whitelisted, add them to the dropdown. YAGNI — don't build dynamic token resolution until there are more than 3-4 tokens.

### 3. Withdrawal UX: Global banner in header
Persistent banner/badge in the site header whenever the user has a pending balance > 0. Shows amounts per token. One-click withdraw per token type. This is discoverable, non-intrusive, and keeps withdrawal as a global concern rather than per-bounty. Need to poll/watch pendingBalance(ETH, user) and pendingBalance(USDC, user) on the connected wallet.

### 4. Winner selection: Drag-to-rank
Bounty detail page shows submission cards that can be dragged into ranked prize slots (1st, 2nd, 3rd...). Number of slots matches prizes.length from bounty creation. Visual, intuitive, prevents errors (can't select more winners than prize tiers). May use a lightweight drag library or native HTML drag-and-drop.

### 5. Delegated verifiers: Include in this update
Quest detail page gets an "Add Verifier" section visible to the quest creator. Simple address input with add/remove functionality. Small scope but useful feature.

### 6. Scope: Full parity in one update
Update everything at once rather than phased. The contract changes are breaking (new function signatures), so we need to update ABIs and calls anyway. Adding the UI enhancements alongside is incremental work on top of the mandatory changes.

## What We're NOT Building

- Dynamic token whitelist resolution (querying allowedTokens)
- Advanced manual prize tier entry (per-rank custom amounts)
- Batch withdrawal (withdraw all tokens at once)
- Pause indicator in UI (admin-only concern)
- Token approval flow UI (approve + create in one step — just handle it in the create flow)

## Affected Files (High-Level)

### Contract Layer
- `/contracts/*.json` — Replace all ABI files with V3 versions from sc-quinty/exported-abis/
- `/src/utils/contracts.ts` — Update addresses, add USDC constants, update type exports

### Hooks
- `/src/hooks/useBounties.ts` — Update read calls for new getBounty return shape (token, prizes[], totalAmount)
- `/src/hooks/useQuests.ts` — Update read calls for new getQuest return shape (token field)
- New: `/src/hooks/useWithdrawals.ts` — Poll pending balances, provide withdraw functions

### Forms
- `/src/components/bounties/BountyForm.tsx` — Add winner count + token selector, remove social handle references, calculate prizes array
- `/src/components/quests/QuestForm.tsx` — Add token selector, remove social handle references

### Detail Pages
- `/src/app/bounties/[id]/page.tsx` — Multi-winner display, drag-to-rank judging, show token type
- `/src/app/quests/[id]/page.tsx` — Delegated verifier management, show token type

### New Components
- Withdrawal banner component (in Header)
- Drag-to-rank winner selector component
- Token selector dropdown component (shared)
- Verifier management component

### Removals
- Social handle input fields from all submission forms
- Social handle display from submission cards
- SocialAccount-related code/references

## ERC-20 Approval Flow

For ERC-20 bounties/quests, the user needs to approve the contract to spend their tokens before creation. The UX should be:

1. User selects USDC as token, enters amount
2. On "Create", check allowance first
3. If insufficient allowance: show "Approve USDC" button → wait for tx → then auto-proceed to create
4. If already approved: proceed directly to create

This is a standard pattern — two-step for first-time, one-step after approval.

## Resolved Questions

1. **How to handle old bounties/quests created with V2 API?** — The contract was redeployed with new addresses. Old bounties are on old contracts. The frontend just points to new addresses — no backward compatibility needed.
2. **Should we show token logos?** — Yes, use simple ETH and USDC SVG icons inline with the amount display.
3. **Split percentages for auto-calculation?** — Use: 1 winner = 100%, 2 winners = 60/40, 3 winners = 50/30/20, 4+ = proportional decrease with minimum 5% for last place.

## Open Questions

None — all questions resolved during brainstorming.
