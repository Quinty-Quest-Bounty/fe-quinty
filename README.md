# Quinty - Decentralized Work Protocol

> On-chain bounties, grants, and crowdfunding with soulbound reputation — built on Base Sepolia.

---

## What is Quinty?

Quinty is a decentralized collaboration platform where:

- **Creators escrow 100% ETH** upfront (no underpayment risk)
- **Solvers deposit 10%** to prove commitment
- **Reputation is permanent** via soulbound NFT badges
- **Disputes are democratic** with stake-weighted community voting
- **All transactions are transparent** on Base

No platform fees. No middlemen. Just trustless collaboration.

---

## Core Smart Contracts

### 1. **Quinty Core** - Task Bounty Engine
**Address:** `0x7169c907F80f95b20232F5B979B1Aac392bD282a`

The main bounty contract for task-based work:

- **100% ETH Escrow** — All bounty funds locked at creation
- **Blinded IPFS Submissions** — Prevents solution copying during active period
- **Winner Selection** — Creators choose winners after deadline
- **Automatic Slashing** — 25-50% goes to community voting if creator doesn't resolve
- **Team Support** — Multi-member submissions with profit sharing

**How it works:**
```
Creator: Post task → Escrow ETH → Review submissions → Select winners → Funds distributed
Solver: Find task → Submit solution + 10% deposit → Win → Claim reward + deposit refund
```

---

### 2. **Quinty Reputation** - Stats Tracking
**Address:** `0x2dc731f796Df125B282484E844485814B2DCd363`

Tracks every action across the platform:

- **Solver Stats:** Submissions, wins, team participations
- **Creator Stats:** Bounties posted, total payouts, resolution rate
- **Time Tracking:** First/last activity, consistency scores
- **Achievement Thresholds:** 1/10/25/50/100 milestone detection
- **NFT Triggers:** Automatically mints badges when thresholds reached

Integrated into all contracts — every bounty action updates reputation.

---

### 3. **Dispute Resolver** - Community Voting
**Address:** `0xF04b0Ec52bFe602D0D38bEA4f613ABb7cFA79FB5`

**Status:** 🚧 COMING SOON

Democratic justice system for expired/disputed bounties:

- **Stake-Weighted Voting** — 0.0001 ETH minimum, more stake = more influence
- **Top 3 Ranking** — Voters rank best submissions
- **Proportional Rewards** — Winners share slashed funds, voters earn 5-10%
- **Automatic Execution** — Smart contract enforces community decisions

**Economic Model:**
- Expired bounty → 25-50% slashed to DisputeResolver
- Community stakes ETH and votes
- Top submission wins majority of slashed funds
- Correct voters share 5% reward

---

### 4. **Quinty NFT (Soulbound)** - Achievement Badges
**Address:** `0x80edb4Aeb39913FaFfDAC2a86F3184508B57AAe2`

Non-transferable NFT badges for milestone achievements:

**7 Badge Types:**
- 🎯 BountyCreator (1/10/25/50/100 bounties posted)
- 🏆 BountySolver (1/10/25/50/100 bounties won)
- 👥 TeamMember (collaborative wins)
- 🎁 GrantGiver (funded grant programs)
- 💎 GrantRecipient (received grants)
- ❤️ CrowdfundingDonor (backed campaigns)
- 🚀 LookingForGrantSupporter (funded LFG requests)

**Tiers:** Bronze → Silver → Gold → Platinum → Diamond

**Soulbound Design:**
- Transfers permanently disabled at mint
- IPFS metadata with custom artwork
- Unique token ID per milestone
- Permanent proof of contribution

---

### 5. **Grant Program** - Institutional Funding
**Address:** `0xf70fBEba52Cc2A6F1e511179A10BdB4B820c7879`

For VCs/organizations distributing funds to selected projects:

- **Full Escrow** — Grant funds locked upfront
- **Application Period** — Projects apply with details, requested amounts
- **Selective Approval** — Approve specific applicants with custom amounts
- **Claim System** — Approved recipients claim their allocation
- **Progress Updates** — On-chain update posting
- **NFT Badges** — Both givers and recipients earn achievements

**VC Flow:**
```
1. Create grant (escrow total funds)
2. Set application/distribution deadlines
3. Review applications
4. Approve selected projects (can adjust amounts)
5. Approved projects claim grants
6. Track progress updates
```

**Use Cases:**
- "Web3 Innovation Grant: $100K to 10 teams"
- "DeFi Builder Grant: $50K for selected protocols"
- "Social Impact Grant: $25K for community projects"

---

### 6. **Crowdfunding** - All-or-Nothing Campaigns
**Address:** `0x64aC0a7A52f3E0a414D8344f6A4620b51dFfB6C2`

Milestone-based crowdfunding with anti-rug pull protection:

- **All-or-Nothing** — Goal must be reached or auto-refunds
- **Milestone System** — Funds unlock as milestones complete
- **Sequential Release** — Must release/withdraw milestone 1 before milestone 2
- **Creator Accountability** — Can't withdraw until milestone released
- **Automatic Refunds** — Contributors claim refunds if goal not reached

**Milestone Flow:**
```
Campaign: Build Community Center ($10K goal)
Milestones:
- M1: Land Purchase ($4K) → Creator releases → Withdraws → Uses funds
- M2: Construction Start ($3K) → Released after M1 withdrawn
- M3: Completion ($3K) → Released after M2 withdrawn
```

**Anti-Rug Pull:**
- Creator can't withdraw all funds at once
- Must release milestones one by one
- Community sees progress before next release

---

## Additional Features

### ZK Verification
**Address:** `0xe3cd834a963B3A6A550aed05ece2535B02C83E3a`

Privacy-first identity system:
- Connect wallet to Twitter/X without revealing credentials
- Required for creating grant programs, crowdfunding, LFG
- Visual verification badge in UI
- Placeholder mode for demo, Reclaim Protocol ready for production

### Looking for Grant
**Address:** `0x423fb3E158B8bA79Fabbd387dAEb844DC0709BeF`

Flexible startup funding (no all-or-nothing):
- Keep funds even if goal not reached
- Withdraw anytime as needed
- VCs discover and back early-stage projects
- Progress updates with image support

### Airdrop Bounty
**Address:** `0x79dAe15C3612854F6bd025f7CDc6D4CDEE289049`

Social promotion campaigns:
- Fixed ETH rewards for verified social proofs
- "Tweet about our launch and earn 0.01 ETH"
- Transparent qualification tracking

---

## Quick Start

### 1. Install & Run
```bash
npm install
npm run dev
```

### 2. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
```

### 3. Get Testnet ETH
- Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Switch to Base Sepolia (Chain ID 84532)

### 4. Start Testing
- Connect wallet → Verify identity → Create bounty/grant/campaign

---

## Tech Stack

**Frontend:**
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Wagmi v2 + Viem + RainbowKit

**Smart Contracts:**
- Solidity 0.8.28
- OpenZeppelin (ReentrancyGuard, Ownable)
- Base Sepolia (Chain ID 84532)

**Storage:**
- IPFS (submissions, proofs, NFT metadata)
- Pinata (pinning service)

---

## Network Info

**Base Sepolia (Testnet)**
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia-explorer.base.org
- Native Token: ETH

---

## Documentation

- **Frontend Guide:** [QUICKSTART.md](./QUICKSTART.md)
- **Smart Contracts:** [../sc-quinty/README.md](../sc-quinty/README.md)
- **Integration:** [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
- **Funding Features:** [FUNDING_IMPLEMENTATION.md](./FUNDING_IMPLEMENTATION.md)
- **Recent Fixes:** [FUNDING_FIXES_COMPLETED.md](./FUNDING_FIXES_COMPLETED.md)

---

## Why Quinty?

**Traditional Platforms:**
- Upwork takes 20% fees
- Centralized dispute resolution
- Reputation locked in platform
- No fund transparency

**Quinty:**
- 0% platform fees (only gas)
- Community-powered disputes
- Soulbound reputation NFTs
- Full on-chain transparency

---

## Status

✅ All contracts deployed on Base Sepolia
✅ Full frontend with 6 core features
✅ Soulbound NFT badge system
✅ ZK verification (placeholder mode)
🚧 Dispute Resolver (coming soon)

**Production Ready**

---

## License

MIT - Open source and free to use.

---

**Built with ❤️ for Base and the onchain economy.**

🌐 **Launch:** http://localhost:3000
📖 **Docs:** [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
