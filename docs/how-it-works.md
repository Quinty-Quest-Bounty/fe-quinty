# How Quinty Works

Quinty turns work into trustless transactions. Here's the complete architecture and workflow.

## The Quinty Philosophy

**No Bosses. No Borders. Just Builders.**

Traditional platforms use intermediaries for trust. Quinty uses:

- **Escrow** - Locked funds = unlocked trust
- **Code** - Smart contracts don't lie
- **Community** - Democratic dispute resolution (soon)
- **Reputation** - Soulbound proof of contribution

> _"Escrow isn't a safety net. It's a handshake written in Solidity."_

## Core Principles

### 1. Commitment Has a Price Tag

**Before you play, you stake. Before you earn, you prove you're real.**

- **Creators:** Escrow 100% bounty amount upfront
- **Solvers:** Deposit 10% to show commitment

> _"If you don't lock it, you don't mean it. Escrow separates the committed from the curious."_

### 2. Escrow Turns Intent Into Integrity

**Promises mean more when backed by collateral.**

- Funds locked before any work begins
- Smart contract holds until resolution
- Automatic distribution on completion
- Automatic slashing if creator ghosts

> _"Locked funds. Unlocked trust. Your boss can't rug you here."_

### 3. Reputation Is Permanent

**Your achievements live forever in your wallet.**

- Soulbound NFT badges (non-transferable)
- On-chain stats (submissions, wins, created)
- Portable across all platforms
- Can never be deleted or taken away

## Workflow 1: Bounty System

### Step 1: Creator Posts Bounty

**Action:** `createBounty(description, deadline, allowMultipleWinners, winnerShares, slashPercent, hasOprec, oprecDeadline)`

**Parameters:**

- `description`: IPFS hash with task details
- `deadline`: Unix timestamp when submissions close
- `allowMultipleWinners`: true/false
- `winnerShares`: Array of percentage splits (if multiple winners)
- `slashPercent`: 25-50% (funds sent to solver if creator ghosts)
- `hasOprec`: Open recruitment phase (optional)
- `oprecDeadline`: OPREC application deadline (if enabled)

**What Happens:**

1. Creator sends ETH with transaction (e.g., 5 ETH)
2. Smart contract locks funds in escrow
3. `BountyCreated` event emitted
4. Reputation system records bounty creation
5. If first bounty → NFT badge "BountyCreator - Bronze" minted
6. UI updates with new bounty

**Status:** `OPREC` (if enabled) or `OPEN`

> _"Lock a little, earn a lot. That's how trust works on-chain."_

### Step 2: Solvers Submit Solutions

**Action:** `submitSolution(bountyId, blindedIpfsCid, teamMembers)`

**Parameters:**

- `bountyId`: The bounty ID
- `blindedIpfsCid`: Encrypted IPFS hash of solution
- `teamMembers`: Array of teammate addresses (optional)

**What Happens:**

1. Solver sends 10% of bounty amount as deposit
2. Smart contract stores blinded submission
3. `SubmissionCreated` event emitted
4. Reputation system records submission
5. Submission ID returned (used for reveal later)

**Why Blinded?**

- Prevents copying during submission period
- Solution revealed only after deadline
- Ensures fair competition

**Why 10% Deposit?**

- Proves solver is serious
- Prevents spam submissions
- Refunded when solution is revealed

> _"No empty promises — only staked intent."_

### Step 3: Deadline Passes → Reveal Solutions

**Action:** `revealSolution(bountyId, submissionId, revealIpfsCid)`

**Parameters:**

- `bountyId`: The bounty ID
- `submissionId`: Submission to reveal
- `revealIpfsCid`: Actual IPFS hash of solution

**What Happens:**

1. Solver calls reveal with real IPFS CID
2. Smart contract stores revealed CID
3. `SolutionRevealed` event emitted
4. Creator can now view all revealed solutions

**Status:** `PENDING_REVEAL`

### Step 4: Creator Selects Winners

**Action:** `selectWinners(bountyId, winnerAddresses, submissionIds)`

**Parameters:**

- `bountyId`: The bounty ID
- `winnerAddresses`: Array of winner addresses
- `submissionIds`: Array of winning submission IDs

**What Happens:**

1. Smart contract validates deadline passed
2. Transfers bounty funds to winners (split if multiple)
3. Refunds winner deposits
4. `WinnersSelected` event emitted
5. Reputation system records wins
6. NFT badges minted for winners
7. Bounty marked `RESOLVED`

**Fund Distribution:**

- Single winner: 100% of bounty + deposit refund
- Multiple winners: Split by `winnerShares` + deposits refunded
- Team submission: Lead solver gets funds, splits with team

> _"Escrow replaces trust with truth — funds don't lie."_

### Step 5 (Alternative): Creator Ghosts → Slashing

**What Happens:**

- If creator doesn't resolve within `deadline + 7 days`
- Anyone calls `triggerSlash(bountyId)`
- Smart contract automatically:
  1. Slashes 25-50% of bounty (based on `slashPercent`)
  2. Sends slashed funds to solver address
  3. Emits `BountySlashed` event
  4. Marks bounty `EXPIRED`

**Next Step:**

- Community votes on fair outcome
- Top submission wins slashed funds
- Voters earn 5-10% reward

> _"WAGMI starts with work."_

## Workflow 2: Grant Programs

### Step 1: VC/Org Creates Grant

**Action:** `createGrant(name, description, applicationDeadline, distributionDeadline, maxRecipients)`

**What Happens:**

1. Grantor sends total grant amount (e.g., 100 ETH)
2. Smart contract locks funds in escrow
3. `GrantCreated` event emitted
4. Social verification check (must be verified)
5. NFT badge "GrantGiver - Bronze" minted (if first grant)

**Status:** `Open`

### Step 2: Projects Apply

**Action:** `applyForGrant(grantId, projectDescription, requestedAmount)`

**What Happens:**

1. Applicant submits details + requested amount
2. Smart contract stores application
3. `ApplicationSubmitted` event emitted
4. Application ID returned

**Status:** Still `Open`

### Step 3: Grantor Reviews & Approves

**Action:** `approveApplications(grantId, applicationIds, approvedAmounts)`

**What Happens:**

1. Grantor selects best applications
2. Can adjust requested amounts
3. Smart contract validates total ≤ escrowed amount
4. `ApplicationsApproved` event emitted

**Status:** `SelectionPhase`

### Step 4: Finalize Selection

**Action:** `finalizeSelection(grantId)`

**What Happens:**

1. Locks approved recipients
2. No more changes allowed
3. Grant becomes active
4. Recipients can now claim

**Status:** `Active`

### Step 5: Recipients Claim Grants

**Action:** `claimGrant(grantId)`

**What Happens:**

1. Smart contract validates recipient approved
2. Transfers approved amount to recipient
3. `GrantClaimed` event emitted
4. NFT badge "GrantRecipient - Bronze" minted
5. Updates funds distributed

**Status:** `Completed` (when all claimed)

## Workflow 3: Crowdfunding

### Step 1: Creator Launches Campaign

**Action:** `createCampaign(title, description, goal, deadline, milestones)`

**Milestones Example:**

```javascript
milestones = [
  { description: "Land Purchase", amount: parseEther("4") },
  { description: "Construction", amount: parseEther("3") },
  { description: "Completion", amount: parseEther("3") },
];
// Total: 10 ETH (must equal goal)
```

**What Happens:**

1. Social verification check (must be verified)
2. Validates milestones sum = goal
3. Smart contract creates campaign
4. `CampaignCreated` event emitted

**Status:** `Active`

### Step 2: Public Contributes

**Action:** `contribute(campaignId)` + send ETH

**What Happens:**

1. Contributor sends any amount
2. Smart contract tracks contribution
3. `ContributionReceived` event emitted
4. If first contribution → NFT badge "CrowdfundingDonor" minted
5. Updates total raised

**Auto-Success:**

- When `totalRaised >= goal` → Status becomes `Successful`

### Step 3: Finalize Campaign

**Action:** `finalizeCampaign(campaignId)` (called after deadline)

**What Happens:**

**If goal reached:**

- Status → `Successful`
- Creator can start releasing milestones

**If goal NOT reached:**

- Status → `Failed`
- Contributors can claim refunds

### Step 4: Release Milestones (Sequential)

**Action:** `releaseMilestone(campaignId, milestoneIndex)`

**What Happens:**

1. Creator marks milestone completed
2. Smart contract validates sequential (M1 before M2)
3. Milestone marked `Released`
4. Funds available for withdrawal

**Rules:**

- Must release M1 before M2
- Must withdraw M1 before releasing M2
- Ensures accountability

### Step 5: Withdraw Milestone Funds

**Action:** `withdrawMilestone(campaignId, milestoneIndex)`

**What Happens:**

1. Smart contract validates milestone released
2. Transfers milestone amount to creator
3. `MilestoneWithdrawn` event emitted
4. Milestone marked `Withdrawn`

**Status:** `Completed` (when all milestones withdrawn)

### Alternative: Claim Refund (Failed Campaign)

**Action:** `claimRefund(campaignId)`

**What Happens:**

1. Smart contract validates campaign failed
2. Calculates contributor's share
3. Transfers ETH back to contributor
4. `RefundClaimed` event emitted

## Workflow 4: Looking for Grant

### Step 1: Startup Creates Request

**Action:** `createFundingRequest(projectName, description, fundingGoal, deadline, details)`

**What Happens:**

1. Social verification check (must be verified)
2. Smart contract creates request
3. `FundingRequestCreated` event emitted
4. No escrow (flexible funding)

**Status:** `Active`

### Step 2: VCs Support

**Action:** `supportRequest(requestId)` + send ETH

**What Happens:**

1. VC sends any amount
2. Smart contract tracks support
3. `SupportReceived` event emitted
4. If first support → NFT badge "LookingForGrantSupporter" minted
5. Updates total raised

**Auto-Funded:**

- When `totalRaised >= goal` → Status becomes `Funded`

### Step 3: Withdraw Funds (Anytime)

**Action:** `withdrawFunds(requestId, amount)`

**What Happens:**

1. Creator can withdraw any amount
2. No goal requirement
3. No milestone restrictions
4. `FundsWithdrawn` event emitted

**Use Case:** Flexible runway for startups

## Reputation & NFT System

### Tracking Actions

Every platform interaction updates reputation:

**For Solvers:**

- `recordSubmission()` → Increments total submissions
- `recordWin()` → Increments total wins
- Triggers achievement checks

**For Creators:**

- `recordBountyCreation()` → Increments bounties created
- Updates seasonal leaderboard

**Seasonal System:**

- 1 month seasons
- Leaderboard tracks top solver + top creator
- Season end triggers special NFTs

### Achievement Milestones

**Bounty Solver:**

- 1 win → Bronze
- 10 wins → Silver
- 25 wins → Gold
- 50 wins → Platinum
- 100 wins → Diamond

**Bounty Creator:**

- Same tier system for bounties created

**Badge Types:**

1. BountyCreator (0)
2. BountySolver (1)
3. TeamMember (2)
4. GrantGiver (3)
5. GrantRecipient (4)
6. CrowdfundingDonor (5)
7. LookingForGrantSupporter (6)

### Soulbound Design

**NFT Properties:**

- `transferFrom()` → Permanently disabled
- `tokenURI` → IPFS metadata with custom artwork
- Unique token ID per milestone
- Permanent proof of contribution

> _"Reputation you own. Forever."_

## Social Verification System

### Purpose

Prevent spam and scams by verifying X (Twitter) account ownership before creation of:

- Grant programs
- Crowdfunding campaigns
- Looking for Grant requests

### How It Works

**Step 1:** `submitProof(proof, socialHandle, institutionName)`

- User verifies X account ownership
- Stores X handle → wallet address mapping
- Marks user as verified

**Step 2:** UI checks `isVerified(address)`

- Shows "Verified ✓" if true
- Enables creation forms

**Benefits:**

- Prevents anonymous spam accounts
- Builds trust through social identity
- No personal data stored on-chain

## Dispute Resolution System (Coming Soon)

### How It Will Work

**Automatic Slashing:**

When a bounty creator doesn't select winners within 7 days after deadline:

1. Anyone can call `triggerSlash(bountyId)`
2. 25-50% of bounty sent to Dispute Resolver
3. Community votes on fair outcome

**Community Voting:**

- Stake ETH to participate (0.0001 ETH minimum)
- More stake = more voting weight
- Rank top 3 submissions
- Winners share slashed funds
- Correct voters earn 5-10% reward

**Benefits:**

- Fair resolution when creators ghost
- Economic incentive for honest voting
- Transparent on-chain process
- Automatic execution

> _"When code fails, community decides."_ (Coming soon)

## Security Model

### Escrow Protection

- All funds locked in smart contracts
- No external calls during transfers
- ReentrancyGuard on all fund movements

### Access Control

- `onlyCreator` modifier for sensitive functions
- `onlyVerified` check for creation
- `onlyOwner` for admin functions

### Time Locks

- Deadlines enforced by `block.timestamp`
- Grace periods for late resolution
- Automatic slashing after grace

### Economic Security

- Deposits prevent spam (10% bounty)
- Slashing punishes bad creators (25-50%)
- Staking aligns voters (risk stake)

## Gas Optimization

### Efficient Storage

- Pack structs to minimize storage slots
- Use uint256 for all numbers (optimal)
- Arrays only where necessary

### Batch Operations

- `approveApplications()` → Multiple at once
- `batchMintBadges()` → Multiple NFTs at once
- Event-driven UI → Minimize reads

### View Functions

- All getters are `view` (no gas)
- UI polls these for free
- State updates via events

## Event System

### Why Events?

Events enable real-time UI updates without polling:

**Bounty Events:**

- `BountyCreated` → New bounty appears
- `SubmissionCreated` → Counter updates
- `WinnersSelected` → Funds distributed
- `BountySlashed` → Dispute triggered

**Frontend Hook:**

```typescript
useWatchContractEvent({
  address: QUINTY_ADDRESS,
  abi: QUINTY_ABI,
  eventName: "BountyCreated",
  onLogs: (logs) => {
    // Auto-refresh bounty list
    refetchBounties();
  },
});
```

### Event-Driven Architecture

1. User action → Transaction sent
2. Transaction confirmed → Event emitted
3. Frontend watches event → UI updates automatically
4. No manual refresh needed

## Summary

Quinty works through:

1. **Escrow-First Design** - All funds locked before work begins
2. **Dual-Deposit System** - Creators + solvers both stake
3. **Soulbound Reputation** - Permanent NFT achievements
4. **Community Governance** - Stake-weighted dispute resolution
5. **Event-Driven UX** - Real-time updates via blockchain events
6. **Multi-Product Suite** - Bounties, grants, crowdfunding, LFG

> _"Commitment has a price tag — paid in ETH."_

**The result?**

Zero-trust coordination at global scale. No middlemen. No fees. Just builders.
