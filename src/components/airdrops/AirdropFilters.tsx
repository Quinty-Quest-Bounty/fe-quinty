import React from "react";
import { Button } from "../ui/button";
import { ChevronDown, Search } from "lucide-react";

interface AirdropFiltersProps {
    showPastQuests: boolean;
    setShowPastQuests: (value: boolean) => void;
}

export function AirdropFilters({
    showPastQuests,
    setShowPastQuests,
}: AirdropFiltersProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Quests</span>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPastQuests(!showPastQuests)}
                className="text-slate-400 hover:text-slate-900 text-xs gap-1 h-8"
            >
                {showPastQuests ? "Hide" : "Show"} Past Quests
                <ChevronDown className={`w-3 h-3 transition-transform ${showPastQuests ? "rotate-180" : ""}`} />
            </Button>
        </div>
    );
}
