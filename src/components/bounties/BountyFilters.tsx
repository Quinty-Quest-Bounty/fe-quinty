import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { ChevronDown, Filter } from "lucide-react";

interface BountyFiltersProps {
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    showPastBounties: boolean;
    setShowPastBounties: (value: boolean) => void;
}

export function BountyFilters({
    statusFilter,
    setStatusFilter,
    showPastBounties,
    setShowPastBounties,
}: BountyFiltersProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs border-slate-200 bg-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Active</SelectItem>
                        <SelectItem value="judging">Judging</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="slashed">Slashed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPastBounties(!showPastBounties)}
                className="text-slate-400 hover:text-slate-900 text-xs gap-1 h-8"
            >
                {showPastBounties ? "Hide" : "Show"} Past Bounties
                <ChevronDown className={`w-3 h-3 transition-transform ${showPastBounties ? "rotate-180" : ""}`} />
            </Button>
        </div>
    );
}
