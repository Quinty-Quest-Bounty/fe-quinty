# Quinty V2 - Frontend Quick Start Guide

## 🚀 Getting Started (5 Minutes)

All smart contracts are deployed and ready! Here's how to integrate them into your frontend.

## 📍 Step 1: Contract Addresses & ABIs

Everything you need is in the `contracts/` folder:
```
contracts/
├── Quinty.json              <- Main bounty contract ABI
├── QuintyNFT.json          <- Soulbound badges ABI
├── GrantProgram.json       <- Grant system ABI
├── LookingForGrant.json    <- VC funding ABI
├── Crowdfunding.json       <- Crowdfunding ABI
├── AirdropBounty.json      <- Airdrop tasks ABI
├── constants.ts            <- All addresses + enums
└── all-abis.json           <- Combined ABIs (if needed)
```

## 💡 Step 2: Basic Integration

### Install Dependencies (if not already installed)
```bash
npm install ethers@^6.15.0
# or
yarn add ethers@^6.15.0
```

### Import and Use
```typescript
import { ethers } from 'ethers';
import { BASE_SEPOLIA_ADDRESSES, BASE_SEPOLIA_CHAIN_ID } from './contracts/constants';
import QuintyABI from './contracts/Quinty.json';

// 1. Connect to Base Sepolia
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');

// 2. Get contract instance
const quinty = new ethers.Contract(
  BASE_SEPOLIA_ADDRESSES.Quinty,
  QuintyABI,
  provider
);

// 3. Read data (no wallet needed)
const bountyData = await quinty.getBountyData(1);
console.log('Bounty amount:', ethers.formatEther(bountyData.amount));

// 4. Write data (needs wallet)
const signer = await window.ethereum.getSigner(); // Using MetaMask
const quintyWithSigner = quinty.connect(signer);

const tx = await quintyWithSigner.createBounty(
  "Build a DeFi dashboard",
  Math.floor(Date.now() / 1000) + 86400, // deadline: 1 day
  false, // single winner
  [], // no custom shares
  3000, // 30% slash
  false, // no oprec
  0, // no oprec deadline
  { value: ethers.parseEther("1.0") } // 1 ETH bounty
);

await tx.wait();
console.log('Bounty created!');
```

## 🎯 Step 3: Common Use Cases

### Create a Bounty
```typescript
import { BountyStatus } from './contracts/constants';

async function createBounty(description: string, amountEth: string) {
  const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours

  const tx = await quintyContract.createBounty(
    description,
    deadline,
    false,      // allowMultipleWinners
    [],         // winnerShares
    3000,       // slashPercent (30%)
    false,      // hasOprec
    0,          // oprecDeadline
    { value: ethers.parseEther(amountEth) }
  );

  const receipt = await tx.wait();

  // Get bounty ID from event
  const event = receipt.logs.find(
    log => log.topics[0] === quintyContract.interface.getEvent('BountyCreated').topicHash
  );
  const bountyId = event.args[0];

  return bountyId;
}

// Usage
const bountyId = await createBounty("Build NFT marketplace", "2.5");
```

### Submit a Solution
```typescript
async function submitSolution(
  bountyId: number,
  ipfsCid: string,
  isTeam: boolean = false,
  teamMembers: string[] = []
) {
  // Deposit is 10% of bounty amount
  const bountyData = await quintyContract.getBountyData(bountyId);
  const deposit = bountyData.amount / 10n;

  const tx = await quintyContract.submitSolution(
    bountyId,
    ipfsCid,
    teamMembers,
    { value: deposit }
  );

  return await tx.wait();
}

// Usage - Solo
await submitSolution(1, "QmYourSolution123", false, []);

// Usage - Team
await submitSolution(
  1,
  "QmTeamSolution456",
  true,
  ["0xTeamMember1...", "0xTeamMember2..."]
);
```

### Get User's NFT Badges
```typescript
import QuintyNFTABI from './contracts/QuintyNFT.json';

async function getUserBadges(userAddress: string) {
  const nftContract = new ethers.Contract(
    BASE_SEPOLIA_ADDRESSES.QuintyNFT,
    QuintyNFTABI,
    provider
  );

  const badgeIds = await nftContract.getUserBadges(userAddress);

  // Get details for each badge
  const badges = await Promise.all(
    badgeIds.map(async (tokenId) => {
      const badgeInfo = await nftContract.getBadgeInfo(tokenId);
      return {
        tokenId,
        type: badgeInfo.badgeType,
        metadataURI: badgeInfo.metadataURI
      };
    })
  );

  return badges;
}

// Usage
const userBadges = await getUserBadges("0xUserAddress...");
console.log(`User has ${userBadges.length} badges`);
```

### Listen for Events
```typescript
// Listen for new bounties
quintyContract.on('BountyCreated', (bountyId, creator, amount, deadline, hasOprec) => {
  console.log('New bounty!', {
    id: bountyId.toString(),
    creator,
    reward: ethers.formatEther(amount) + ' ETH',
    deadline: new Date(deadline * 1000)
  });
});

// Listen for submissions
quintyContract.on('SubmissionCreated', (bountyId, subId, solver, ipfsCid, isTeam) => {
  console.log('New submission!', {
    bountyId: bountyId.toString(),
    solver,
    isTeam
  });
});

// Remove listeners when done
quintyContract.removeAllListeners();
```

## 🎨 Step 4: UI Components (Example)

### Connect Wallet Button
```typescript
async function connectWallet() {
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    return;
  }

  // Request account access
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Check if on Base Sepolia
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== '0x14a34') { // 84532 in hex
    // Switch to Base Sepolia
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }],
      });
    } catch (error) {
      // Chain not added, add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x14a34',
          chainName: 'Base Sepolia',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia-explorer.base.org']
        }]
      });
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}
```

### Bounty List Component (React Example)
```tsx
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

function BountyList() {
  const [bounties, setBounties] = useState([]);

  useEffect(() => {
    async function loadBounties() {
      const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      const quinty = new ethers.Contract(
        BASE_SEPOLIA_ADDRESSES.Quinty,
        QuintyABI,
        provider
      );

      // Listen for BountyCreated events
      const filter = quinty.filters.BountyCreated();
      const events = await quinty.queryFilter(filter, -10000); // Last 10k blocks

      const bountyData = await Promise.all(
        events.map(async (event) => {
          const bountyId = event.args[0];
          const data = await quinty.getBountyData(bountyId);
          return {
            id: bountyId,
            description: data.description,
            amount: ethers.formatEther(data.amount),
            creator: data.creator,
            deadline: new Date(data.deadline * 1000),
            status: data.status
          };
        })
      );

      setBounties(bountyData);
    }

    loadBounties();
  }, []);

  return (
    <div>
      <h2>Active Bounties</h2>
      {bounties.map(bounty => (
        <div key={bounty.id}>
          <h3>{bounty.description}</h3>
          <p>Reward: {bounty.amount} ETH</p>
          <p>Deadline: {bounty.deadline.toLocaleDateString()}</p>
          <button onClick={() => window.location.href = `/bounty/${bounty.id}`}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 📚 Step 5: Key Enums & Constants

All available in `contracts/constants.ts`:

```typescript
// Bounty Status
enum BountyStatus {
  OPREC = 0,           // Open recruitment phase
  OPEN = 1,            // Accepting submissions
  PENDING_REVEAL = 2,  // Winner selected, awaiting reveal
  RESOLVED = 3,        // Completed
  DISPUTED = 4,        // In dispute
  EXPIRED = 5          // Deadline passed, slashed
}

// Badge Types (NFT)
enum BadgeType {
  BountyCreator = 0,
  BountySolver = 1,
  TeamMember = 2,
  GrantGiver = 3,
  GrantRecipient = 4,
  CrowdfundingDonor = 5,
  LookingForGrantSupporter = 6
}

// Campaign Status (Crowdfunding)
enum CampaignStatus {
  Active = 0,
  Successful = 1,
  Failed = 2,
  Completed = 3
}
```

## 🔍 Step 6: Debugging & Testing

### View Transactions
All transactions visible on Base Sepolia Explorer:
```
https://sepolia-explorer.base.org/tx/[TX_HASH]
```

### View Contracts
```
Quinty: https://sepolia-explorer.base.org/address/0x7169c907F80f95b20232F5B979B1Aac392bD282a
```

### Test with Real Data
1. Get testnet ETH from faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Connect MetaMask to Base Sepolia
3. Create a test bounty
4. Submit a test solution
5. Select winner & reveal

## ⚡ Performance Tips

1. **Use read-only provider for queries**
   ```typescript
   const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
   const contract = new ethers.Contract(address, abi, provider);
   ```

2. **Batch multiple reads**
   ```typescript
   const [bounty1, bounty2, bounty3] = await Promise.all([
     quinty.getBountyData(1),
     quinty.getBountyData(2),
     quinty.getBountyData(3)
   ]);
   ```

3. **Cache contract instances**
   ```typescript
   const contracts = {
     quinty: new ethers.Contract(...),
     nft: new ethers.Contract(...),
     // etc
   };
   ```

## 🆘 Common Issues

**Issue: "Insufficient funds"**
- Get testnet ETH from faucet
- Check you're on Base Sepolia (chain ID 84532)

**Issue: "Execution reverted"**
- Check function parameters match expected types
- Ensure you have enough ETH for gas + transaction value
- Check contract state (e.g., bounty must be OPEN to submit)

**Issue: "User rejected transaction"**
- User clicked "Reject" in MetaMask
- Handle this in your UI with try/catch

## 📖 Full Documentation

For complete details, see:
- `../sc-quinty/FRONTEND_INTEGRATION.md` - Full integration guide
- `../sc-quinty/FINAL_SUMMARY.md` - Complete project overview
- `contracts/constants.ts` - All addresses and enums

## ✅ You're Ready!

You now have:
- ✅ All contract ABIs
- ✅ All contract addresses
- ✅ TypeScript constants
- ✅ Working code examples
- ✅ Production-ready smart contracts on Base Sepolia

**Start building! 🚀**

Questions? Check the full docs or test contracts on Base Sepolia explorer.
