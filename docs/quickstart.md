# Quick Start Guide

Get started with Quinty in 5 minutes. This guide will help you create your first bounty, submit a solution, or launch a campaign.

## Prerequisites

- Web3 wallet (MetaMask, WalletConnect, etc.)
- Base Sepolia testnet ETH (get from faucet)
- Basic understanding of blockchain transactions

## Step 1: Get Testnet ETH

Visit the Base Sepolia faucet and get free testnet ETH:
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Amount:** Request 0.5-1 ETH (more than enough for testing)

## Step 2: Connect Your Wallet

1. Visit https://quinty.app (or http://localhost:3000 for local dev)
2. Click **"Connect Wallet"** in the top-right corner
3. Select your wallet provider
4. Approve the connection
5. Your wallet will automatically switch to **Base Sepolia** (Chain ID: 84532)

**If not on Base Sepolia:**
- Your wallet will prompt to add/switch networks
- Approve the network addition
- Confirm the switch

**Network Details:**
- **Chain ID:** 84532
- **RPC:** https://sepolia.base.org
- **Explorer:** https://sepolia-explorer.base.org

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
   - Upload files/code to IPFS (or use Pinata/Web3.Storage)
   - Get the IPFS CID (e.g., `QmYourHash123...`)

3. **Submit Solution**
   - Click "Submit Solution" on bounty
   - Paste your IPFS CID
   - Add team members if applicable
   - Submit transaction (gas + 10% deposit)

4. **Wait for Deadline**
   - After deadline, reveal your solution
   - Creator reviews all submissions
   - Creator selects winner(s)

**What Happens:**
- ✅ 0.1 ETH deposit locked (returned when revealed)
- ✅ Solution submitted (blinded until deadline)
- ✅ You're in the running to win 1 ETH
- ✅ You earn "BountySolver - Bronze" NFT badge (first win)

### Path C: Launch a Crowdfunding Campaign

**Use Case:** Building something and need community funding

1. **Verify Your Identity (Required)**
   - Click "Verify Identity" in header
   - Enter social handle (e.g., @yourhandle)
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

### Dispute Resolution

**If creator ghosts:**
1. Wait 7 days after deadline
2. Call `triggerSlash(bountyId)`
3. 30% of bounty sent to Dispute Resolver
4. Community votes on fair outcome
5. Winner gets slashed funds

### Looking for Grant (Flexible Funding)

**For startups seeking runway:**
1. Verify identity
2. Create funding request
3. VCs browse and support
4. Withdraw funds anytime (no goal requirement)
5. Post progress updates

## Common Tasks

### Check Transaction Status

**After any transaction:**
1. Note the transaction hash
2. Visit https://sepolia-explorer.base.org
3. Paste hash to view status
4. Wait for confirmation (usually ~2 seconds)

### View Contract Data

**To inspect a bounty/grant/campaign:**
1. Get the ID from UI
2. Visit explorer
3. Go to contract address
4. Call `getBountyData(id)` / `getGrantInfo(id)` / `getCampaignInfo(id)`

### Upload to IPFS

**Using Pinata:**
1. Sign up at https://pinata.cloud
2. Upload your file/folder
3. Copy the IPFS CID (starts with `Qm...`)
4. Use CID in Quinty submissions

**Using Web3.Storage:**
1. Sign up at https://web3.storage
2. Upload via CLI or web UI
3. Get the CID
4. Use in Quinty

## Troubleshooting

### "Insufficient Funds" Error
- **Solution:** Get more testnet ETH from faucet
- **Check:** You're on Base Sepolia (not mainnet)

### "Transaction Reverted" Error
- **Bounty:** Check you have enough ETH for bounty + gas
- **Solution:** Check deposit is exactly 10% of bounty
- **Grant:** Check you're verified (ZK verification)

### "Network Wrong" Warning
- **Solution:** Switch to Base Sepolia in wallet
- **Chain ID:** 84532
- **Add network if prompted**

### "Verification Required" Alert
- **Solution:** Click "Verify Identity" in header
- **Required for:** Grants, Crowdfunding, Looking for Grant
- **Not required for:** Bounties (both creating and solving)

### Transaction Pending Too Long
- **Solution:** Check Base Sepolia block explorer
- **Usually:** 2-5 seconds on testnet
- **If stuck:** Try increasing gas price

## Security Tips

### Wallet Safety
- ✅ Never share your seed phrase
- ✅ Always verify transaction details before signing
- ✅ Use hardware wallet for large amounts
- ✅ Double-check contract addresses

### Smart Contract Interaction
- ✅ Verify you're on quinty.app (check URL)
- ✅ Check contract address matches docs
- ✅ Read transaction details in wallet
- ✅ Start with small amounts for testing

### IPFS Best Practices
- ✅ Use pinning services (Pinata, Web3.Storage)
- ✅ Don't upload sensitive data
- ✅ Verify CID before submitting
- ✅ Keep backup of your files

## Next Steps

**Dive Deeper:**
- [How Quinty Works](how-it-works.md) - Complete architecture
- [User Guides](user-guides/README.md) - Detailed feature guides
- [Smart Contracts](contracts.md) - Technical documentation
- [Vision & Roadmap](vision.md) - Future of Quinty

**Get Help:**
- GitHub Issues: Report bugs
- Documentation: Read full docs
- Community: Join Discord (coming soon)

## Summary

You now know how to:
- ✅ Get testnet ETH
- ✅ Connect wallet to Base Sepolia
- ✅ Create a bounty
- ✅ Submit a solution
- ✅ Launch a campaign
- ✅ Apply for grants
- ✅ Track your reputation

**Ready to earn? Start solving bounties!** 🚀
**Ready to build? Launch your campaign!** 🚀
**Ready to fund? Create a grant program!** 🚀

---

**Welcome to Quinty. Your next gig is a transaction away.** ⚡
