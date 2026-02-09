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
import { QuestQuickView } from "./quests/QuestQuickView";

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
  questType?: "development" | "design" | "marketing" | "research" | "other";
}

const getCategoryBadgeColor = (category?: string): string => {
  switch (category) {
    case "development": return "bg-blue-50 text-blue-600 border-blue-200";
    case "design": return "bg-purple-50 text-purple-600 border-purple-200";
    case "marketing": return "bg-orange-50 text-orange-600 border-orange-200";
    case "research": return "bg-emerald-50 text-emerald-600 border-emerald-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

interface QuestCardProps {
  quest: Quest;
  entryCount?: number;
  onShowSubmitModal?: () => void;
}

export default function QuestCard({ quest, entryCount = 0 }: QuestCardProps) {
  const router = useRouter();
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();
  const progress = Math.min((quest.qualifiersCount / quest.maxQualifiers) * 100, 100);
  const isExpired = Date.now() / 1000 > quest.deadline;

  const getStatusColor = () => {
    if (quest.resolved) return "default";
    if (isExpired) return "destructive";
    if (quest.qualifiersCount >= quest.maxQualifiers) return "secondary";
    return "default";
  };

  const getStatusText = () => {
    if (quest.resolved) return "Completed";
    if (isExpired) return "Expired";
    if (quest.qualifiersCount >= quest.maxQualifiers) return "Full";
    return "Active";
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white hover:border-[#0EA885]/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
        onClick={() => router.push(`/quests/${quest.id}`)}
      >
        {/* Image Section */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-50">
          {quest.imageUrl ? (
            <IpfsImage
              cid={quest.imageUrl.replace("ipfs://", "")}
              alt={quest.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="size-10 text-slate-200" />
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <Badge variant={getStatusColor()} className="rounded-full px-2 py-0 text-[10px] font-bold uppercase">
              {getStatusText()}
            </Badge>
            {quest.questType && (
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(quest.questType)}`}>
                {quest.questType}
              </span>
            )}
          </div>
        </div>

        <CardHeader className="p-5 pb-2">
          <h3 className="text-base font-bold text-slate-900 text-balance line-clamp-1 group-hover:text-[#0EA885] transition-colors">
            {quest.title}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
              <Users className="size-3" />
              {entryCount || quest.qualifiersCount} Participants
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
              <Clock className="size-3" />
              {formatTimeLeft(BigInt(quest.deadline))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-300">
              <span>Progress</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-slate-50" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-900 tabular-nums">{formatETH(quest.perQualifier)}</span>
                <span className="text-[10px] font-bold text-slate-400">ETH</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Per User</span>
            </div>
            <Avatar className="size-7 border border-slate-100">
              <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">
                {quest.creator.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      <QuestQuickView
        isOpen={quickView}
        onOpenChange={setQuickView}
        quest={quest}
        onViewFull={() => router.push(`/quests/${quest.id}`)}
      />
    </>
  );
}
