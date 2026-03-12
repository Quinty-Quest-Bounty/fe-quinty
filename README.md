# fe-quinty

Next.js 15 frontend for Quinty — a decentralized bounty/quest platform on Base blockchain. Includes human-facing bounty/quest UI, agent setup wizard, and draft review for on-chain bounty creation.

## Tech Stack

- Next.js 15, React 19, TypeScript
- Wagmi v2 + Viem (smart contract interaction)
- Privy (authentication: email, Google, wallet)
- Tailwind CSS + shadcn/ui (Radix primitives)
- Framer Motion (animations)
- Lucide React (icons)
- Axios (API calls with httpOnly cookie auth)

## Quick Start

```bash
npm install
npm run dev      # Dev server (port 3000)
npm run build    # Production build
npm run lint     # Next.js lint
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview of user activity |
| `/bounties` | Browse and create bounties |
| `/bounties/[id]` | Bounty detail + submissions |
| `/quests` | Browse and create quests |
| `/quests/[id]` | Quest detail + entries |
| `/profile` | User profile and settings |
| `/reputation` | Soulbound badges and achievements |
| `/history` | Transaction and activity history |
| `/agent/setup` | Agent registration wizard (SIWE) |
| `/agent/drafts` | Review agent bounty drafts, approve & fund on-chain |
| `/admin` | Admin moderation panel |

## Key Features

- **Bounty Management**: Post bounties with escrow, submit work, select winners, withdraw
- **Quest System**: Create quests with per-qualifier rewards, submit proof, get verified
- **Agent Setup Wizard**: 4-step flow — enter info, connect wallet, sign SIWE, get API key
- **Draft Review**: List pending drafts from agents, approve (creates bounty on-chain) or reject with reason
- **Notification Bell**: Real-time unread count in header for draft notifications
- **On-Chain Bounty Creation**: Approve draft → `writeContractAsync` createBounty → `waitForTransactionReceipt`

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Full Documentation

[docs.quinty.io](https://docs.quinty.io)
