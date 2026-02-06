"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from "wagmi";
import { formatETH, parseETH, formatAddress } from "../../utils/web3";
import { useHistory } from "../../hooks/useHistory";
import { CONTRACT_ADDRESSES, QUINTY_ABI, AIRDROP_ABI, BASE_SEPOLIA_CHAIN_ID } from "../../utils/contracts";
import { uploadMetadataToIpfs, BountyMetadata } from "../../utils/ipfs";
import { ensureBaseSepoliaNetwork } from "../../utils/network";
import ReputationDisplay from "../../components/ReputationDisplay";
import { BountyForm } from "../../components/bounties/BountyForm";
import { QuestForm } from "../../components/quests/QuestForm";
import { Button } from "../../components/ui/button";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Zap,
    Target,
    History as HistoryIcon,
    ChevronRight,
    Search,
    Award,
    User,
    Plus,
    ChevronDown,
    Copy,
    Check,
    Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ProfileTab = "reputation" | "history" | "create";
type CreateType = "bounty" | "quest" | null;

export default function ProfilePage() {
    const router = useRouter();
    const { address } = useAccount();
    const chainId = useChainId();
    const { data: balanceData } = useBalance({
        address: address,
    });
    const { transactions, isLoading } = useHistory();
    const { writeContract, data: bountyHash, isPending: isBountyPending } = useWriteContract();
    const { writeContractAsync } = useWriteContract();
    const { isLoading: isBountyConfirming, isSuccess: isBountyConfirmed } = useWaitForTransactionReceipt({ hash: bountyHash });
    const [activeTab, setActiveTab] = useState<ProfileTab>("reputation");
    const [historyFilter, setHistoryFilter] = useState<string>("all");
    const [createType, setCreateType] = useState<CreateType>(null);
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    const filteredTransactions = useMemo(() => {
        if (historyFilter === "all") return transactions;
        if (historyFilter === "bounties") return transactions.filter(tx => tx.contractType === "Quinty");
        if (historyFilter === "quests") return transactions.filter(tx => tx.contractType === "Quest");
        return transactions;
    }, [transactions, historyFilter]);

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

    // Bounty creation handler
    const handleCreateBounty = async (formData: any) => {
        try {
            if (!address) {
                alert("Please connect your wallet first");
                return;
            }

            const missingFields = [];
            if (!formData.title) missingFields.push("Title");
            if (!formData.description) missingFields.push("Description");
            if (!formData.amount) missingFields.push("Amount");
            if (!formData.openDeadline) missingFields.push("Submission Deadline");
            if (!formData.judgingDeadline) missingFields.push("Judging Deadline");

            if (missingFields.length > 0) {
                alert(`Please fill in: ${missingFields.join(", ")}`);
                return;
            }

            const openDeadlineTs = Math.floor(new Date(formData.openDeadline).getTime() / 1000);
            const judgingDeadlineTs = Math.floor(new Date(formData.judgingDeadline).getTime() / 1000);

            const metadata: BountyMetadata = {
                title: formData.title,
                description: formData.description,
                requirements: formData.requirements.filter((r: string) => r.trim()),
                deliverables: formData.deliverables.filter((d: string) => d.trim()),
                skills: formData.skills.filter((s: string) => s.trim()),
                images: formData.images || [],
                deadline: judgingDeadlineTs,
                bountyType: formData.bountyType,
            };

            const metadataCid = await uploadMetadataToIpfs(metadata);

            writeContract({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                abi: QUINTY_ABI,
                functionName: "createBounty",
                args: [
                    formData.title,
                    `${formData.description}\n\nMetadata: ipfs://${metadataCid}`,
                    BigInt(openDeadlineTs),
                    BigInt(judgingDeadlineTs),
                    BigInt(formData.slashPercent),
                ],
                value: parseETH(formData.amount),
            });
        } catch (e: any) {
            console.error("Error creating bounty:", e);
            alert(`Error creating bounty: ${e.message || e}`);
        }
    };

    // Quest creation handler
    const handleCreateQuest = async (formData: any) => {
        if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
            const networkOk = await ensureBaseSepoliaNetwork();
            if (!networkOk) return;
        }

        if (!address) {
            alert("Please connect your wallet first");
            return;
        }

        try {
            const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);
            const perQualifierWei = parseETH(formData.perQualifier);
            const totalAmount = perQualifierWei * BigInt(formData.maxQualifiers);

            await writeContractAsync({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                abi: AIRDROP_ABI,
                functionName: "createAirdrop",
                args: [
                    formData.title,
                    formData.description,
                    perQualifierWei,
                    BigInt(formData.maxQualifiers),
                    BigInt(deadlineTimestamp),
                    formData.requirements,
                ],
                value: totalAmount,
            });

            // Reset after success
            setTimeout(() => {
                setCreateType(null);
                setShowCreateOptions(false);
                setActiveTab("reputation");
            }, 2000);
        } catch (error: any) {
            console.error("Error creating quest:", error);
            alert(`Error creating quest: ${error.message || error}`);
        }
    };

    // Handle transaction confirmation
    useEffect(() => {
        if (isBountyConfirmed) {
            setCreateType(null);
            setShowCreateOptions(false);
            setActiveTab("reputation");
        }
    }, [isBountyConfirmed]);

    // Copy address handler
    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    if (!address) {
        return (
            <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Connect Wallet</h2>
                <p className="text-slate-500 text-sm font-medium">Please connect your wallet to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">
            {/* Header Section */}
            <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Profile</h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">Your reputation and activity history</p>
            </div>

            {/* Wallet Info Card */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-white border-2 border-slate-200 p-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Address */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="w-4 h-4 text-[#0EA885]" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Wallet Address</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-slate-900">{formatAddress(address || "")}</span>
                                <button
                                    onClick={copyAddress}
                                    className="p-1.5 hover:bg-slate-100 transition-colors border border-slate-200"
                                    title="Copy address"
                                >
                                    {copiedAddress ? (
                                        <Check className="w-3.5 h-3.5 text-[#0EA885]" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right: Balance */}
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance</span>
                            </div>
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-2xl font-black text-slate-900 tabular-nums">
                                    {balanceData ? formatETH(balanceData.value) : "0.00"}
                                </span>
                                <span className="text-xs font-bold text-slate-400">ETH</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-1">
                                {balanceData?.symbol || "ETH"} · Base Sepolia
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 sm:mb-10">
                <div className="inline-flex gap-1 p-1 bg-slate-100 border border-slate-200">
                    <button
                        onClick={() => setActiveTab("reputation")}
                        className={`px-4 sm:px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === "reputation"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <Award className="w-4 h-4 inline-block mr-2" />
                        Reputation
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 sm:px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === "history"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <HistoryIcon className="w-4 h-4 inline-block mr-2" />
                        History
                    </button>
                </div>

                {/* Create Button - Less Prominent */}
                <button
                    onClick={() => {
                        setActiveTab("create");
                        setShowCreateOptions(false);
                        setCreateType(null);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-all border ${
                        activeTab === "create"
                            ? "bg-slate-700 text-white border-slate-700"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                    <Plus className="w-3 h-3 inline-block mr-1" />
                    Create
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === "reputation" ? (
                    <motion.div
                        key="reputation"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ReputationDisplay />
                    </motion.div>
                ) : activeTab === "create" ? (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-2xl mx-auto"
                    >
                        {!createType ? (
                            <div className="space-y-4">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900 mb-2">What do you want to create?</h3>
                                    <p className="text-xs text-slate-500">Choose between creating a bounty or a quest</p>
                                </div>

                                <button
                                    onClick={() => setCreateType("bounty")}
                                    className="w-full p-6 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <Target className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-blue-600">Create Bounty</h4>
                                            <p className="text-xs text-slate-600">Post a task with escrow payment for solvers to complete</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setCreateType("quest")}
                                    className="w-full p-6 bg-white border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-amber-500 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-amber-600">Create Quest</h4>
                                            <p className="text-xs text-slate-600">Launch a campaign with rewards for multiple participants</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ) : createType === "bounty" ? (
                            <div>
                                <button
                                    onClick={() => setCreateType(null)}
                                    className="mb-4 text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                                >
                                    ← Back to options
                                </button>
                                <BountyForm
                                    onSubmit={handleCreateBounty}
                                    isPending={isBountyPending || isBountyConfirming}
                                />
                            </div>
                        ) : (
                            <div>
                                <button
                                    onClick={() => setCreateType(null)}
                                    className="mb-4 text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                                >
                                    ← Back to options
                                </button>
                                <QuestForm
                                    onSubmit={handleCreateQuest}
                                    isPending={false}
                                />
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* History Filter Tabs */}
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex gap-1 p-1 bg-slate-100 border border-slate-200">
                                {[
                                    { id: "all", label: "All Activity" },
                                    { id: "bounties", label: "Bounties" },
                                    { id: "quests", label: "Quests" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setHistoryFilter(tab.id)}
                                        className={`px-4 sm:px-6 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                                            historyFilter === tab.id
                                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-3">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-20 bg-slate-50 animate-pulse border border-slate-100" />
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
                                            className="group cursor-pointer bg-white border border-slate-100 p-4 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-4"
                                        >
                                            <div className={`w-10 h-10 flex items-center justify-center border ${getStatusColor(tx.type)}`}>
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
                                                <div className="p-1 bg-slate-50 text-slate-300 group-hover:text-[#0EA885] group-hover:bg-[#0EA885]/5 transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="py-20 text-center bg-white border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No activity found</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Try changing your filters or start interacting with the protocol.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
