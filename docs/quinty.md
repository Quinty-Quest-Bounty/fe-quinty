# Quinty Labs

## About Us

**Quinty Labs** is building the infrastructure for the onchain work economy. We're creating trustless coordination tools that eliminate intermediaries and enable direct collaboration between creators and builders worldwide.

### Our Mission

To make trustless collaboration as easy as sending a transaction. No bosses. No borders. Just builders.

### What We Build

- **100% Escrow Protocols** - Smart contracts that guarantee payment
- **Soulbound Reputation** - Permanent, portable achievement NFTs
- **Community Governance** - Democratic dispute resolution (coming soon)
- **Zero-Fee Infrastructure** - No platform taxes, only gas costs

---

## Smart Contracts

All Quinty smart contracts are deployed on **Base Sepolia Testnet** and verified on the blockchain explorer.

### Contract Addresses

| Contract | Address | Purpose |
|----------|---------|---------|
| **Quinty Core** | `0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D` | Main bounty engine with escrow |
| **Reputation System** | `0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e` | Tracks user stats and achievements |
| **NFT Badges** | `0xD49a54aFb982c0b76554e34f1A76851ed725405F` | Soulbound achievement NFTs |
| **Grant Programs** | `0x8b0B50732CCfB6308d5A63C1F9D70166DF63b661` | Institutional funding distribution |
| **Crowdfunding** | `0x0bf8d6EB00b3C4cA6a9F1CFa6Cd40b4cE486F885` | All-or-nothing campaigns |
| **Looking for Grant** | `0xcd01A6d3B8944080B3b1Bb79617415c0Ef895Cc6` | Flexible startup funding |
| **Social Verification** | `0x045Fb080d926f049db7597c99B56aEccc8977F36` | X account verification |
| **Airdrop Bounty** | `0x71C5f5C66e72bBFC7266429cA48ba65c38AFc6A4` | Promotional campaigns |
| **Dispute Resolver** | `0x961659d12E9dE91dC543A75911b3b0D269769E82` | Community voting (coming soon) |

### Network Information

**Base Sepolia Testnet**
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Block Explorer:** https://sepolia-explorer.base.org
- **Faucet:** https://portal.cdp.coinbase.com/products/faucet

### Smart Contract Features

#### 1. Quinty Core
- 100% ETH escrow for all bounties
- Blinded IPFS submissions (commit-reveal)
- Multiple winner support with custom shares
- Automatic slashing for ghost creators (25-50%)
- OPREC (Open Recruitment) phase
- Team submissions with profit sharing
- Reply system for creator-solver communication

#### 2. Reputation System
- Real-time tracking of all platform actions
- Automatic achievement unlocking at milestones (1, 10, 25, 50, 100)
- Seasonal leaderboards (monthly)
- Integration with NFT minting
- Permanent on-chain statistics

#### 3. NFT Badge System
- **7 Badge Types:**
  - BountyCreator (0)
  - BountySolver (1)
  - TeamMember (2)
  - GrantGiver (3)
  - GrantRecipient (4)
  - CrowdfundingDonor (5)
  - LookingForGrantSupporter (6)

- **5 Achievement Tiers:**
  - Bronze (1 achievement)
  - Silver (10 achievements)
  - Gold (25 achievements)
  - Platinum (50 achievements)
  - Diamond (100 achievements)

- **Soulbound:** All NFTs are non-transferable (permanently bound to wallet)

#### 4. Grant Programs
- Full escrow of grant funds
- Application and approval workflow
- Custom amount allocation per recipient
- Progress update posting
- Multi-recipient support

#### 5. Crowdfunding
- All-or-nothing goal-based funding
- Milestone system with sequential release
- Automatic refunds on failure
- Creator accountability through milestones

#### 6. Looking for Grant
- Flexible funding (no goal requirement)
- Instant withdrawal access
- VC discovery and backing
- Progress updates

#### 7. Social Verification
- X (Twitter) account verification
- Prevents spam and scam campaigns
- Required for grant/crowdfunding creation
- Visual verification badges in UI

#### 8. Dispute Resolver (Coming Soon)
- Stake-weighted community voting
- Top 3 submission ranking
- Proportional reward distribution
- Economic alignment for honest voting

### Security Features

- **OpenZeppelin Standards** - Battle-tested security libraries
- **ReentrancyGuard** - Protection on all fund transfers
- **Access Control** - Role-based permissions
- **Time-Locked Operations** - Deadline enforcement
- **Event-Driven Architecture** - Full transparency and auditability

### Verification Status

 All contracts are **verified** on Base Sepolia Explorer

You can view the source code and verify deployment at:
```
https://sepolia-explorer.base.org/address/[CONTRACT_ADDRESS]
```

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
- **Blockchain:** Base Sepolia (testnet) � Base Mainnet (production)
- **Storage:** IPFS for metadata, images, and submissions
- **Deployment:** Vercel Edge
- **Analytics:** On-chain events

---

## Connect With Us

### Official Links

< **Website:** [https://quinty.app](https://quinty.app)

=& **X (Twitter):** [@QuintyProtocol](https://twitter.com/QuintyProtocol)

=� **Discord:** [Join our community](https://discord.gg/quinty) *(coming soon)*

=� **Telegram:** [Quinty Official](https://t.me/quintyprotocol) *(coming soon)*

=� **Mirror:** [Read our essays](https://mirror.xyz/quinty.eth) *(coming soon)*

=� **GitHub:** [github.com/quinty-protocol](https://github.com/quinty-protocol)

=� **Email:** hello@quinty.app

### Social Media

Follow us for updates, announcements, and community highlights:

- **Product Updates:** Twitter/X
- **Technical Discussions:** GitHub Discussions
- **Community Chat:** Discord & Telegram
- **Long-Form Content:** Mirror
- **Development Updates:** GitHub

### Developer Resources

=� **Documentation:** [docs.quinty.app](https://docs.quinty.app)

=' **SDK:** Coming Q3 2025

<� **API:** Coming Q3 2025

= **Bug Bounty:** Coming after security audit

---

## Roadmap Highlights

### 2025: Building the Foundation

**Q1 - Launch**
- Base Mainnet deployment
- Dispute Resolution UI
- Security audit
- 1,000+ early users

**Q2 - Growth**
- Multi-chain support (Optimism, Arbitrum)
- DAO governance launch
- Mobile app beta
- 10,000+ active users

**Q3 - Ecosystem**
- Developer SDK & APIs
- Platform integrations
- Enterprise solutions
- 100,000+ active users

**Q4 - Scale**
- AI-powered features
- Advanced escrow models
- Reputation Finance (RepFi)
- 1,000,000+ active users

### 2026+: The Global Work Layer

- 10M+ active users worldwide
- $1B+ annual transaction volume
- 50+ countries served
- Universal reputation standard
- Fully autonomous DAO

---

## Community

### How to Get Involved

1. **Use the Platform** - Create bounties or submit solutions
2. **Build Your Reputation** - Earn soulbound NFT achievements
3. **Join Discord** - Connect with other builders
4. **Contribute to Open Source** - Submit PRs to our GitHub
5. **Spread the Word** - Share Quinty with your network

### Community Programs (Coming 2025)

- **Builder Grants** - $500K pool for ecosystem developers
- **Reputation Mining** - Earn tokens for platform activity
- **Ambassador Program** - Regional community leaders
- **Bug Bounty** - Rewards for security researchers

---

## Legal & Compliance

### Open Source

Quinty is committed to open-source development. All smart contracts and core protocol code are publicly available and auditable.

**License:** MIT

### Security

- Security audit planned for Q1 2025
- Bug bounty program launching after audit
- Multi-sig treasury management
- Gradual decentralization roadmap

### Privacy

- No personal data collection
- No KYC required for basic features
- Optional verification for anti-spam
- IPFS for decentralized storage

---

## Support

### Get Help

=� **Documentation:** Read our [comprehensive guides](https://docs.quinty.app)

=� **Community Support:** Ask questions in Discord

= **Report Issues:** [GitHub Issues](https://github.com/quinty-protocol/quinty/issues)

=� **Business Inquiries:** partnerships@quinty.app

### FAQs

**Q: Is Quinty free to use?**
A: Yes! 0% platform fees. You only pay blockchain gas costs.

**Q: Which networks do you support?**
A: Currently Base Sepolia (testnet). Base Mainnet launching Q1 2025.

**Q: Are my NFT achievements transferable?**
A: No. All achievement NFTs are soulbound (non-transferable) to maintain reputation integrity.

**Q: How do I get testnet ETH?**
A: Visit the [Base Sepolia faucet](https://portal.cdp.coinbase.com/products/faucet) to get free testnet tokens.

**Q: When will dispute resolution be available?**
A: Dispute Resolution UI is planned for Q1 2025.

---

## Press & Media

For press inquiries, partnership opportunities, or media requests:

=� **Press Contact:** press@quinty.app

**Media Kit:** Coming soon

---

## Acknowledgments

Built with d by builders, for builders.

Special thanks to:
- **Base** - For providing the perfect L2 infrastructure
- **OpenZeppelin** - For battle-tested smart contract libraries
- **Pinata** - For reliable IPFS infrastructure
- **Vercel** - For seamless deployment
- **Our Community** - For believing in the vision

---

**The future of work is trustless, global, and fair.**

**The future of work is Quinty.** =�

---

*Last updated: January 2025*
