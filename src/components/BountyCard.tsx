"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
  IpfsImage,
} from "../utils/ipfs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Users,
  Trophy,
  Eye,
  Share2,
} from "lucide-react";
import { useShare } from "@/hooks/useShare";

// V2 Interfaces
interface Reply {
  replier: string;
  content: string;
  timestamp: bigint;
}

interface Submission {
  solver: string;
  blindedIpfsCid: string;
  revealIpfsCid: string;
  deposit: bigint;
  replies: readonly Reply[];
  revealed: boolean;
}

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  allowMultipleWinners: boolean;
  winnerShares: readonly bigint[];
  status: number; // Enum: 0:OPEN, 1:PENDING_REVEAL, 2:RESOLVED, 3:DISPUTED, 4:EXPIRED
  slashPercent: bigint;
  submissions: readonly Submission[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
}

interface BountyCardProps {
  bounty: Bounty;
  onSubmitSolution: (bountyId: number, ipfsCid: string) => void;
  onSelectWinners: (
    bountyId: number,
    winners: string[],
    subIds: number[]
  ) => void;
  onTriggerSlash: (bountyId: number) => void;
  onAddReply: (bountyId: number, subId: number, content: string) => void;
  onRevealSolution: (
    bountyId: number,
    subId: number,
    revealCid: string
  ) => void;
  viewMode?: "grid" | "list";
}

const BountyStatusEnum = [
  "Open Rec", // 0: OPREC
  "Open", // 1: OPEN
  "Pending Reveal", // 2: PENDING_REVEAL
  "Resolved", // 3: RESOLVED
  "Disputed", // 4: DISPUTED
  "Expired", // 5: EXPIRED
];

export default function BountyCard({
  bounty,
  onSubmitSolution,
  onSelectWinners,
  onTriggerSlash,
  onAddReply,
  onRevealSolution,
  viewMode = "grid",
}: BountyCardProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [, setIsLoadingMetadata] = useState(false);
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();

  const isCreator = address?.toLowerCase() === bounty.creator.toLowerCase();
  const isExpired = BigInt(Math.floor(Date.now() / 1000)) > bounty.deadline;

  useEffect(() => {
    const loadMetadata = async () => {
      if (!bounty.metadataCid) return;
      setIsLoadingMetadata(true);
      try {
        const meta = await fetchMetadataFromIpfs(bounty.metadataCid);
        setMetadata(meta);
      } catch (error) {
        console.error("Failed to load bounty metadata:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, [bounty.metadataCid]);

  const statusLabel = BountyStatusEnum[bounty.status] || "Unknown";

  // Get status color for badge variant
  const getStatusVariant = (status: number) => {
    switch (status) {
      case 0:
        return "secondary"; // OPREC
      case 1:
        return "default"; // Open
      case 2:
        return "secondary"; // Pending Reveal
      case 3:
        return "outline"; // Resolved
      case 4:
        return "destructive"; // Disputed
      case 5:
        return "secondary"; // Expired
      default:
        return "outline";
    }
  };

  if (viewMode === "list") {
    return (
      <>
      <Card
        className="group relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        onClick={() => router.push(`/bounties/${bounty.id}`)}
      >
        <div className="flex flex-row">
          {/* Image Section */}
          {metadata?.images && metadata.images.length > 0 && (
            <div className="relative w-64 h-40 overflow-hidden bg-muted flex-shrink-0">
              <img
                src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
                alt={metadata.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Quick View and Share buttons overlay */}
              <div className="absolute top-2 left-2 flex gap-1.5">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickView(true);
                  }}
                  className="h-8 w-8 rounded-[0.75rem] bg-white/90 backdrop-blur-xl hover:bg-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 border border-white/60"
                >
                  <Eye className="h-4 w-4 text-[#0EA885]" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    shareLink(`/bounties/${bounty.id}`, "Share this bounty");
                  }}
                  className="h-8 w-8 rounded-[0.75rem] bg-white/90 backdrop-blur-xl hover:bg-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 border border-white/60"
                >
                  <Share2 className="h-4 w-4 text-[#0EA885]" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold leading-tight line-clamp-1">
                    {metadata?.title || bounty.description.split("\n")[0]}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {metadata?.description || "No description available"}
                  </p>
                </div>
                <Badge variant={getStatusVariant(bounty.status)} className="text-xs flex-shrink-0 rounded-full px-3 py-1 border-white/60 bg-white/50 backdrop-blur-sm">
                  {statusLabel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0EA885]/10 to-[#0EA885]/5 border border-[#0EA885]/20">
                    <Trophy className="h-4 w-4 text-[#0EA885]" />
                    <span className="text-lg font-bold text-[#0EA885]">
                      {formatETH(bounty.amount)}
                    </span>
                    <span className="text-xs font-medium text-[#0EA885]">STT</span>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{bounty.submissions.length}</span>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{formatTimeLeft(bounty.deadline)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {bounty.creator.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {formatAddress(bounty.creator)}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Quick View Dialog - same for list view */}
      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{metadata?.title || bounty.description.split("\n")[0]}</DialogTitle>
            <DialogDescription>
              Bounty #{bounty.id} • {formatETH(bounty.amount)} STT
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image */}
            {metadata?.images && metadata.images.length > 0 && (
              <div className="relative w-full flex justify-center">
                <img
                  src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
                  alt={metadata.title}
                  className="max-w-full h-auto max-h-[500px] object-contain rounded-xl shadow-sm"
                />
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">Reward</p>
                <p className="font-bold">{formatETH(bounty.amount)} STT</p>
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
            {metadata?.requirements && metadata.requirements.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Requirements</h4>
                <ul className="list-disc list-inside space-y-0.5">
                  {metadata.requirements.map((req, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Time Left */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatTimeLeft(bounty.deadline)}
              </span>
            </div>

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
      </>
    );
  }

  return (
    <>
    <Card
      className="group relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
      onClick={() => router.push(`/bounties/${bounty.id}`)}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant={getStatusVariant(bounty.status)} className="text-xs rounded-full px-3 py-1 border-white/60 bg-white/80 backdrop-blur-sm shadow-md">
          {statusLabel}
        </Badge>
      </div>

      {/* Image Section */}
      {metadata?.images && metadata.images.length > 0 && (
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          <img
            src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
            alt={metadata.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Quick View and Share buttons overlay */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <Button
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setQuickView(true);
              }}
              className="h-8 w-8 rounded-[0.75rem] bg-white/90 backdrop-blur-xl hover:bg-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 border border-white/60"
            >
              <Eye className="h-4 w-4 text-[#0EA885]" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                shareLink(`/bounties/${bounty.id}`, "Share this bounty");
              }}
              className="h-8 w-8 rounded-[0.75rem] bg-white/90 backdrop-blur-xl hover:bg-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 border border-white/60"
            >
              <Share2 className="h-4 w-4 text-[#0EA885]" />
            </Button>
          </div>
        </div>
      )}

      <CardHeader className="p-3 space-y-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm leading-tight line-clamp-2 font-semibold">
            {metadata?.title || bounty.description.split("\n")[0]}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {metadata?.description || "No description available"}
          </p>
        </div>

        <Separator />

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{bounty.submissions.length}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTimeLeft(bounty.deadline)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* Reward Section */}
        <div className="flex items-center justify-between p-2.5 rounded-[1rem] bg-gradient-to-r from-[#0EA885]/10 to-[#0EA885]/5 border border-[#0EA885]/20 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-[#0EA885]/10">
              <Trophy className="h-4 w-4 text-[#0EA885]" />
            </div>
            <span className="text-base font-bold text-[#0EA885]">
              {formatETH(bounty.amount)}
            </span>
            <span className="text-xs font-medium text-[#0EA885]">STT</span>
          </div>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {bounty.creator.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>

    {/* Quick View Dialog */}
    <Dialog open={quickView} onOpenChange={setQuickView}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{metadata?.title || bounty.description.split("\n")[0]}</DialogTitle>
          <DialogDescription>
            Bounty #{bounty.id} • {formatETH(bounty.amount)} STT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          {metadata?.images && metadata.images.length > 0 && (
            <div className="relative w-full flex justify-center">
              <img
                src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
                alt={metadata.title}
                className="max-w-full h-auto max-h-[500px] object-contain rounded-xl shadow-sm"
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded p-2">
              <p className="text-xs text-muted-foreground">Reward</p>
              <p className="font-bold">{formatETH(bounty.amount)} STT</p>
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
          {metadata?.requirements && metadata.requirements.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Requirements</h4>
              <ul className="list-disc list-inside space-y-0.5">
                {metadata.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Time Left */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatTimeLeft(bounty.deadline)}
            </span>
          </div>

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
    </>
  );
}
