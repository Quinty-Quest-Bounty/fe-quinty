import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { Users, Clock, ArrowUpRight } from "lucide-react";
import { useWalletName } from "@/hooks/useWalletName";
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

interface QuestCardProps {
  quest: Quest;
  entryCount?: number;
  onShowSubmitModal?: () => void;
}

const statusConfig = (quest: Quest, isExpired: boolean) => {
  if (quest.resolved) return { label: "Completed", color: "text-zinc-400", bg: "bg-zinc-400" };
  if (quest.cancelled) return { label: "Cancelled", color: "text-zinc-400", bg: "bg-zinc-300" };
  if (isExpired) return { label: "Expired", color: "text-red-500", bg: "bg-red-500" };
  if (quest.qualifiersCount >= quest.maxQualifiers) return { label: "Full", color: "text-amber-500", bg: "bg-amber-500" };
  return { label: "Active", color: "text-[#0EA885]", bg: "bg-[#0EA885]" };
};

export default function QuestCard({ quest, entryCount = 0 }: QuestCardProps) {
  const router = useRouter();
  const [quickView, setQuickView] = useState(false);
  const creatorName = useWalletName(quest.creator);
  const progress = Math.min((quest.qualifiersCount / quest.maxQualifiers) * 100, 100);
  const isExpired = Date.now() / 1000 > quest.deadline;
  const config = statusConfig(quest, isExpired);
  const participants = entryCount || quest.qualifiersCount;

  return (
    <>
      <div
        className="group relative bg-white border border-zinc-200 hover:border-[#0EA885]/40 transition-all duration-200 cursor-pointer overflow-hidden hover:shadow-md hover:shadow-[#0EA885]/5"
        onClick={() => router.push(`/quests/${quest.id}`)}
      >
        {/* Top accent line — amber for quests */}
        <div className="h-[2px] w-full bg-amber-400" />

        <div className="p-4">
          {/* Row 1: Status + Category + ID */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${config.color}`}>
                <div className={`w-1.5 h-1.5 ${config.bg}`} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{config.label}</span>
              </div>
              {quest.questType && (
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  {quest.questType}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-300 tabular-nums">#{quest.id}</span>
          </div>

          {/* Row 2: Title + optional thumbnail */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#0EA885] transition-colors">
                {quest.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-4 h-4 bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[7px] font-bold text-zinc-400">
                    {(creatorName || quest.creator.slice(2, 4)).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 truncate">
                  {creatorName || formatAddress(quest.creator)}
                </span>
              </div>
            </div>
            {quest.imageUrl && (
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-zinc-50">
                <img src={quest.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-zinc-400">
                {quest.qualifiersCount}<span className="text-zinc-300">/{quest.maxQualifiers}</span> qualified
              </span>
              <span className="text-[10px] font-mono text-zinc-300 tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-[#0EA885] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Row 3: Data strip */}
          <div className="flex items-end justify-between pt-3 border-t border-zinc-100">
            {/* Reward */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-900 tabular-nums tracking-tight">{formatETH(quest.perQualifier)}</span>
                <span className="text-[10px] font-mono font-semibold text-zinc-400">ETH</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-300">per qualifier</span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3">
              {participants > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                  <Users className="w-3 h-3" />
                  <span className="tabular-nums">{participants}</span>
                </div>
              )}
              <div className={`flex items-center gap-1 text-[10px] font-mono ${!quest.resolved && !isExpired ? "text-zinc-400" : "text-zinc-300"}`}>
                <Clock className="w-3 h-3" />
                <span>{quest.resolved ? "Done" : formatTimeLeft(BigInt(quest.deadline))}</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#0EA885] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <QuestQuickView
        isOpen={quickView}
        onOpenChange={setQuickView}
        quest={quest}
        onViewFull={() => router.push(`/quests/${quest.id}`)}
      />
    </>
  );
}
