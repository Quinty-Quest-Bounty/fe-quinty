import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { IpfsImage } from "../utils/ipfs";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Users, Clock, Coins, Eye, Share2, Gift } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import { QuestQuickView } from "./airdrops/QuestQuickView";

interface Quest {
  id: number;
  creator: string;
  title: string;
  description: string;
  totalAmount: bigint;
  perQualifier: bigint;
  maxQualifiers: number;
  qualifiersCount: number;
  deadline: number;
  resolved: boolean;
  cancelled: boolean;
  requirements: string;
  imageUrl?: string;
}

interface QuestCardProps {
  airdrop: Quest;
  entryCount?: number;
  onShowSubmitModal?: () => void;
}

export default function QuestCard({ airdrop, entryCount = 0 }: QuestCardProps) {
  const router = useRouter();
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();
  const progress = Math.min((airdrop.qualifiersCount / airdrop.maxQualifiers) * 100, 100);
  const isExpired = Date.now() / 1000 > airdrop.deadline;

  const getStatusColor = () => {
    if (airdrop.resolved) return "default";
    if (isExpired) return "destructive";
    if (airdrop.qualifiersCount >= airdrop.maxQualifiers) return "secondary";
    return "default";
  };

  const getStatusText = () => {
    if (airdrop.resolved) return "Completed";
    if (isExpired) return "Expired";
    if (airdrop.qualifiersCount >= airdrop.maxQualifiers) return "Full";
    return "Active";
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white hover:border-[#0EA885]/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
        onClick={() => router.push(`/airdrops/${airdrop.id}`)}
      >
        {/* Image Section */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-50">
          {airdrop.imageUrl ? (
            <IpfsImage
              cid={airdrop.imageUrl.replace("ipfs://", "")}
              alt={airdrop.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="w-10 h-10 text-slate-200" />
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge variant={getStatusColor()} className="rounded-full px-2 py-0 text-[10px] font-bold uppercase">
              {getStatusText()}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-5 pb-2">
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#0EA885] transition-colors">
            {airdrop.title}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Users className="w-3 h-3" />
              {entryCount || airdrop.qualifiersCount} Participants
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              {formatTimeLeft(BigInt(airdrop.deadline))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-300">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-slate-50" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-900">{formatETH(airdrop.perQualifier)}</span>
                <span className="text-[10px] font-bold text-slate-400">ETH</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Per User</span>
            </div>
            <Avatar className="h-7 w-7 border border-slate-100">
              <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">
                {airdrop.creator.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      <QuestQuickView
        isOpen={quickView}
        onOpenChange={setQuickView}
        airdrop={airdrop}
        onViewFull={() => router.push(`/airdrops/${airdrop.id}`)}
      />
    </>
  );
}
