# Remaining Implementation Guide

## ✅ Completed So Far

1. ✅ Floating Navbar with animations
2. ✅ AlertDialog System
3. ✅ Calendar with Presets
4. ✅ Looking for Grant [id] page
5. ✅ Grant Program [id] page

---

## 🚧 Remaining Tasks

### 1. Crowdfunding [id] Page

**File:** `src/app/funding/crowdfunding/[id]/page.tsx`

**Key Features Needed:**
- Campaign details display
- Milestone list with progress tracking
- Contribute button (for non-creators)
- Release Milestone button (for creator, sequential)
- Withdraw Milestone button (for creator, after release)
- Refund button (if campaign failed)
- Contributors list
- Share button

**Important Contract Functions:**
```typescript
// Read
getCampaignInfo(campaignId)
getMilestoneCount(campaignId)
getMilestone(campaignId, milestoneId)
getContributorCount(campaignId)
getContributor(campaignId, index)

// Write
contribute(campaignId) payable
releaseMilestone(campaignId, milestoneId)
withdrawMilestone(campaignId, milestoneId)
claimRefund(campaignId)
```

**Implementation Template:**

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  CROWDFUNDING_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../../../utils/contracts";
import { formatETH, formatAddress, wagmiConfig, parseETH } from "../../../../utils/web3";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import TetrisLoading from "../../../../components/ui/tetris-loader";
// ... other imports

enum CampaignStatus {
  ACTIVE = 0,
  SUCCESSFUL = 1,
  FAILED = 2,
  CANCELLED = 3,
}

enum MilestoneStatus {
  PENDING = 0,
  RELEASED = 1,
  WITHDRAWN = 2,
}

interface Milestone {
  description: string;
  amount: bigint;
  status: MilestoneStatus;
}

interface Contributor {
  contributor: string;
  amount: bigint;
  refunded: boolean;
}

interface Campaign {
  id: number;
  creator: string;
  title: string;
  description: string;
  goal: bigint;
  raisedAmount: bigint;
  deadline: bigint;
  status: CampaignStatus;
  createdAt: bigint;
  milestoneCount: number;
}

export default function CrowdfundingDetailPage() {
  // State setup
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributeAmount, setContributeAmount] = useState("");

  // Load campaign, milestones, contributors
  const loadCampaign = async () => {
    // Similar pattern to LFG/Grant pages
    // Load campaign info
    // Load milestones
    // Load contributors
  };

  // Handler functions
  const handleContribute = async () => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CROWDFUNDING_ABI,
      functionName: "contribute",
      args: [BigInt(campaignId)],
      value: parseETH(contributeAmount),
    });
  };

  const handleReleaseMilestone = async (milestoneId: number) => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CROWDFUNDING_ABI,
      functionName: "releaseMilestone",
      args: [BigInt(campaignId), BigInt(milestoneId)],
    });
  };

  const handleWithdrawMilestone = async (milestoneId: number) => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CROWDFUNDING_ABI,
      functionName: "withdrawMilestone",
      args: [BigInt(campaignId), BigInt(milestoneId)],
    });
  };

  const handleRefund = async () => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CROWDFUNDING_ABI,
      functionName: "claimRefund",
      args: [BigInt(campaignId)],
    });
  };

  // Render UI similar to LFG/Grant pages
  // Include milestone cards with release/withdraw buttons
}
```

**Milestone Display Logic:**
```typescript
{milestones.map((milestone, idx) => (
  <Card key={idx}>
    <CardContent className="py-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge>{`Milestone ${idx + 1}`}</Badge>
            <Badge variant={
              milestone.status === MilestoneStatus.WITHDRAWN ? "default" :
              milestone.status === MilestoneStatus.RELEASED ? "secondary" :
              "outline"
            }>
              {milestone.status === MilestoneStatus.PENDING ? "Pending" :
               milestone.status === MilestoneStatus.RELEASED ? "Released" :
               "Withdrawn"}
            </Badge>
          </div>
          <p className="text-sm">{milestone.description}</p>
          <p className="text-xs text-muted-foreground">
            Amount: {formatETH(milestone.amount)} ETH
          </p>
        </div>

        {isCreator && campaign.status === CampaignStatus.SUCCESSFUL && (
          <div className="flex gap-2">
            {/* Show Release button if:
                - Milestone is PENDING
                - Previous milestone is not PENDING (sequential)
            */}
            {milestone.status === MilestoneStatus.PENDING &&
             (idx === 0 || milestones[idx - 1].status !== MilestoneStatus.PENDING) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReleaseMilestone(idx)}
              >
                Release
              </Button>
            )}

            {/* Show Withdraw button if milestone is RELEASED */}
            {milestone.status === MilestoneStatus.RELEASED && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleWithdrawMilestone(idx)}
              >
                Withdraw {formatETH(milestone.amount)} ETH
              </Button>
            )}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
))}
```

---

### 2. Quick View Modals - BountyCard

**File:** `src/components/BountyCard.tsx`

**Implementation:**

```typescript
// Add to existing BountyCard component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Eye } from "lucide-react";

// Add state
const [quickView, setQuickView] = useState(false);

// Add button to card actions
<div className="flex gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setQuickView(true)}
  >
    <Eye className="h-4 w-4 mr-1" />
    Quick View
  </Button>
  <Button
    variant="default"
    size="sm"
    onClick={() => router.push(`/bounties/${bounty.id}`)}
  >
    View Details
  </Button>
</div>

// Add Dialog at end of component
<Dialog open={quickView} onOpenChange={setQuickView}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{metadata?.title || bounty.description.split("\n")[0]}</DialogTitle>
      <DialogDescription>
        Bounty #{bounty.id} • {formatETH(bounty.amount)} ETH
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted rounded p-2">
          <p className="text-xs text-muted-foreground">Reward</p>
          <p className="font-bold">{formatETH(bounty.amount)} ETH</p>
        </div>
        <div className="bg-muted rounded p-2">
          <p className="text-xs text-muted-foreground">Submissions</p>
          <p className="font-bold">{bounty.submissions.length}</p>
        </div>
        <div className="bg-muted rounded p-2">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-bold">{BountyStatusEnum[bounty.status]}</p>
        </div>
      </div>

      {/* Description */}
      {metadata?.description && (
        <div>
          <h4 className="font-semibold text-sm mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">{metadata.description}</p>
        </div>
      )}

      {/* Requirements */}
      {metadata?.requirements && (
        <div>
          <h4 className="font-semibold text-sm mb-1">Requirements</h4>
          <ul className="list-disc list-inside space-y-0.5">
            {metadata.requirements.map((req, i) => (
              <li key={i} className="text-sm text-muted-foreground">{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setQuickView(false)}
        >
          Close
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            setQuickView(false);
            router.push(`/bounties/${bounty.id}`);
          }}
        >
          View Full Details
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

### 3. Quick View Modals - AirdropCard

**File:** `src/components/AirdropCard.tsx`

**Same pattern as BountyCard:**

```typescript
// Add state
const [quickView, setQuickView] = useState(false);

// Add button
<Button variant="ghost" size="sm" onClick={() => setQuickView(true)}>
  <Eye className="h-4 w-4 mr-1" />
  Quick View
</Button>

// Add Dialog with airdrop-specific fields
<Dialog open={quickView} onOpenChange={setQuickView}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{airdrop.title}</DialogTitle>
      <DialogDescription>
        Airdrop #{airdrop.id} • {formatETH(airdrop.perQualifier)} ETH per user
      </DialogDescription>
    </DialogHeader>
    {/* Similar structure with airdrop stats */}
  </DialogContent>
</Dialog>
```

---

### 4. Share Buttons for All Cards

**Create Reusable Hook:**

**File:** `src/hooks/useShare.ts`

```typescript
"use client";

import { useAlertDialog } from "./useAlertDialog";

export const useShare = () => {
  const { showAlert } = useAlertDialog();

  const shareLink = (path: string, title?: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);

    showAlert({
      title: "Link Copied!",
      description: title || "Share link copied to clipboard",
      variant: "success",
    });
  };

  return { shareLink };
};
```

**Add to BountyCard:**

```typescript
import { useShare } from "@/hooks/useShare";
import { Share2 } from "lucide-react";

const { shareLink } = useShare();

// Add button
<Button
  variant="ghost"
  size="sm"
  onClick={() => shareLink(`/bounties/${bounty.id}`, "Share this bounty")}
>
  <Share2 className="h-4 w-4" />
</Button>
```

**Add to AirdropCard:**

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => shareLink(`/airdrops/${airdrop.id}`, "Share this airdrop")}
>
  <Share2 className="h-4 w-4" />
</Button>
```

**Add to Funding Cards (in managers):**

**GrantProgramManager.tsx:**
```typescript
// In renderGrantCard function
<Button
  variant="ghost"
  size="sm"
  onClick={() => shareLink(`/funding/grant-program/${grant.id}`, "Share this grant")}
>
  <Share2 className="h-4 w-4" />
</Button>
```

**LookingForGrantManager.tsx:**
```typescript
// In renderRequestCard function
<Button
  variant="ghost"
  size="sm"
  onClick={() => shareLink(`/funding/looking-for-grant/${request.id}`, "Share this project")}
>
  <Share2 className="h-4 w-4" />
</Button>
```

**CrowdfundingManager.tsx:**
```typescript
// In renderCampaignCard function
<Button
  variant="ghost"
  size="sm"
  onClick={() => shareLink(`/funding/crowdfunding/${campaign.id}`, "Share this campaign")}
>
  <Share2 className="h-4 w-4" />
</Button>
```

---

## 🎯 Quick Completion Checklist

### Crowdfunding Page:
- [ ] Copy LFG page as template
- [ ] Update contract imports (CROWDFUNDING_ABI)
- [ ] Add milestone interfaces and state
- [ ] Implement milestone loading logic
- [ ] Add milestone display with sequential logic
- [ ] Add contribute functionality
- [ ] Add release/withdraw buttons
- [ ] Add refund functionality
- [ ] Test all flows

### BountyCard Quick View:
- [ ] Import Dialog components
- [ ] Add quickView state
- [ ] Add "Quick View" button
- [ ] Create Dialog with bounty summary
- [ ] Test modal opening/closing

### AirdropCard Quick View:
- [ ] Same steps as BountyCard
- [ ] Adjust for airdrop-specific fields

### Share Buttons:
- [ ] Create useShare hook
- [ ] Add to BountyCard
- [ ] Add to AirdropCard
- [ ] Add to GrantProgramManager cards
- [ ] Add to LookingForGrantManager cards
- [ ] Add to CrowdfundingManager cards
- [ ] Test copy functionality

---

## 🚀 Estimated Time

- **Crowdfunding Page:** 20-30 min (template-based)
- **BountyCard Quick View:** 10 min
- **AirdropCard Quick View:** 10 min
- **Share Hook + All Buttons:** 15-20 min

**Total:** ~1 hour of focused work

---

## 📝 Testing Checklist

Once complete, test:
1. Navigate to `/funding/crowdfunding/1` - should load
2. Navigate to `/funding/grant-program/1` - should load
3. Navigate to `/funding/looking-for-grant/1` - should load
4. Click "Quick View" on bounty/airdrop cards - modal opens
5. Click share buttons - link copies and alert shows
6. All milestone buttons work correctly
7. Sequential milestone release enforced
8. Refund button shows only when applicable

---

**All patterns provided above! Copy, customize contract details, and implement.** 🎉
