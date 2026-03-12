# fe-quinty

Next.js 15 frontend for Quinty — a decentralized bounty/quest platform on Base blockchain.

## Quick Start

```bash
npm install
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run lint         # Next.js lint
npx tsc --noEmit     # Type check
```

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin moderation panel
│   ├── agent/
│   │   ├── drafts/         # Agent draft review + approve/reject
│   │   └── setup/          # Agent registration wizard (SIWE)
│   ├── auth/               # Auth callback pages
│   ├── bounties/           # Bounty detail pages
│   ├── dashboard/          # Main dashboard
│   ├── quests/             # Quest detail pages
│   ├── profile/            # User profile
│   ├── layout.tsx          # Root layout (fonts, Header)
│   ├── providers.tsx       # Privy + wagmi + QueryClient + AuthContext
│   └── page.tsx            # Landing/home page
├── components/
│   ├── ui/                 # shadcn/ui components (Radix-based)
│   ├── auth/               # LoginButton, UserMenu
│   ├── bounties/           # Bounty-specific components
│   ├── quests/             # Quest-specific components
│   ├── Header.tsx          # Main header with nav, notifications bell
│   ├── BountyCard.tsx      # Bounty card component
│   └── QuestCard.tsx       # Quest card component
├── contexts/
│   └── AuthContext.tsx     # Privy auth + profile sync + JWT cookies
├── hooks/
│   ├── useBounties.ts      # Direct chain reads via wagmi
│   ├── useQuests.ts        # Direct chain reads via wagmi
│   ├── useDrafts.ts        # Agent drafts CRUD via backend API
│   ├── useNotifications.ts # Notifications via backend API
│   └── ...                 # Other hooks (admin, history, etc.)
├── utils/
│   ├── web3.ts             # wagmi config, formatETH, formatAddress
│   ├── contracts.ts        # Contract ABIs and addresses
│   └── ipfs.ts             # IPFS metadata fetching
└── lib/
    └── utils.ts            # cn() utility
```

## Key Patterns

- **Auth**: Privy wallet login → JWT httpOnly cookies → `AuthContext` syncs profile with backend.
- **Chain reads**: Bounty/quest data read directly from smart contracts via `wagmi` `readContract` (not backend API).
- **Backend API calls**: `axios` with `{ withCredentials: true }` for cookie auth. Backend at `NEXT_PUBLIC_API_URL`.
- **UI library**: shadcn/ui (Radix primitives + Tailwind). Icons: `lucide-react`.
- **Brand color**: `#0EA885` (teal green).
- **Styling**: Tailwind CSS, fonts: Space Grotesk + Plus Jakarta Sans.
- **Animations**: `framer-motion` for page transitions and mobile menu.

## Smart Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| Quinty.sol | `0x4E84aaDC0471AB53B28c1d3b52FEF7c9742f0D53` |
| Quest.sol | `0x65Af33E2Aa718f075EE8a94587E65DeeA4dbA257` |

ABIs and addresses defined in `src/utils/contracts.ts`.

## Agent Pages

- `/agent/setup` — Multi-step wizard: enter agent info → connect wallet → sign SIWE → get API key
- `/agent/drafts` — List bounty drafts from agents, approve/reject (JWT auth)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |

## Current Branch: `feat/agent-friendly`

### Completed
- Agent drafts page (list, approve, reject with reason)
- Agent setup wizard (SIWE registration flow)
- Notification bell in header with unread count
- Navigation links to agent pages

### Not Yet Implemented
- On-chain bounty creation from approved draft (wagmi tx)
- Draft edit before approval
- Full notifications dropdown panel
- Email notification preferences

## Multi-Repo Context

| Repo | Purpose |
|------|---------|
| `fe-quinty` | Next.js 15 frontend (this repo) |
| `be-quinty` | NestJS backend |
| `landing-quinty` | Vite + React landing page |
| `sc-quinty` | Solidity smart contracts |
| `indexer-quinty` | Ponder blockchain indexer |
| `docs` | Mintlify documentation |
