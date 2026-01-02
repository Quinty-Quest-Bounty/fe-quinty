# What is Quinty?

Quinty is a **decentralized work and funding protocol** built on Mantle that fundamentally reimagines how value flows between creators and solvers. It's a trustless platform where bounties, grants, and crowdfunding merge with permanent on-chain reputation.

## The Core Concept

At its heart, Quinty solves a simple problem: **How do you create trust between strangers in a permissionless system?**

Traditional platforms solve this with centralized intermediaries who take 20-30% fees and control your reputation. Quinty solves it with:

1. **100% Escrow** - All funds locked upfront in smart contracts
2. **Soulbound Reputation** - Permanent NFT badges that prove your history
3. **Community Governance** - Stake-weighted voting resolves disputes
4. **Zero Platform Fees** - Only blockchain gas costs

## How It Works

### For Creators (Bounty Posters, Grant Givers, Campaign Owners)

**Create → Escrow → Review → Distribute**

1. Post your task/grant/campaign with full ETH escrowed
2. Solvers/applicants/supporters submit their work/applications/contributions
3. Review submissions and select winners/recipients
4. Smart contract automatically distributes funds

**Key Protection:** If you fail to resolve on time, funds are automatically slashed and sent to community dispute resolution.

### For Solvers (Contributors, Applicants, Backers)

**Discover → Submit → Win → Earn Reputation**

1. Browse active bounties/grants/campaigns
2. Submit your solution with a 10% deposit (bounties only)
3. Get selected by creator or community
4. Receive payment + deposit refund + soulbound NFT badge

**Key Protection:** Your deposit ensures creators take you seriously, and you get it back when you win.

### For the Community (Dispute Resolvers) - Coming Soon

**Stake → Vote → Earn**

When bounties expire or disputes arise:

1. Stake ETH to participate in resolution (0.0001 ETH minimum)
2. Rank the top 3 submissions
3. Earn rewards from slashed funds (5-10%)
4. Build reputation as a trusted arbiter

## The Quinty Ecosystem

### 1. **Quinty Core** - Task Bounty Engine

- **100% ETH escrow** - All bounty funds locked at creation
- **Blinded IPFS submissions** - Prevents solution copying
- **Winner selection** - Creators choose winners after deadline
- **Automatic slashing** - 25-50% goes to dispute resolution if creator ghosts
- **Team support** - Multi-member submissions with profit sharing

**Use Cases:**

- "Build a DeFi dashboard → 5 ETH"
- "Design NFT collection → 2 ETH"
- "Write smart contract → 10 ETH"
- "Create marketing campaign → 3 ETH"

### 2. **Grant Programs** - Institutional Funding

- **Full escrow** - Grant funds locked upfront
- **Application period** - Projects apply with details and requested amounts
- **Selective approval** - Approve specific applicants with custom amounts
- **Claim system** - Approved recipients claim their allocation
- **Progress updates** - On-chain update posting
- **NFT badges** - Both givers and recipients earn achievements

**Use Cases:**

- "Web3 Innovation Grant: $100K to 10 teams"
- "DeFi Builder Grant: $50K for selected protocols"
- "Social Impact Grant: $25K for community projects"

### 3. **Crowdfunding** - All-or-Nothing Campaigns

- **Goal-based** - Must reach goal or auto-refunds
- **Milestone system** - Funds unlock as milestones complete
- **Sequential release** - Must complete milestone 1 before milestone 2
- **Creator accountability** - Can't withdraw until milestone released
- **Automatic refunds** - Contributors claim refunds if goal not reached

**Use Cases:**

- "Build Community Center → $10K goal → 3 milestones"
- "Launch DApp → $50K goal → 5 milestones"
- "Social Movement → $25K goal → 4 milestones"

### 4. **Looking for Grant** - Flexible Funding

- **No all-or-nothing** - Keep funds even if goal not reached
- **Withdraw anytime** - No milestone restrictions
- **VC discovery** - VCs discover and back early-stage projects
- **Progress updates** - Keep supporters informed

**Use Cases:**

- "Startup seeking runway → $100K"
- "Open source project → $20K"
- "Research initiative → $50K"

### 5. **Reputation System** - Soulbound NFTs

- **7 badge types** - Creator, Solver, Team, Grant Giver/Recipient, Donor, Supporter
- **5 tiers** - Bronze → Silver → Gold → Platinum → Diamond (1/10/25/50/100 achievements)
- **Non-transferable** - Badges are soulbound (can't be sold/transferred)
- **On-chain stats** - Total submissions, wins, bounties created, first/last activity

### 6. **Social Verification** - Identity Layer

- **X account verification** - Verify X (Twitter) account ownership
- **Required for creation** - Must verify to create grants, crowdfunding, LFG
- **Visual badges** - Verified users show checkmark in UI
- **Anti-spam** - Prevents anonymous accounts from creating scams

### 7. **Dispute Resolution** - Democratic Justice (Coming Soon)

- **Stake-weighted voting** - More stake = more influence
- **Top 3 ranking** - Voters rank best submissions
- **Proportional rewards** - Winners share slashed funds, voters earn 5-10%
- **Automatic execution** - Smart contract enforces community decisions

## Key Principles

### 1. **Trust Through Code**

No centralized entity controls funds or reputation. Smart contracts enforce all rules transparently.

### 2. **Skin in the Game**

- Creators escrow 100% upfront
- Solvers deposit 10% to show commitment
- Voters stake ETH to participate in disputes
- Everyone has economic incentive to be honest

### 3. **Permanent Reputation**

Your achievements are stored in soulbound NFTs that:

- Can never be transferred or sold
- Permanently prove your contribution history
- Travel with you across all platforms that read Mantle

### 4. **Zero Platform Tax**

Unlike Upwork (20% fee) or Gitcoin (platform fees), Quinty charges:

- **0% platform fees**
- Only blockchain gas costs
- All funds go to creators/solvers

### 5. **Community-Powered**

- Disputes resolved by community voting
- Reputation built through participation
- No central authority making decisions

## Technical Architecture

### Smart Contract Layer (Mantle Sepolia)

```
Quinty Core (0x7169...)
    ├── Manages bounties, submissions, winners
    ├── Integrates with Reputation system
    ├── Connects to NFT minting
    └── Triggers dispute slashing

Reputation (0x2dc7...)
    ├── Tracks all user actions
    ├── Calculates achievement thresholds
    ├── Triggers NFT badge minting
    └── Maintains seasonal leaderboards

NFT Badges (0x80ed...)
    ├── Mints soulbound achievements
    ├── Stores IPFS metadata
    ├── Disables all transfers permanently
    └── Provides token URIs for UI

Grant Program (0xf70f...)
    ├── Escrows grant funds
    ├── Manages applications
    ├── Distributes to selected recipients
    └── Tracks progress updates

Crowdfunding (0x64aC...)
    ├── All-or-nothing goal tracking
    ├── Milestone-based fund release
    ├── Automatic refunds on failure
    └── Sequential withdrawal enforcement

Looking for Grant (0x423f...)
    ├── Flexible funding (no goal requirement)
    ├── Instant withdrawal access
    ├── Supporter tracking
    └── Project updates

Social Verification (0xe3cd...)
    ├── X account verification
    ├── Social handle → address mapping
    ├── Institution verification
    └── Gating for grant/crowdfunding creation

Dispute Resolver (0xF04b...) [COMING SOON]
    ├── Stake-weighted community voting
    ├── Top 3 submission ranking
    ├── Proportional reward distribution
    └── Automatic execution of results
```

### Frontend Layer (Next.js 14)

- **React 18** + **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for beautiful design
- **Wagmi v2** + **Viem** for Web3 interactions
- **RainbowKit** for wallet connection
- **IPFS (Pinata)** for decentralized storage

### Storage Layer

- **On-chain** - All critical data (bounties, funds, reputation)
- **IPFS** - Submissions, proofs, images, metadata
- **Pinata** - IPFS pinning service

## Security Model

### Escrow Protection

All funds locked in smart contracts before any work begins. Creators can't rug pull.

### Deposit System (Bounties)

10% deposit from solvers prevents spam. Refunded on win or reveal.

### Time-Based Slashing

If creator doesn't resolve within deadline + grace period:

- 25-50% automatically slashed
- Sent to Dispute Resolver contract
- Community votes on fair outcome

### Reentrancy Guards

All fund transfers protected by OpenZeppelin's `ReentrancyGuard`.

### Access Control

Only authorized addresses can:

- Select winners (creator only)
- Claim funds (winner only)
- Mint badges (authorized contracts only)
- Resolve disputes (community stakers only)

## Why Mantle?

Quinty is built exclusively on **Mantle Sepolia** (testnet) and will deploy to **Mantle Mainnet** because:

1. **Low Fees** - Gas costs are minimal ($0.01-$0.10 per transaction)
2. **Fast Finality** - 2-second block times = instant confirmations
3. **Ethereum Security** - Inherits Ethereum's security via L2 rollup
4. **Coinbase Integration** - Easy onboarding for millions of users
5. **Growing Ecosystem** - Thriving developer and user community

## The Vision

Quinty is building the **operating system for the onchain work economy**.

Imagine a world where:

- Your reputation is truly yours (soulbound NFTs)
- Trust is enforced by code, not corporations
- Payments are instant and guaranteed
- Disputes are resolved by communities, not support tickets
- Creators and solvers keep 100% of value created

That's the world Quinty is building.

## Current Status

- ✅ **All contracts deployed on Mantle Sepolia**
- ✅ **Full frontend with 6 core features**
- ✅ **Soulbound NFT badge system**
- ✅ **Social verification (X account verification)**
- 🚧 **Dispute Resolver (coming soon)**

---

## About Quinty Labs

**Quinty Labs** is building the infrastructure for the onchain work economy. We're creating trustless coordination tools that eliminate intermediaries and enable direct collaboration between creators and builders worldwide.

### Our Mission

To make trustless collaboration as easy as sending a transaction. No bosses. No borders. Just builders.

---

## Technology Stack

### Frontend

- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Web3:** Wagmi v2 + Viem
- **Wallet:** RainbowKit
- **Storage:** IPFS (Pinata)
- **Animations:** Framer Motion

### Smart Contracts

- **Language:** Solidity ^0.8.20
- **Standards:** OpenZeppelin
- **Network:** Base (Ethereum L2)
- **Testing:** Hardhat

### Infrastructure

- **Blockchain:** Mantle Sepolia (testnet) → Mantle Mainnet (production)
- **Storage:** IPFS for metadata, images, and submissions
- **Deployment:** Vercel Edge
- **Analytics:** On-chain events

---

## Connect With Us

**Website:** [https://quinty.vercel.app](https://quinty.vercel.app)

**X:** [@QuintyLabs](https://x.com/QuintyLabs)

**GitHub:** [github.com/Quinty-Quest-Bounty](https://github.com/Quinty-Quest-Bounty)

---

**Welcome to the future of work. Welcome to Quinty.** 🚀
