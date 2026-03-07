---
title: "feat: Admin Moderation & Content Hiding"
type: feat
status: complete
date: 2026-03-07
---

# Admin Moderation & Content Hiding

## Problem

Users can create duplicate or spam bounties/quests. There's no way for an admin to remove or hide them. Currently:
- All bounties/quests are read directly from on-chain — no filtering layer
- Backend (be-quinty) has zero bounty/quest endpoints — it's purely auth + user profiles
- Smart contracts have global `pause()` but no per-item moderation
- No admin role exists anywhere in the system

## What We're Building

A full admin moderation system:

1. **Backend moderation API** — endpoints to hide/unhide bounties and quests
2. **Admin role** — hardcoded wallet addresses in env variable (simple, sufficient for early stage)
3. **Frontend filtering** — hidden items don't appear on dashboard or detail pages
4. **Admin panel page** — dedicated `/admin` page to manage hidden items and view stats
5. **404 behavior** — hidden items return 404 when accessed via direct URL

## Why This Approach

**Backend-based moderation (not on-chain)** because:
- No contract redeployment needed — current contracts don't have per-item hide
- Faster iteration — can adjust moderation rules without gas costs
- The on-chain data stays immutable (good for transparency), but display is controlled
- Global `pause()` remains available for emergencies

**Hardcoded wallet addresses** for admin because:
- Simple — just env variable `ADMIN_WALLETS=0x...,0x...`
- No DB migration for role column needed
- Sufficient for current stage (small team)
- Can upgrade to DB-based roles later

**404 for hidden items** because:
- Strictest approach — no info leak
- Prevents accidental submissions to hidden bounties/quests
- Clean from UX perspective

## Key Decisions

1. **Admin identity**: Hardcoded wallet addresses in `ADMIN_WALLETS` env var
2. **Moderation storage**: New `moderated_items` table in Supabase (type, on_chain_id, reason, hidden_at, moderator_address)
3. **Frontend data flow**: FE calls backend API to get list of hidden item IDs, then filters them out from on-chain reads
4. **Detail page**: Hidden items show 404, not a "hidden" banner
5. **Admin panel**: New `/admin` page — list all items, toggle hide/unhide, see stats
6. **Scope**: Hide/unhide only — no on-chain cancel (would need contract changes)

## Architecture

```
Frontend                    Backend                     On-chain
  |                           |                            |
  |-- GET /moderation/hidden -|-> Supabase moderated_items |
  |                           |                            |
  |-- useBounties() ----------|-------------------------> getBounty()
  |-- useQuests() ------------|-------------------------> getQuest()
  |                           |                            |
  | (filter out hidden IDs    |                            |
  |  from on-chain results)   |                            |
  |                           |                            |
  |-- POST /moderation/hide --|-> Insert moderated_items   |
  |   (admin only)            |   (check ADMIN_WALLETS)    |
```

## Repos Affected

- **be-quinty**: New moderation module (controller, service, entity), admin guard middleware
- **fe-quinty**: Filter hidden items in useBounties/useQuests, 404 on detail pages, new /admin page
- **sc-quinty**: No changes needed

## Open Questions

(none — all resolved during brainstorm)

## Resolved Questions

- **Who is admin?** → Hardcoded wallet addresses in env var
- **What happens to hidden items?** → 404 on detail page, removed from dashboard
- **On-chain cancel?** → Out of scope, backend-only hiding for now
- **Prevent duplicates?** → Separate feature, lower priority — admin hide handles existing dupes
