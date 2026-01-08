"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
} from "../utils/ipfs";
import { getMockMetadata } from "../utils/mockBounties";
import {
  getEthPriceInUSD,
  convertEthToUSD,
  formatUSD,
} from "../utils/prices";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Users, Trophy, Eye, Share2, Target } from "lucide-react";
import { useShare } from "@/hooks/useShare";

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
  submissions: readonly any[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
}

interface BountyCardProps {
  bounty: Bounty;
  onSubmitSolution?: (bountyId: number, ipfsCid: string) => void;
  onSelectWinners?: (
    bountyId: number,
    winners: string[],
    subIds: number[]
  ) => void;
  onTriggerSlash?: (bountyId: number) => void;
  onAddReply?: (bountyId: number, subId: number, content: string) => void;
  onRevealSolution?: (
    bountyId: number,
    subId: number,
    revealCid: string
  ) => void;
  viewMode?: "grid" | "list";
}

const BountyStatusEnum = [
  "OPREC",
  "OPEN",
  "REVEAL",
  "RESOLVED",
  "DISPUTED",
  "EXPIRED",
];

export default function BountyCard({
  bounty,
  viewMode = "grid",
}: BountyCardProps) {
  const router = useRouter();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const currencyLabel = isBase ? "ETH" : "MNT";
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();
  const [ethPrice, setEthPrice] = useState<number>(0);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!bounty.metadataCid) return;

      // First, try to get mock metadata
      const mockMeta = getMockMetadata(bounty.metadataCid);
      if (mockMeta) {
        setMetadata(mockMeta);
        return;
      }

      // If no mock metadata, try to fetch from IPFS
      try {
        const meta = await fetchMetadataFromIpfs(bounty.metadataCid);
        setMetadata(meta);
      } catch (error) {
        console.error("Failed to load bounty metadata:", error);
      }
    };
    loadMetadata();
  }, [bounty.metadataCid]);

  const statusLabel = BountyStatusEnum[bounty.status] || "UNKNOWN";

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "bg-blue-500 text-white";
      case 1: return "bg-green-500 text-white";
      case 2: return "bg-yellow-500 text-black";
      case 3: return "bg-gray-500 text-white";
      case 4: return "bg-red-500 text-white";
      case 5: return "bg-gray-400 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (viewMode === "list") {
    return (
      <>
        <div
          onClick={() => router.push(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`)}
          className="group relative border-2 border-gray-900 bg-white hover:border-blue-500 transition-all cursor-pointer"
        >
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {metadata?.images && metadata.images.length > 0 ? (
                <img
                  src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
                  alt={metadata.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 border-2 border-blue-500 bg-white flex items-center justify-center">
                      <Target className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xs font-mono text-gray-600 uppercase">#{bounty.id}</p>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <div className={`px-3 py-1 ${getStatusColor(bounty.status)} font-mono text-xs uppercase tracking-wider font-bold`}>
                  {statusLabel}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight line-clamp-2">
                  {metadata?.title || bounty.description.split("\n")[0]}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {metadata?.description || ""}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Reward */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-2 border-blue-500">
                    <Trophy className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-lg font-black text-blue-600">
                        {formatETH(bounty.amount)} <span className="text-xs">{currencyLabel}</span>
                      </div>
                      {ethPrice > 0 && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {bounty.submissions.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeLeft(bounty.deadline)}
                    </div>
                  </div>
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-gray-900 bg-gray-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-900">
                      {bounty.creator.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-500">
                    {formatAddress(bounty.creator)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => router.push(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`)}
        className="group relative border-2 border-gray-900 bg-white hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
      >
        {/* Status Badge - Top Right */}
        <div className="absolute top-0 right-0 z-10">
          <div className={`px-4 py-2 ${getStatusColor(bounty.status)} font-mono text-xs uppercase tracking-wider font-bold`}>
            {statusLabel}
          </div>
        </div>

        {/* Image Section */}
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {metadata?.images && metadata.images.length > 0 ? (
            <img
              src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 border-2 border-blue-500 bg-white flex items-center justify-center">
                  <Target className="h-10 w-10 text-blue-500" />
                </div>
                <p className="text-sm font-mono text-gray-600 uppercase font-bold">{bounty.id === 999 ? 'EXAMPLE BOUNTY' : `BOUNTY #${bounty.id}`}</p>
              </div>
            </div>
          )}

          {/* Overlay Buttons */}
          <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickView(true);
              }}
              className="w-8 h-8 bg-white border-2 border-gray-900 hover:bg-blue-500 hover:border-blue-500 transition-all flex items-center justify-center"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                shareLink(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`, "Share this bounty");
              }}
              className="w-8 h-8 bg-white border-2 border-gray-900 hover:bg-blue-500 hover:border-blue-500 transition-all flex items-center justify-center"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight line-clamp-2 leading-tight">
              {metadata?.title || bounty.description.split("\n")[0]}
            </h3>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-mono">
              {metadata?.description || "No description"}
            </p>
          </div>

          {/* Horizontal Line */}
          <div className="h-px bg-gray-900" />

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs font-mono text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{bounty.submissions.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeLeft(bounty.deadline)}</span>
            </div>
          </div>

          {/* Reward Section - Brutalist */}
          <div className="border-2 border-blue-500 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-black text-blue-600">
                    {formatETH(bounty.amount)} <span className="text-xs">{currencyLabel}</span>
                  </div>
                  {ethPrice > 0 && (
                    <div className="text-[10px] text-gray-600 font-mono">
                      {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                    </div>
                  )}
                </div>
              </div>

              {/* Creator Avatar */}
              <div className="w-8 h-8 border-2 border-gray-900 bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">
                  {bounty.creator.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Dialog */}
      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl border-2 border-gray-900 bg-white p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase text-gray-900">
                {metadata?.title || bounty.description.split("\n")[0]}
              </DialogTitle>
              <DialogDescription className="font-mono text-sm">
                {bounty.id === 999 ? 'EXAMPLE' : `BOUNTY #${bounty.id}`} • {formatETH(bounty.amount)} {currencyLabel}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-6">
              {/* Image */}
              {metadata?.images && metadata.images.length > 0 && (
                <div className="border-2 border-gray-900">
                  <img
                    src={metadata.images[0].startsWith('/') ? metadata.images[0] : `https://ipfs.io/ipfs/${metadata.images[0]}`}
                    alt={metadata.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="border-2 border-gray-900 p-3 bg-gray-50">
                  <p className="text-xs font-mono text-gray-600 uppercase">Reward</p>
                  <p className="font-black text-lg">{formatETH(bounty.amount)} {currencyLabel}</p>
                </div>
                <div className="border-2 border-gray-900 p-3">
                  <p className="text-xs font-mono text-gray-600 uppercase">Submissions</p>
                  <p className="font-black text-lg">{bounty.submissions.length}</p>
                </div>
                <div className="border-2 border-gray-900 p-3">
                  <p className="text-xs font-mono text-gray-600 uppercase">Status</p>
                  <p className="font-black text-lg text-blue-600">{statusLabel}</p>
                </div>
              </div>

              {/* Description */}
              {metadata?.description && (
                <div>
                  <h4 className="font-black text-sm mb-2 uppercase">Description</h4>
                  <p className="text-sm text-gray-600">
                    {metadata.description}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {metadata?.requirements && metadata.requirements.length > 0 && (
                <div>
                  <h4 className="font-black text-sm mb-2 uppercase">Requirements</h4>
                  <ul className="space-y-1">
                    {metadata.requirements.map((req, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 font-bold">▸</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-900 hover:bg-gray-100"
                  onClick={() => setQuickView(false)}
                >
                  CLOSE
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-600 font-bold"
                  onClick={() => {
                    setQuickView(false);
                    router.push(`/bounties/${bounty.id === 999 ? 'example' : bounty.id}`);
                  }}
                >
                  VIEW DETAILS
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
