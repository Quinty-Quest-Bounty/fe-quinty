import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata } from "../utils/ipfs";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../utils/prices";
import { BountyStatus } from "../utils/contracts";
import { Clock, Users, AlertTriangle, Gavel, ArrowUpRight } from "lucide-react";
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

function getCurrentPhase(bounty: Bounty): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (bounty.status === BountyStatus.RESOLVED) return "RESOLVED";
  if (bounty.status === BountyStatus.SLASHED) return "SLASHED";
  if (now <= bounty.openDeadline) return "OPEN";
  if (now <= bounty.judgingDeadline) return "JUDGING";
  return "SLASH_PENDING";
}

const phaseConfig: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "text-[#0EA885]", bg: "bg-[#0EA885]" },
  JUDGING: { label: "Judging", color: "text-amber-500", bg: "bg-amber-500" },
  RESOLVED: { label: "Resolved", color: "text-zinc-400", bg: "bg-zinc-400" },
  SLASHED: { label: "Slashed", color: "text-red-500", bg: "bg-red-500" },
  SLASH_PENDING: { label: "Slash Pending", color: "text-red-500", bg: "bg-red-500" },
};

export default function BountyCard({ bounty, onTriggerSlash }: BountyCardProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [quickView, setQuickView] = useState(false);
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
  const config = phaseConfig[phase] || phaseConfig.OPEN;
  const creatorName = useWalletName(bounty.creator);
  const canSlash = phase === "SLASH_PENDING" && bounty.submissionCount > 0;
  const title = metadata?.title || bounty.title || bounty.description.split("\n")[0];
  const imageUrl = metadata?.images?.[0]
    ? `https://purple-elderly-silverfish-382.mypinata.cloud/ipfs/${metadata.images[0]}`
    : null;

  const deadlineText = (() => {
    if (phase === "OPEN") return formatTimeLeft(bounty.openDeadline);
    if (phase === "JUDGING") return formatTimeLeft(bounty.judgingDeadline);
    if (phase === "RESOLVED") return "Done";
    if (phase === "SLASHED") return "Slashed";
    return "Overdue";
  })();

  return (
    <>
      <div
        className="group relative bg-white border border-zinc-200 hover:border-[#0EA885]/40 transition-all duration-200 cursor-pointer overflow-hidden hover:shadow-md hover:shadow-[#0EA885]/5"
        onClick={() => router.push(`/bounties/${bounty.id}`)}
      >
        {/* Top accent line */}
        <div className={`h-[2px] w-full ${config.bg}`} />

        {/* Slash warning banner */}
        {canSlash && (
          <div className="flex items-center gap-2 bg-red-500 text-white text-[10px] font-bold font-mono uppercase tracking-wider px-4 py-1.5">
            <AlertTriangle className="size-3 flex-shrink-0" />
            <span>Creator missed deadline — Slash available</span>
          </div>
        )}

        <div className="p-4">
          {/* Row 1: Status + Category + ID */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${config.color}`}>
                <div className={`w-1.5 h-1.5 ${config.bg}`} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{config.label}</span>
              </div>
              {metadata?.bountyType && (
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  {metadata.bountyType}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-300 tabular-nums">#{bounty.id}</span>
          </div>

          {/* Row 2: Title + optional thumbnail */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#0EA885] transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-4 h-4 bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[7px] font-bold text-zinc-400">
                    {(creatorName || bounty.creator.slice(2, 4)).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 truncate">
                  {creatorName || formatAddress(bounty.creator)}
                </span>
              </div>
            </div>
            {imageUrl && (
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-zinc-50">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Row 3: Data strip */}
          <div className="flex items-end justify-between pt-3 border-t border-zinc-100">
            {/* Reward */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-900 tabular-nums tracking-tight">{formatETH(bounty.amount)}</span>
                <span className="text-[10px] font-mono font-semibold text-zinc-400">ETH</span>
              </div>
              {ethPrice > 0 && (
                <span className="text-[10px] font-mono text-zinc-300 tabular-nums">
                  {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3">
              {bounty.submissionCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                  <Users className="w-3 h-3" />
                  <span className="tabular-nums">{bounty.submissionCount}</span>
                </div>
              )}
              <div className={`flex items-center gap-1 text-[10px] font-mono ${phase === "OPEN" || phase === "JUDGING" ? "text-zinc-400" : "text-zinc-300"}`}>
                {phase === "JUDGING" ? <Gavel className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>{deadlineText}</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#0EA885] transition-colors" />
            </div>
          </div>

          {/* Deposit hint */}
          {phase === "OPEN" && (
            <div className="mt-2 text-[10px] font-mono text-zinc-300">
              1% deposit to submit
            </div>
          )}
        </div>
      </div>

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
