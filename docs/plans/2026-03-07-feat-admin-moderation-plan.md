---
title: "feat: Admin Moderation & Content Hiding"
type: feat
status: active
date: 2026-03-07
origin: docs/brainstorms/2026-03-07-admin-moderation-brainstorm.md
---

# Admin Moderation & Content Hiding

## Overview

Add a backend-based moderation system that lets admin wallets hide bounties/quests from the UI. Hidden items return 404 on detail pages and are filtered from dashboard listings. Includes a dedicated `/admin` page for managing moderation.

(see brainstorm: `docs/brainstorms/2026-03-07-admin-moderation-brainstorm.md`)

## Problem Statement

Users can create duplicate or spam bounties/quests. There's currently no way to remove them — all data is read directly from on-chain with zero filtering.

## Proposed Solution

Backend moderation table in Supabase + API endpoints + frontend filtering. No smart contract changes needed.

## Implementation Phases

### Phase 1: Backend — Moderation Module (be-quinty)

#### 1a. Supabase migration: `moderated_items` table

```sql
-- supabase migration
CREATE TABLE moderated_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('bounty', 'quest')),
  on_chain_id INTEGER NOT NULL,
  reason TEXT,
  moderator_address TEXT NOT NULL,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_type, on_chain_id)
);

CREATE INDEX idx_moderated_items_type ON moderated_items(item_type);
```

#### 1b. Admin guard middleware

```
be-quinty/src/common/guards/admin.guard.ts
```

- Read `ADMIN_WALLETS` from env (comma-separated wallet addresses)
- Extract wallet address from JWT token (already in auth payload)
- Compare against admin list
- Return 403 if not admin

#### 1c. Moderation module

```
be-quinty/src/moderation/
  moderation.module.ts
  moderation.controller.ts
  moderation.service.ts
  entities/moderated-item.entity.ts
```

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/moderation/hidden` | Public | Returns `{bounties: number[], quests: number[]}` |
| POST | `/moderation/hide` | Admin | Body: `{type, onChainId, reason}` |
| DELETE | `/moderation/unhide/:type/:id` | Admin | Unhide an item |
| GET | `/moderation/list` | Admin | Full list with reasons and timestamps |

### Phase 2: Frontend — Filtering & 404 (fe-quinty)

#### 2a. Hidden items hook

```
fe-quinty/src/hooks/useHiddenItems.ts
```

- Fetch `GET /moderation/hidden` on mount
- Cache result, refresh every 60s
- Export: `{ hiddenBountyIds: Set<number>, hiddenQuestIds: Set<number>, isHidden(type, id) }`

#### 2b. Filter hidden items from listings

**Files to modify:**
- `src/hooks/useBounties.ts` — filter out hidden bounty IDs before returning
- `src/hooks/useQuests.ts` — filter out hidden quest IDs before returning
- `src/app/dashboard/page.tsx` — filter unified items using hidden IDs

#### 2c. 404 on hidden detail pages

**Files to modify:**
- `src/app/bounties/[id]/page.tsx` — check `isHidden('bounty', id)`, show 404 if true
- `src/app/quests/[id]/page.tsx` — check `isHidden('quest', id)`, show 404 if true

Use Next.js `notFound()` from `next/navigation` to trigger the built-in 404 page.

### Phase 3: Admin Panel (fe-quinty)

#### 3a. Admin context/hook

```
fe-quinty/src/hooks/useAdmin.ts
```

- Check if current wallet address is in `NEXT_PUBLIC_ADMIN_WALLETS` env var
- Export: `{ isAdmin: boolean }`

#### 3b. Admin page

```
fe-quinty/src/app/admin/page.tsx
```

**Features:**
- Gate: redirect non-admins to dashboard
- List all bounties and quests (on-chain data) with hide/unhide toggles
- Show hidden items highlighted with reason
- Stats: total items, hidden items count, recent moderation actions
- Search/filter by ID or title

#### 3c. Admin nav link

- Show "Admin" link in navbar only when `isAdmin` is true

## Acceptance Criteria

- [x] `moderated_items` table created in Supabase
- [x] `ADMIN_WALLETS` env var configured in be-quinty
- [x] `GET /moderation/hidden` returns list of hidden IDs (public, no auth)
- [x] `POST /moderation/hide` requires admin wallet, creates record
- [x] `DELETE /moderation/unhide/:type/:id` requires admin wallet, removes record
- [x] Dashboard filters out hidden bounties and quests
- [x] `bounties/:id` and `quests/:id` return 404 for hidden items
- [x] `/admin` page accessible only to admin wallets
- [x] Admin can hide/unhide from admin panel
- [x] `NEXT_PUBLIC_ADMIN_WALLETS` env var configured in fe-quinty

## Technical Considerations

- **On-chain data persists**: Hiding is UI-only. On-chain submissions to hidden items are still possible (user would need to call contract directly). This is acceptable — the goal is preventing casual duplicate usage, not absolute enforcement.
- **Caching**: Hidden items list is small and rarely changes. Cache in frontend with 60s refresh.
- **Race condition**: If admin hides while user is on detail page, the user can still submit. Next page load will 404. Acceptable tradeoff.
- **Backend downtime**: If backend is down, `useHiddenItems` returns empty set — all items show. Fail-open is acceptable since hiding is a moderation convenience, not security.

## Dependencies

- be-quinty must be running and accessible from fe-quinty
- Supabase project must have migration applied
- Both repos need new env vars

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-07-admin-moderation-brainstorm.md](../brainstorms/2026-03-07-admin-moderation-brainstorm.md)
  - Key decisions: hardcoded admin wallets, backend-only moderation, 404 for hidden items, no contract changes

### Internal References

- Auth guard pattern: `be-quinty/src/auth/auth.guard.ts`
- Data fetching: `fe-quinty/src/hooks/useBounties.ts`, `fe-quinty/src/hooks/useQuests.ts`
- Detail pages: `fe-quinty/src/app/bounties/[id]/page.tsx`, `fe-quinty/src/app/quests/[id]/page.tsx`
- Dashboard: `fe-quinty/src/app/dashboard/page.tsx`
