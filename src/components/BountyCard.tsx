"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatSTT, formatTimeLeft, formatAddress } from "../utils/web3";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
  IpfsImage,
} from "../utils/ipfs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Clock,
  Users,
  Trophy,
} from "lucide-react";

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
  "Open",
  "Pending Reveal",
  "Resolved",
  "Disputed",
  "Expired",
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
        return "default"; // Open
      case 1:
        return "secondary"; // Pending Reveal
      case 2:
        return "outline"; // Resolved
      case 3:
        return "destructive"; // Disputed
      case 4:
        return "secondary"; // Expired
      default:
        return "outline";
    }
  };

  if (viewMode === "list") {
    return (
      <Card
        className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
        onClick={() => router.push(`/bounties/${bounty.id}`)}
      >
        <div className="flex flex-row">
          {/* Image Section */}
          {metadata?.images && metadata.images.length > 0 && (
            <div className="relative w-48 h-32 overflow-hidden bg-muted flex-shrink-0">
              <img
                src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
                alt={metadata.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
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
                <Badge variant={getStatusVariant(bounty.status)} className="text-xs flex-shrink-0">
                  {statusLabel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  <span className="text-lg font-bold text-primary">
                    {formatSTT(bounty.amount)}
                  </span>
                  <span className="text-xs font-medium text-primary">STT</span>
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
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
      onClick={() => router.push(`/bounties/${bounty.id}`)}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant={getStatusVariant(bounty.status)} className="text-xs">
          {statusLabel}
        </Badge>
      </div>

      {/* Image Section */}
      {metadata?.images && metadata.images.length > 0 && (
        <div className="relative w-full h-32 overflow-hidden bg-muted">
          <img
            src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
            alt={metadata.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
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
        <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <span className="text-base font-bold text-primary">
              {formatSTT(bounty.amount)}
            </span>
            <span className="text-xs font-medium text-primary">STT</span>
          </div>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {bounty.creator.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  );
}
