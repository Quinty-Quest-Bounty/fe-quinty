import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata } from "../utils/ipfs";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../utils/prices";
import { BountyStatus } from "../utils/contracts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Users, Trophy, Eye, Share2, Target, AlertTriangle, Gavel } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import { useWalletName } from "@/hooks/useWalletName";
import { BountyQuickView } from "./bounties/BountyQuickView";
import { Bounty } from "../hooks/useBounties";

interface BountyCardProps {
  bounty: Bounty;
  onSubmitToBounty: (bountyId: number, ipfsCid: string, socialHandle: string) => void;
  onSelectWinner: (bountyId: number, submissionId: number) => void;
  onTriggerSlash: (bountyId: number) => void;
  onRefundNoSubmissions: (bountyId: number) => void;
}

// Helper to get current phase based on status and deadlines
function getCurrentPhase(bounty: Bounty): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  if (bounty.status === BountyStatus.RESOLVED) return "RESOLVED";
  if (bounty.status === BountyStatus.SLASHED) return "SLASHED";
  
  // Check actual phase based on time
  if (now <= bounty.openDeadline) return "OPEN";
  if (now <= bounty.judgingDeadline) return "JUDGING";
  
  // Past judging deadline - slash pending
  return "SLASH_PENDING";
}

export default function BountyCard({ bounty, onTriggerSlash }: BountyCardProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();
  const [ethPrice, setEthPrice] = useState<number>(0);

  useEffect(() => {
    getEthPriceInUSD().then(setEthPrice);
    const loadMetadata = async () => {
      if (!bounty.metadataCid) return;
      try {
        const meta = await fetchMetadataFromIpfs(bounty.metadataCid);
        setMetadata(meta);
      } catch (e) {
        console.error(e);
      }
    };
    loadMetadata();
  }, [bounty.metadataCid]);

  const phase = getCurrentPhase(bounty);
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  // Determine which deadline to show
  const relevantDeadline = phase === "OPEN" ? bounty.openDeadline : bounty.judgingDeadline;
  
  const getPhaseLabel = () => {
    switch (phase) {
      case "OPEN": return "Open";
      case "JUDGING": return "Judging";
      case "RESOLVED": return "Resolved";
      case "SLASHED": return "Slashed";
      case "SLASH_PENDING": return "Slash Pending";
      default: return "Unknown";
    }
  };

  const getStatusVariant = () => {
    switch (phase) {
      case "OPEN": return "default";
      case "JUDGING": return "secondary";
      case "RESOLVED": return "outline";
      case "SLASHED": return "destructive";
      case "SLASH_PENDING": return "destructive";
      default: return "secondary";
    }
  };

  const creatorName = useWalletName(bounty.creator);
  const isCreator = address?.toLowerCase() === bounty.creator.toLowerCase();
  const canSlash = phase === "SLASH_PENDING" && bounty.submissionCount > 0;

  return (
    <>
      <Card
        className="group relative overflow-hidden border border-stone-200 bg-white hover:border-[#0EA885]/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
        onClick={() => router.push(`/bounties/${bounty.id}`)}
      >
        {/* Image Section */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-50">
          {metadata?.images?.[0] ? (
            <img
              src={`https://purple-elderly-silverfish-382.mypinata.cloud/ipfs/${metadata.images[0]}`}
              alt={metadata.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Target className="size-10 text-slate-200" />
            </div>
          )}

          <div className="absolute top-3 right-3 flex gap-1">
            <Badge variant={getStatusVariant()} className="px-2 py-0 text-[10px] font-bold uppercase">
              {getPhaseLabel()}
            </Badge>
          </div>

          {/* Slash warning indicator */}
          {canSlash && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 bg-red-500/90 text-white text-[10px] font-bold px-3 py-1.5">
                <AlertTriangle className="size-3" />
                Creator missed deadline - Click to slash
              </div>
            </div>
          )}
        </div>

        <CardHeader className="p-5 pb-2">
          <h3 className="text-base font-bold text-slate-900 text-balance line-clamp-1 group-hover:text-[#0EA885] transition-colors">
            {metadata?.title || bounty.title || bounty.description.split("\n")[0]}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
              <Users className="size-3" />
              {bounty.submissionCount} Submissions
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
              {phase === "JUDGING" ? (
                <Gavel className="size-3" />
              ) : (
                <Clock className="size-3" />
              )}
              {phase === "OPEN" && `Submit: ${formatTimeLeft(bounty.openDeadline)}`}
              {phase === "JUDGING" && `Judge: ${formatTimeLeft(bounty.judgingDeadline)}`}
              {phase === "RESOLVED" && "Completed"}
              {phase === "SLASHED" && "Slashed"}
              {phase === "SLASH_PENDING" && "Slash Available"}
            </div>
          </div>
          
          {/* Deposit requirement indicator */}
          {phase === "OPEN" && (
            <div className="mt-2 text-[10px] text-amber-600 font-medium">
              1% deposit required to submit
            </div>
          )}
          
          {/* Slash percent indicator */}
          {(phase === "JUDGING" || phase === "SLASH_PENDING") && (
            <div className="mt-2 text-[10px] text-slate-500 font-medium">
              Slash penalty: {Number(bounty.slashPercent) / 100}%
            </div>
          )}
        </CardHeader>

        <CardContent className="p-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-900 tabular-nums">{formatETH(bounty.amount)}</span>
                <span className="text-[10px] font-bold text-slate-400">ETH</span>
              </div>
              {ethPrice > 0 && (
                <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                  ≈ {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 truncate max-w-[100px]">
                {creatorName || formatAddress(bounty.creator)}
              </span>
              <Avatar className="size-7 border border-slate-100">
                <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">
                  {(creatorName || bounty.creator.slice(2, 4)).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>

      <BountyQuickView
        isOpen={quickView}
        onOpenChange={setQuickView}
        bounty={bounty}
        metadata={metadata}
        onViewFull={() => router.push(`/bounties/${bounty.id}`)}
      />
    </>
  );
}
