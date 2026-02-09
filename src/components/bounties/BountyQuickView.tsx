import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { formatETH, formatTimeLeft } from "../../utils/web3";
import { BountyMetadata } from "../../utils/ipfs";
import { Bounty } from "../../hooks/useBounties";

interface BountyQuickViewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bounty: Bounty;
  metadata: BountyMetadata | null;
  onViewFull: () => void;
}

export function BountyQuickView({ isOpen, onOpenChange, bounty, metadata, onViewFull }: BountyQuickViewProps) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isJudging = now > bounty.openDeadline && now <= bounty.judgingDeadline;
  const relevantDeadline = isJudging ? bounty.judgingDeadline : bounty.openDeadline;
  const deadlineLabel = isJudging ? "Judging Ends" : "Submissions Close";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl p-0">
        <div className="relative h-64 w-full bg-slate-100">
          {metadata?.images && metadata.images.length > 0 ? (
            <img
              src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0EA885]/20 to-blue-500/20 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-[#0EA885]/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-8 right-8">
            <h2 className="text-2xl font-bold text-white mb-1">{metadata?.title || bounty.title || "Bounty Details"}</h2>
            <p className="text-white/80 text-sm">Bounty #{bounty.id} • {formatETH(bounty.amount)} ETH</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Reward</p>
              <p className="text-lg font-black text-[#0EA885]">{formatETH(bounty.amount)} ETH</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Submissions</p>
              <p className="text-lg font-black text-slate-700">{bounty.submissionCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{deadlineLabel}</p>
              <p className="text-sm font-bold text-slate-700">{formatTimeLeft(relevantDeadline)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Slash %</p>
              <p className="text-lg font-black text-red-500">{Number(bounty.slashPercent) / 100}%</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {metadata?.description || bounty.description || "No description provided."}
              </p>
            </div>

            {metadata?.requirements && metadata.requirements.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Requirements</h4>
                <ul className="grid grid-cols-1 gap-2">
                  {metadata.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0EA885] mt-1.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">
                1% deposit required to submit. Refunded when winner is selected.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button className="flex-1 h-12 rounded-xl bg-[#0EA885] hover:bg-[#0EA885]/90" onClick={onViewFull}>
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
