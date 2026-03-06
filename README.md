# fe-quinty

Frontend web application for the Quinty platform.

## Tech Stack

- Next.js 15, React 19, TypeScript
- Wagmi v2 + Viem (contract interaction)
- Privy (authentication: email, Google, wallet)
- Tailwind CSS + shadcn/ui
- Pinata (IPFS uploads)

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview of user activity |
| `/bounties` | Browse and create bounties |
| `/quests` | Browse and create quests |
| `/profile` | User profile and settings |
| `/reputation` | Soulbound badges and achievements |
| `/history` | Transaction and activity history |
| `/link-wallet` | Connect wallet to account |

## Quick Start

```bash
pnpm install
pnpm dev
```

Runs on `http://localhost:3000`.

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your_pinata_gateway
```

## Full Documentation

[docs.quinty.io](https://docs.quinty.io)
