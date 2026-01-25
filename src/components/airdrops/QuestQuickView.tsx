import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Coins, Users, Clock } from "lucide-react";
import { formatETH, formatTimeLeft } from "../../utils/web3";
import { IpfsImage } from "../../utils/ipfs";
import { Progress } from "../ui/progress";

interface QuestQuickViewProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    airdrop: any;
    onViewFull: () => void;
}

export function QuestQuickView({ isOpen, onOpenChange, airdrop, onViewFull }: QuestQuickViewProps) {
    const progress = Math.min((airdrop.qualifiersCount / airdrop.maxQualifiers) * 100, 100);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl p-0">
                <div className="relative h-64 w-full bg-slate-100">
                    {airdrop.imageUrl ? (
                        <IpfsImage
                            cid={airdrop.imageUrl.replace("ipfs://", "")}
                            alt={airdrop.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Gift className="w-16 h-16 text-purple-500/40" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-8 right-8">
                        <h2 className="text-2xl font-bold text-white mb-1">{airdrop.title}</h2>
                        <p className="text-white/80 text-sm">Quest #{airdrop.id} • {formatETH(airdrop.perQualifier)} ETH per user</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Reward</p>
                            <p className="text-lg font-black text-purple-600">{formatETH(airdrop.perQualifier)} ETH</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Participants</p>
                            <p className="text-lg font-black text-slate-700">{airdrop.qualifiersCount}/{airdrop.maxQualifiers}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Time Left</p>
                            <p className="text-sm font-bold text-slate-700">{formatTimeLeft(BigInt(airdrop.deadline))}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold mb-1">
                            <span className="text-slate-500">Campaign Progress</span>
                            <span className="text-purple-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-slate-100" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {airdrop.description?.replace(/\n\nImage:.*$/, "") || "No description provided."}
                            </p>
                        </div>

                        {airdrop.requirements && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2">Requirements</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {airdrop.requirements}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white" onClick={onViewFull}>
                            View Full Details
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
