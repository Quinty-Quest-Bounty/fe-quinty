# Quinty V2 Frontend

A complete frontend implementation for the Quinty decentralized bounty system on Base Sepolia testnet.

## ✨ Features Implemented

### 🎯 Bounty Management

- **Create Bounties**: Post tasks with ETH escrow, deadlines, and slash percentages
- **Submit Solutions**: Upload blinded IPFS submissions with 10% deposits
- **Select Winners**: Creators can choose winners and distribute rewards
- **Communication**: Threaded replies between creators and solvers
- **Solution Reveals**: Winners can reveal actual solutions post-resolution
- **Oprec System**: Pre-bounty recruitment phase for team formation

### ⚖️ Dispute Resolution

- **Expiry Voting**: Community votes on expired bounties to rank top submissions
- **Disputes**: Creators can dispute winner selections
- **Staking System**: 0.0001 ETH minimum stakes for voting participation
- **Weighted Voting**: Higher stakes provide more voting power
- **Reward Distribution**: Proportional rewards for correct voters

### 🏆 NFT Achievement System

- **Milestone-Based Progression**: 1→10→25→50→100 achievement tiers
- **Soulbound NFT Badges**: Non-transferable reputation tokens (7 types)
- **Custom IPFS Artwork**: Unique images for each achievement type
- **MetaMask Integration**: Proper base64 metadata for wallet display
- **Achievement Categories**: Solver, Winner, Creator, Grant, and more
- **Real-time Tracking**: Automatic NFT minting when milestones reached

### 🎁 Airdrop Bounties

- **Campaign Creation**: Set up promotion tasks with fixed ETH rewards
- **Entry Submission**: Users submit social media proofs via IPFS
- **Verification System**: Community or creator verification of entries
- **Transparent Distribution**: First-come-first-served reward allocation
- **Progress Tracking**: Real-time campaign progress and qualification status

### 🏛️ Grant Program

- **Institutional Grants**: Organizations create funded grant programs
- **Application System**: Builders apply with project details
- **Selective Approval**: Grant givers approve specific applicants with custom amounts
- **Milestone Tracking**: Progress updates via IPFS
- **Badge Rewards**: NFT badges for grant givers and recipients

### 🚀 Looking For Grant (LFG)

- **Funding Requests**: Projects seek VC/investor funding
- **Flexible Contributions**: No all-or-nothing requirement
- **Anytime Withdrawal**: Creators can withdraw funds when needed
- **Progress Updates**: Keep backers informed via IPFS
- **Social Proof**: Link social accounts for credibility

### 💰 Crowdfunding

- **All-or-Nothing Campaigns**: Automatic refunds if goal not met
- **Milestone-Based Release**: Funds unlock as milestones complete
- **Sequential Distribution**: Prevents rug pulls with controlled releases
- **Contributor Badges**: NFTs for campaign supporters
- **Progress Tracking**: Real-time funding status

### 🛡️ ZK Verification (NEW!)

- **Social Identity Linking**: Connect wallet to social handles
- **Zero-Knowledge Proofs**: Verify identity without revealing sensitive data
- **Institution Verification**: Optional organization/institution affiliation
- **On-Chain Verification Status**: Permanent verification record
- **Reclaim Protocol Ready**: Integration hooks prepared for production
- **Verification Badge**: Visual indicator of verified status
- **Required for Grants**: Must verify to create grant/crowdfunding campaigns

## 🛠️ Technical Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: Wagmi v2 + Viem + RainbowKit for wallet connections
- **Network**: Base Sepolia Testnet (Chain ID: 84532)
- **Contracts**: 9 production-ready smart contracts
- **IPFS**: Pinata for decentralized storage

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Base Sepolia RPC (optional, uses default if not set)
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# IPFS/Pinata (get from https://app.pinata.cloud/)
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here

# Reclaim Protocol (for ZK verification, get from https://dev.reclaimprotocol.org/)
NEXT_PUBLIC_RECLAIM_APP_ID=your_reclaim_app_id
NEXT_PUBLIC_RECLAIM_APP_SECRET=your_reclaim_app_secret
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open Application

Navigate to [http://localhost:3000](http://localhost:3000)

### 5. Connect Wallet

The app will automatically prompt you to:
- Switch to Base Sepolia network (or add it if not configured)
- Connect your wallet via RainbowKit

## 📋 Smart Contract Integration

### Contract Addresses (Base Sepolia)

All 9 contracts are deployed and verified on Base Sepolia:

| Contract | Address |
|----------|---------|
| **Quinty Core** | `0x7169c907F80f95b20232F5B979B1Aac392bD282a` |
| **QuintyNFT** | `0x80edb4Aeb39913FaFfDAC2a86F3184508B57AAe2` |
| **QuintyReputation** | `0x2dc731f796Df125B282484E844485814B2DCd363` |
| **DisputeResolver** | `0xF04b0Ec52bFe602D0D38bEA4f613ABb7cFA79FB5` |
| **AirdropBounty** | `0x79dAe15C3612854F6bd025f7CDc6D4CDEE289049` |
| **ZKVerification** | `0xe3cd834a963B3A6A550aed05ece2535B02C83E3a` |
| **GrantProgram** | `0xf70fBEba52Cc2A6F1e511179A10BdB4B820c7879` |
| **LookingForGrant** | `0x423fb3E158B8bA79Fabbd387dAEb844DC0709BeF` |
| **Crowdfunding** | `0x64aC0a7A52f3E0a414D8344f6A4620b51dFfB6C2` |

**View on Explorer**: https://sepolia-explorer.base.org

### ABIs & TypeScript Support

All contract ABIs are available in `contracts/` directory:
- Individual JSON files for each contract
- TypeScript constants with addresses and enums
- Type-safe contract interactions with Wagmi

```typescript
import { QUINTY_ABI, getContractAddress } from '@/utils/contracts';

const address = getContractAddress('Quinty');
// Returns: 0x7169c907F80f95b20232F5B979B1Aac392bD282a
```

## 🎨 Component Architecture

### Core Components

- **BountyManager**: Complete bounty lifecycle (create, submit, select, reveal)
- **DisputeManager**: Voting and dispute resolution interface
- **ReputationDisplay**: User profiles, stats, and leaderboards
- **AirdropManager**: Promotion campaign system
- **ZKVerificationModal**: Identity verification interface
- **ZKVerificationBadge**: Visual verification status indicator

### Custom Hooks

- **useZKVerification**: ZK verification state and submission
- **useAlert**: Toast notifications and alerts

### Utility Functions

- **contracts.ts**: ABI definitions, addresses, enums
- **web3.ts**: Wagmi config, formatETH, parseETH helpers
- **network.ts**: Network switching utilities
- **ipfs.ts**: IPFS upload and retrieval functions

## 🔍 User Flows

### Creating a Bounty

1. Connect wallet to Base Sepolia
2. Navigate to "Bounties" → "Create"
3. Fill in description, amount (ETH), deadline, slash percentage
4. Optional: Enable oprec for pre-bounty recruitment
5. Submit transaction with full ETH escrow
6. Monitor submissions and manage communications

### Using ZK Verification

1. Click "Verify Identity" button in header
2. Enter your social handle (e.g., @username)
3. Optional: Add institution/organization name
4. Submit verification (demo mode generates proof automatically)
5. Transaction confirms on-chain verification
6. Verified badge appears on your profile
7. Now eligible to create grants and crowdfunding campaigns

### Creating a Grant Program

1. **Prerequisites**: Must be ZK verified
2. Navigate to Grant Program section
3. Fill in grant details:
   - Title and description
   - Maximum applicants
   - Application deadline
   - Distribution deadline
   - Total grant pool (ETH)
4. Submit with full escrow
5. Review applications and approve specific recipients
6. Approved recipients can claim their allocated funds

### Launching Crowdfunding

1. **Prerequisites**: Must be ZK verified
2. Navigate to Crowdfunding section
3. Create campaign with:
   - Project title and details
   - Funding goal (ETH)
   - Campaign deadline
   - Milestones (descriptions + amounts)
4. Campaign goes live for contributions
5. If funded: Release milestones sequentially
6. If not funded: Automatic refunds to all contributors

### Participating in Disputes

1. View active disputes in "Disputes" section
2. Review submission details and requirements
3. Stake minimum 0.0001 ETH to vote
4. Rank top 3 submissions in order of preference
5. Earn proportional rewards if vote aligns with majority

## 🌐 Network Configuration

### Base Sepolia (Current Deployment)

- **Chain ID**: 84532 (0x14a34)
- **RPC**: https://sepolia.base.org
- **Currency**: ETH (Ethereum)
- **Explorer**: https://sepolia-explorer.base.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Wallet Setup

The app automatically handles network switching. If you're on the wrong network:

1. Click "Switch to Base Sepolia" in the network banner
2. Approve the network switch in your wallet
3. If Base Sepolia isn't added yet, approve adding the network
4. The app will refresh and connect to Base Sepolia

Alternatively, add Base Sepolia manually:
- Network Name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency Symbol: ETH
- Block Explorer: https://sepolia-explorer.base.org

## 📁 IPFS Integration

The application uses IPFS for:

- **Bounty Submissions**: Blinded solution uploads
- **Solution Reveals**: Post-resolution actual solutions
- **Airdrop Proofs**: Social media verification screenshots
- **NFT Metadata**: Custom achievement badge artwork
- **Grant Proposals**: Project details and documentation
- **Progress Updates**: Milestone completion reports

### Production IPFS Setup

For production deployment, configure Pinata:

1. Create account at https://app.pinata.cloud/
2. Generate API JWT token
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_PINATA_JWT=your_jwt_token_here
   ```
4. Upload files via `uploadToIpfs()` utility function

## 🔒 Security Features

- **ReentrancyGuard**: All payable functions protected
- **Access Controls**: Ownable patterns for admin functions
- **Input Validation**: Client and contract-level checks
- **Soulbound Tokens**: Non-transferable NFT badges
- **ZK Verification**: Privacy-preserving identity proofs
- **Escrow System**: Trustless fund management
- **Time Locks**: Deadline-based automatic execution

## 🧪 Development & Testing

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run lint
```

### Testing with Testnet

1. Get testnet ETH from Base Sepolia faucet
2. Connect MetaMask to Base Sepolia
3. Create test bounties, grants, or campaigns
4. Test full workflows end-to-end
5. View transactions on Base Sepolia explorer

## 📚 Documentation

- **Frontend Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Smart Contract Docs**: [../sc-quinty/README.md](../sc-quinty/README.md)
- **Integration Guide**: [../sc-quinty/FRONTEND_INTEGRATION.md](../sc-quinty/FRONTEND_INTEGRATION.md)
- **Full Summary**: [FINAL_SUMMARY.md](./FINAL_SUMMARY.md)

## 🎯 Future Enhancements

### Near-term

- [ ] Full Reclaim Protocol integration for production ZK proofs
- [ ] Enhanced IPFS file preview and validation
- [ ] Real-time notifications for contract events
- [ ] Mobile app with React Native
- [ ] Improved mobile responsiveness

### Advanced Features

- [ ] Multi-chain deployment (Base Mainnet, other L2s)
- [ ] Advanced reputation algorithms
- [ ] Oracle integration for automated verification
- [ ] Governance token integration
- [ ] DAO tooling for decentralized management

## 🤝 Contributing

This is a production-ready implementation covering all Quinty V2 features. Contributions welcome:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Open source implementation for the Quinty V2 ecosystem on Base network.

---

**Built with ❤️ for the decentralized bounty economy**

**Ready to launch! 🚀** All 9 contracts deployed, tested, and integrated with a fully functional frontend.
