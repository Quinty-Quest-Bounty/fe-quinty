# Quintle - Quest in Mantle

> **Escrow replaces trust with truth — funds don't lie.**

Quintle is a trustless bounty platform built on Mantle that combines on-chain bounties with permanent soulbound reputation.

## Key Features

- **100% Escrow Protection** - All funds locked upfront, eliminating payment risk
- **Soulbound Reputation** - Permanent on-chain achievements via NFT badges
- **Zero Platform Fees** - No middleman cuts
- **Full Transparency** - All transactions visible on Mantle blockchain

## Core Products

### 1. Bounty System

Task-based work with blinded submissions and automatic slashing for fair resolution.

### 2. Soulbound Reputation

NFT badges that represent your on-chain work history. Immutable and tied to your wallet forever.

## Network Information

**Mantle Sepolia (Testnet)**

- Chain ID: 5003
- RPC: https://rpc.sepolia.mantle.xyz
- Explorer: https://sepolia.mantlescan.xyz

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your Pinata JWT and WalletConnect Project ID

# Run development server
pnpm run dev
```

Visit http://localhost:3000

## Contract Addresses (Mantle Sepolia)

| Contract   | Address                                      |
| ---------- | -------------------------------------------- |
| Quintle    | `0x0000000000000000000000000000000000000000` |
| Reputation | `0x0000000000000000000000000000000000000000` |
| NFT Badges | `0x0000000000000000000000000000000000000000` |

> Note: Update these addresses after deploying contracts to Mantle Sepolia

## Tech Stack

**Frontend:**

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Wagmi v2 + Viem + RainbowKit

**Smart Contracts:**

- Solidity 0.8.28
- OpenZeppelin (ReentrancyGuard, Ownable)
- Mantle Sepolia (Chain ID 5003)

**Storage:**

- IPFS (submissions, proofs, NFT metadata)
- Pinata (pinning service)

## Security

All contracts use:

- ReentrancyGuard on all fund transfers
- Ownable for admin functions
- Proper access control modifiers
- MNT transfer via `.call{value: X}("")`
- Validation of inputs and state
- Event emission for all state changes

## Why Mantle?

Quintle is built on **Mantle** because:

1. **Low Fees** - Ultra-low gas costs
2. **Fast Finality** - Quick block times
3. **Ethereum Security** - Inherits Ethereum's security via L2
4. **Growing Ecosystem** - Thriving developer community

## The Quintle Promise

> **"Locked funds. Unlocked trust. Your boss can't rug you here."**

We're building infrastructure for the onchain work economy where:

- **Trust is enforced by code**, not corporations
- **Reputation truly belongs to you** (soulbound NFTs)
- **Work is global and permissionless**
- **Value flows directly** between creators and builders

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT - Open source and free to use.

---

**Built with love for Mantle and the onchain economy.**
