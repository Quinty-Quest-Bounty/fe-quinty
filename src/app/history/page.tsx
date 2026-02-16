"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatETH } from "../../utils/web3";
import { useHistory } from "../../hooks/useHistory";
import { Button } from "../../components/ui/button";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Zap,
    Target,
    History as HistoryIcon,
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
    const router = useRouter();
    const { address } = useAccount();
    const { transactions, isLoading } = useHistory();
    const [filter, setFilter] = useState<string>("all");

    const filteredTransactions = useMemo(() => {
        if (filter === "all") return transactions;
        if (filter === "bounties") return transactions.filter(tx => tx.contractType === "Quinty");
        if (filter === "quests") return transactions.filter(tx => tx.contractType === "Quest");
        return transactions;
    }, [transactions, filter]);

    const getIcon = (type: string) => {
        if (type.includes("bounty")) return <Target className="w-4 h-4 text-blue-500" />;
        if (type.includes("quest")) return <Zap className="w-4 h-4 text-amber-500" />;
        return <HistoryIcon className="w-4 h-4 text-slate-400" />;
    };

    const getStatusColor = (type: string) => {
        if (type.includes("create")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
        if (type.includes("submit") || type.includes("join")) return "bg-blue-50 text-blue-600 border-blue-100";
        if (type.includes("win") || type.includes("resolve")) return "bg-purple-50 text-purple-600 border-purple-100";
        return "bg-slate-50 text-slate-600 border-slate-100";
    };

    if (!address) {
        return (
            <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
                <div className="w-16 h-16 bg-slate-50  flex items-center justify-center mx-auto mb-6">
                    <HistoryIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Connect Wallet</h2>
                <p className="text-slate-500 text-sm font-medium">Please connect your wallet to view your activity history.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-20 pb-12">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activity History</h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">Tracking your interactions with the protocol</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex justify-center mb-10">
                <div className="inline-flex p-1  bg-slate-100 border border-slate-200">
                    {[
                        { id: "all", label: "All Activity" },
                        { id: "bounties", label: "Bounties" },
                        { id: "quests", label: "Quests" },
                    ].map((tab) => (
                        <Button
                            key={tab.id}
                            variant={filter === tab.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setFilter(tab.id)}
                            className={` transition-all px-6 font-bold text-xs ${filter === tab.id
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 bg-slate-50  animate-pulse border border-slate-100" />
                    ))
                ) : filteredTransactions.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        {filteredTransactions.map((tx, idx) => (
                            <motion.div
                                key={tx.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => router.push(tx.contractType === "Quinty" ? `/bounties/${tx.itemId}` : `/quests/${tx.itemId}`)}
                                className="group cursor-pointer bg-white border border-slate-100  p-4 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-4"
                            >
                                <div className={`w-10 h-10  flex items-center justify-center border ${getStatusColor(tx.type)}`}>
                                    {getIcon(tx.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                                            {tx.type.replace("_", " ")}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {new Date(Number(tx.timestamp) * 1000).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0EA885] transition-colors">
                                        {tx.description}
                                    </p>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1">
                                    {tx.amount ? (
                                        <div className="text-sm font-black text-slate-900">
                                            {formatETH(tx.amount)} <span className="text-[10px] font-bold text-slate-400">ETH</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs font-bold text-slate-300">—</div>
                                    )}
                                    <div className="p-1  bg-slate-50 text-slate-300 group-hover:text-[#0EA885] group-hover:bg-[#0EA885]/5 transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="py-20 text-center bg-white border border-slate-200">
                        <div className="w-12 h-12 bg-slate-50  flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No activity found</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">Try changing your filters or start interacting with the protocol.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
