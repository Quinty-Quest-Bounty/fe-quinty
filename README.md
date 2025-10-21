# Quinty - Decentralized Work Protocol

> **Your next gig is a transaction away. No bosses. No borders. Just builders.**

Quinty is a trustless collaboration platform built on Base that combines on-chain bounties, grants, and crowdfunding with permanent soulbound reputation.

## 🌟 Key Features

- **100% Escrow Protection** - All funds locked upfront, eliminating payment risk
- **Soulbound Reputation** - Permanent on-chain achievements via NFT badges
- **X Social Verification** - Verify identity via OAuth (no smartphone required)
- **Democratic Disputes** - Community-powered resolution with stake-weighted voting
- **Zero Platform Fees** - Only gas costs, no middleman cuts
- **Full Transparency** - All transactions visible on Base blockchain

## 🚀 Core Products

### 1. Bounty System
Task-based work with blinded submissions and automatic slashing for fair resolution.

### 2. Grant Programs
VCs and organizations distribute funds to selected projects through structured grant rounds.

### 3. Crowdfunding
All-or-nothing campaigns with milestone-based fund release for creator accountability.

### 4. Looking for Grant
Flexible startup funding where projects keep all contributions without goal requirements.

## 📍 Network Information

**Base Sepolia (Testnet)**
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia-explorer.base.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your WalletConnect Project ID, Pinata JWT, and X Client ID

# Run development server
npm run dev
```

Visit http://localhost:3000

## 🔐 X Social Verification Setup

To enable X verification, you need to set up OAuth:

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app and enable OAuth 2.0
3. Set callback URI: `http://localhost:3000/auth/callback`
4. Copy your Client ID
5. Add to `.env.local`: `NEXT_PUBLIC_TWITTER_CLIENT_ID=your_client_id`

**Note:** You'll also need to add `TWITTER_CLIENT_SECRET` to `.env.local` for secure backend verification.

## 📋 Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| Quinty Core | `0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D` |
| Reputation | `0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e` |
| NFT Badges | `0xD49a54aFb982c0b76554e34f1A76851ed725405F` |
| Grant Program | `0x8b0B50732CCfB6308d5A63C1F9D70166DF63b661` |
| Crowdfunding | `0x0bf8d6EB00b3C4cA6a9F1CFa6Cd40b4cE486F885` |
| Looking for Grant | `0xcd01A6d3B8944080B3b1Bb79617415c0Ef895Cc6` |
| Social Verification | `0x045Fb080d926f049db7597c99B56aEccc8977F36` |
| Airdrop Bounty | `0x71C5f5C66e72bBFC7266429cA48ba65c38AFc6A4` |
| Dispute Resolver | `0x961659d12E9dE91dC543A75911b3b0D269769E82` |

## 📚 Documentation

**Complete documentation is available in the [docs/](./docs/) folder:**

- [📖 What is Quinty?](./docs/what-is-quinty.md) - Deep dive into the platform
- [❓ Why Quinty?](./docs/why-quinty.md) - Problems we solve
- [⚙️ How It Works](./docs/how-it-works.md) - Architecture and workflows
- [🚀 Quick Start Guide](./docs/quickstart.md) - Get started in 5 minutes
- [📝 User Guides](./docs/user-guides/README.md) - Feature-specific guides
- [👨‍💻 Developer Guides](./docs/developer-guides/README.md) - Integration tutorials
- [🔮 Vision & Roadmap](./docs/vision.md) - Future of Quinty

### Smart Contracts

Full contract documentation and ABIs: [docs/contracts.md](./docs/contracts.md)

## 🛠 Tech Stack

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

## 🔐 Security

All contracts use:
- ✅ `ReentrancyGuard` on all fund transfers
- ✅ `Ownable` for admin functions
- ✅ Proper access control modifiers
- ✅ ETH transfer via `.call{value: X}("")`
- ✅ Validation of inputs and state
- ✅ Event emission for all state changes

## 🌐 Why Base?

Quinty is built on **Base** because:

1. **Low Fees** - Gas costs $0.01-$0.10 per transaction
2. **Fast Finality** - 2-second block times = instant confirmations
3. **Ethereum Security** - Inherits Ethereum's security via L2 rollup
4. **Coinbase Integration** - Easy onboarding for millions of users
5. **Growing Ecosystem** - Thriving developer and user community

## 🎯 The Quinty Promise

> **"Locked funds. Unlocked trust. Your boss can't rug you here."**

We're building infrastructure for the onchain work economy where:

- **Trust is enforced by code**, not corporations
- **Reputation truly belongs to you** (soulbound NFTs)
- **Work is global and permissionless**
- **Value flows directly** between creators and builders
- **Communities govern** disputes democratically

## 📊 Status

✅ All contracts deployed on Base Sepolia
✅ Full frontend with 6 core features
✅ Soulbound NFT badge system
✅ X Social Verification via OAuth
🚧 Dispute Resolver (coming soon)

**Production Ready** ✅

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT - Open source and free to use.

## 🔗 Links

- **Documentation:** [docs/](./docs/)
- **Website:** Coming soon
- **GitHub:** This repository
- **X:** @QuintyProtocol (coming soon)
- **Discord:** Join our community (coming soon)

---

**Built with ❤️ for Base and the onchain economy.**

**WAGMI starts with work.** 🚀
