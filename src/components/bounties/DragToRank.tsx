"use client";

import React, { useState } from "react";
import { formatTokenAmount } from "../../utils/contracts";
import { WalletName } from "../WalletName";
import { Button } from "../ui/button";
import { Trophy, X, GripVertical } from "lucide-react";

interface Submission {
    submitter: string;
    ipfsCid: string;
    deposit: bigint;
    timestamp: bigint;
}

interface DragToRankProps {
    submissions: Submission[];
    prizes: bigint[];
    token: string;
    onSelectWinners: (submissionIds: number[]) => void;
    disabled?: boolean;
}

const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const RANK_COLORS = [
    "border-amber-300 bg-amber-50",
    "border-slate-300 bg-slate-50",
    "border-orange-300 bg-orange-50",
    "border-stone-200 bg-stone-50",
    "border-stone-200 bg-stone-50",
    "border-stone-200 bg-stone-50",
    "border-stone-200 bg-stone-50",
    "border-stone-200 bg-stone-50",
    "border-stone-200 bg-stone-50",
    "border-stone-200 bg-stone-50",
];

export function DragToRank({ submissions, prizes, token, onSelectWinners, disabled }: DragToRankProps) {
    // ranked[slotIndex] = submissionIndex or null
    const [ranked, setRanked] = useState<(number | null)[]>(
        Array(prizes.length).fill(null)
    );
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const assignedIndices = new Set(ranked.filter((r): r is number => r !== null));
    const unrankedSubmissions = submissions
        .map((_, idx) => idx)
        .filter((idx) => !assignedIndices.has(idx));

    const handleDragStart = (submissionIndex: number) => {
        setDraggedIndex(submissionIndex);
    };

    const handleDrop = (slotIndex: number) => {
        if (draggedIndex === null) return;
        const newRanked = [...ranked];
        // Remove from current slot if already ranked
        const existingSlot = newRanked.indexOf(draggedIndex);
        if (existingSlot !== -1) {
            newRanked[existingSlot] = null;
        }
        // If slot already has someone, swap them
        if (newRanked[slotIndex] !== null) {
            if (existingSlot !== -1) {
                newRanked[existingSlot] = newRanked[slotIndex];
            }
        }
        newRanked[slotIndex] = draggedIndex;
        setRanked(newRanked);
        setDraggedIndex(null);
    };

    const handleClickAssign = (submissionIndex: number) => {
        const firstEmpty = ranked.indexOf(null);
        if (firstEmpty === -1) return;
        const newRanked = [...ranked];
        newRanked[firstEmpty] = submissionIndex;
        setRanked(newRanked);
    };

    const handleRemoveFromSlot = (slotIndex: number) => {
        const newRanked = [...ranked];
        newRanked[slotIndex] = null;
        setRanked(newRanked);
    };

    const filledSlots = ranked.filter((r) => r !== null).length;
    const canSubmit = filledSlots > 0;

    const handleSubmit = () => {
        const winnerIds = ranked.filter((r): r is number => r !== null);
        onSelectWinners(winnerIds);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                Select Winners ({filledSlots}/{prizes.length})
            </h3>

            {/* Prize Slots */}
            <div className="space-y-2">
                {prizes.map((prize, slotIndex) => (
                    <div
                        key={slotIndex}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(slotIndex)}
                        className={`flex items-center gap-3 p-3 border-2 rounded transition-all ${
                            RANK_COLORS[slotIndex] || RANK_COLORS[3]
                        } ${draggedIndex !== null ? "border-dashed" : ""}`}
                    >
                        <div className="flex-shrink-0 w-12 text-center">
                            <span className="text-xs font-bold text-stone-500">{RANK_LABELS[slotIndex]}</span>
                            <p className="text-[10px] text-stone-400">{formatTokenAmount(prize, token)}</p>
                        </div>

                        {ranked[slotIndex] !== null ? (
                            <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="size-4 text-stone-300" />
                                    <span className="text-sm font-medium text-stone-700">
                                        <WalletName address={submissions[ranked[slotIndex]!].submitter} />
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveFromSlot(slotIndex)}
                                    className="size-6 text-stone-400 hover:text-red-500"
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 text-center">
                                <p className="text-xs text-stone-400">
                                    {draggedIndex !== null ? "Drop here" : "Click a submission to assign"}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Unranked Submissions */}
            {unrankedSubmissions.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Available Submissions</p>
                    {unrankedSubmissions.map((idx) => (
                        <div
                            key={idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onClick={() => handleClickAssign(idx)}
                            className="flex items-center gap-2 p-2 border border-stone-200 bg-white cursor-pointer hover:border-[#0EA885] hover:bg-emerald-50/50 transition-all"
                        >
                            <GripVertical className="size-4 text-stone-300 flex-shrink-0" />
                            <span className="text-sm text-stone-700">
                                <WalletName address={submissions[idx].submitter} />
                            </span>
                            <span className="text-xs text-stone-400 ml-auto">#{idx}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Button */}
            <Button
                onClick={handleSubmit}
                disabled={!canSubmit || disabled}
                className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-semibold h-11"
            >
                <Trophy className="size-4 mr-2" />
                {filledSlots === 1 ? "Select Winner" : `Select ${filledSlots} Winners`}
            </Button>

            {filledSlots < prizes.length && filledSlots > 0 && (
                <p className="text-xs text-stone-400 text-center">
                    {prizes.length - filledSlots} unused prize slot(s) will be refunded to creator
                </p>
            )}
        </div>
    );
}
