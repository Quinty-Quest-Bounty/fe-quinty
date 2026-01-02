# Quick Start Guide

This guide will help you for using Quinty.

## Prerequisites

- Web3 wallet (MetaMask, WalletConnect, etc.)
- Mantle Sepolia testnet MNT (get from faucet)
- Basic understanding of blockchain transactions

## Step 1: Get Testnet MNT

Visit the Mantle Sepolia faucet and get free testnet MNT:

- **Faucet:** https://faucet.sepolia.mantle.xyz/
- **Amount:** Request Mantle Sepolia MNT

## Step 2: Connect Your Wallet

1. Visit https://quinty.vercel.app
2. Click **"Connect Wallet"** in the top-right corner
3. Select your wallet provider
4. Approve the connection to **Mantle Sepolia** (Chain ID: 5003)

**If not on Mantle Sepolia:**

- Your wallet will prompt to add/switch networks
- Approve the network addition
- Confirm the switch

For full network details (RPC, explorer, faucet), see: [Smart Contracts & Network](contracts.md).

## Step 3: Choose Your Path

### Path A: Create a Bounty (Creators)

**Use Case:** Need someone to build/design/write something

1. **Navigate to Bounties**

   - Click "Bounties" in the navigation

2. **Click "Create Bounty"**

   - Fill in the form:
     - **Description:** "Build a simple NFT marketplace"
     - **Amount:** 1 ETH (example)
     - **Deadline:** Select a date (e.g., 7 days from now)
     - **Multiple Winners:** No (single winner)
     - **Slash Percent:** 30% (default)

3. **Submit Transaction**

   - Click "Create Bounty"
   - Confirm in wallet (gas + 1 ETH bounty)
   - Wait for confirmation (~2 seconds)

4. **Your Bounty is Live!**
   - View it in "My Bounties"
   - Share the link with potential solvers
   - Wait for submissions

**What Happens:**

- ✅ 1 ETH locked in smart contract escrow
- ✅ Bounty appears on platform
- ✅ Solvers can now submit solutions
- ✅ You earn "BountyCreator - Bronze" NFT badge (first bounty)

### Path B: Submit a Solution (Solvers)

**Use Case:** You have skills and want to earn

1. **Browse Bounties**

   - Navigate to "Bounties"
   - View "Active Bounties"
   - Find one you can solve

2. **Prepare Your Solution**

   - Work on the task
   - Upload files

3. **Submit Solution**

   - Click "Submit Solution" on bounty
   - Add team members if applicable
   - Submit transaction (gas + 10% deposit)

4. **Wait for Deadline**
   - After deadline, if announced as a winner
   - Reveal your solution

**What Happens:**

- ✅ 0.1 ETH deposit locked (returned when revealed)
- ✅ You're win 1 ETH
- ✅ You earn "BountySolver - Bronze" NFT badge (first win)

### Path C: Launch a Crowdfunding Campaign

**Use Case:** Building something and need community funding

1. **Verify Your X Account (Required)**

   - Click "Verify Identity" in header
   - Connect your X (Twitter) account
   - Submit verification transaction
   - Wait for confirmation

2. **Navigate to Funding**

   - Click "Funding" in navigation
   - Select "Crowdfunding"

3. **Click "Create Campaign"**

   - Fill in the form:
     - **Title:** "Build Community DAO Platform"
     - **Description:** Project details
     - **Goal:** 5 ETH
     - **Deadline:** 30 days from now

4. **Add Milestones**

   - **Milestone 1:** "Research & Design" - 2 ETH
   - **Milestone 2:** "Development" - 2 ETH
   - **Milestone 3:** "Launch" - 1 ETH
   - Total must equal goal (5 ETH)

5. **Submit Transaction**

   - Click "Create Campaign"
   - Confirm in wallet
   - Wait for confirmation

6. **Share Your Campaign**
   - Get the campaign link
   - Share on social media
   - Community contributes
   - If goal reached → Release milestones sequentially

**What Happens:**

- ✅ Campaign goes live
- ✅ Contributors can back your project
- ✅ Funds locked until goal reached
- ✅ Automatic refunds if goal not reached
- ✅ Milestone-based accountability

### Path D: Apply for a Grant

**Use Case:** Building something and VCs/orgs are offering grants

1. **Browse Grant Programs**

   - Navigate to "Funding"
   - Select "Offering a Grant"
   - View "Active Grants"

2. **Find a Grant**

   - Read grant criteria
   - Check if your project fits
   - Note application deadline

3. **Submit Application**

   - Click "Apply"
   - Fill in:
     - **Project Description:** What you're building
     - **Requested Amount:** How much you need
     - **Team Info:** Your background
   - Submit transaction

4. **Wait for Review**
   - Grantor reviews applications
   - If approved → Claim your grant
   - Funds sent to your wallet

**What Happens:**

- ✅ Application submitted
- ✅ Grantor sees your proposal
- ✅ If approved → Claim grant funds
- ✅ You earn "GrantRecipient - Bronze" NFT badge

## Step 4: Track Your Reputation

**View Your Badges:**

1. Connect wallet
2. Click your address in header
3. View your NFT badges

**Badge Types:**

- 🎯 **BountyCreator** - Created bounties
- 🏆 **BountySolver** - Won bounties
- 👥 **TeamMember** - Collaborative wins
- 🎁 **GrantGiver** - Funded grants
- 💎 **GrantRecipient** - Received grants
- ❤️ **CrowdfundingDonor** - Backed campaigns
- 🚀 **LookingForGrantSupporter** - Supported startups

**Tiers:**

- **Bronze:** 1 achievement
- **Silver:** 10 achievements
- **Gold:** 25 achievements
- **Platinum:** 50 achievements
- **Diamond:** 100 achievements

## Step 5: Explore Advanced Features

### OPREC (Open Recruitment)

**For selective bounties:**

1. Enable "OPREC" when creating bounty
2. Set OPREC deadline (e.g., 3 days)
3. Solvers apply with portfolios
4. Approve best candidates
5. Only approved can submit solutions

### Team Submissions

**Collaborate on bounties:**

1. Form a team
2. Leader submits solution
3. Add team member addresses
4. Funds auto-split among team
5. All team members earn badges

### Dispute Resolution (Coming Soon)

**If creator ghosts:**

1. Wait 7 days after deadline
2. Call `triggerSlash(bountyId)`
3. 30% of bounty sent to Dispute Resolver
4. Community votes on fair outcome
5. Winner gets slashed funds

### Looking for Grant (Flexible Funding)

**For startups seeking runway:**

1. Verify X account
2. Create funding request
3. VCs browse and support
4. Withdraw funds anytime (no goal requirement)
5. Post progress updates
