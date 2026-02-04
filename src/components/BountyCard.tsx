import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata } from "../utils/ipfs";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../utils/prices";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Users, Trophy, Eye, Share2, Target } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import { BountyQuickView } from "./bounties/BountyQuickView";

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
  status: number;
  slashPercent: bigint;
  submissions: readonly Submission[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
}

interface BountyCardProps {
  bounty: Bounty;
  onSubmitSolution: (bountyId: number, ipfsCid: string) => void;
  onSelectWinners: (bountyId: number, winners: string[], subIds: number[]) => void;
  onTriggerSlash: (bountyId: number) => void;
  onAddReply: (bountyId: number, subId: number, content: string) => void;
  onRevealSolution: (bountyId: number, subId: number, revealCid: string) => void;
}

const BountyStatusEnum = ["Open Rec", "Open", "Pending Reveal", "Resolved", "Disputed", "Expired"];

export default function BountyCard({ bounty }: BountyCardProps) {
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

  const statusLabel = BountyStatusEnum[bounty.status] || "Unknown";
  const getStatusVariant = (status: number) => {
    if (status === 1) return "default";
    if (status === 3) return "outline";
    if (status === 4) return "destructive";
    return "secondary";
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white hover:border-[#0EA885]/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
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
              <Target className="w-10 h-10 text-slate-200" />
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge variant={getStatusVariant(bounty.status)} className="rounded-full px-2 py-0 text-[10px] font-bold uppercase">
              {statusLabel}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-5 pb-2">
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#0EA885] transition-colors">
            {metadata?.title || bounty.description.split("\n")[0]}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Users className="w-3 h-3" />
              {bounty.submissions.length} Submissions
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              {formatTimeLeft(bounty.deadline)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-900">{formatETH(bounty.amount)}</span>
                <span className="text-[10px] font-bold text-slate-400">ETH</span>
              </div>
              {ethPrice > 0 && (
                <span className="text-[10px] font-medium text-slate-400">
                  ≈ {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                </span>
              )}
            </div>
            <Avatar className="h-7 w-7 border border-slate-100">
              <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">
                {bounty.creator.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
