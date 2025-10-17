# Quinty - Decentralized Work Protocol

> **Your next gig is a transaction away. No bosses. No borders. Just builders.**

Quinty is a trustless collaboration platform built on Base that combines on-chain bounties, grants, and crowdfunding with permanent soulbound reputation.

## 🌟 Key Features

- **100% Escrow Protection** - All funds locked upfront, eliminating payment risk
- **Soulbound Reputation** - Permanent on-chain achievements via NFT badges
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
# Add your WalletConnect Project ID and Pinata JWT

# Run development server
npm run dev
```

Visit http://localhost:3000

## 📋 Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| Quinty Core | `0x7169c907F80f95b20232F5B979B1Aac392bD282a` |
| Reputation | `0x2dc731f796Df125B282484E844485814B2DCd363` |
| NFT Badges | `0x80edb4Aeb39913FaFfDAC2a86F3184508B57AAe2` |
| Grant Program | `0xf70fBEba52Cc2A6F1e511179A10BdB4B820c7879` |
| Crowdfunding | `0x64aC0a7A52f3E0a414D8344f6A4620b51dFfB6C2` |
| Looking for Grant | `0x423fb3E158B8bA79Fabbd387dAEb844DC0709BeF` |
| ZK Verification | `0xe3cd834a963B3A6A550aed05ece2535B02C83E3a` |
| Airdrop Bounty | `0x79dAe15C3612854F6bd025f7CDc6D4CDEE289049` |
| Dispute Resolver | `0xF04b0Ec52bFe602D0D38bEA4f613ABb7cFA79FB5` |

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
✅ ZK verification (placeholder mode)
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
- **Twitter:** @QuintyProtocol (coming soon)
- **Discord:** Join our community (coming soon)

---

**Built with ❤️ for Base and the onchain economy.**

**WAGMI starts with work.** 🚀
