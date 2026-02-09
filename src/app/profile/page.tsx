"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from "wagmi";
import { formatETH, parseETH, formatAddress } from "../../utils/web3";
import { useHistory } from "../../hooks/useHistory";
import { useBounties } from "../../hooks/useBounties";
import { useQuests } from "../../hooks/useQuests";
import { CONTRACT_ADDRESSES, QUINTY_ABI, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID } from "../../utils/contracts";
import { uploadMetadataToIpfs, BountyMetadata } from "../../utils/ipfs";
import { ensureBaseSepoliaNetwork } from "../../utils/network";
import ReputationDisplay from "../../components/ReputationDisplay";
import BountyCard from "../../components/BountyCard";
import QuestCard from "../../components/QuestCard";
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
    Settings,
    Pencil,
    Loader2,
    X as XIcon,
    CheckCircle,
    Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Input } from "../../components/ui/input";
import { useSocialVerification } from "../../hooks/useSocialVerification";
import { Badge } from "../../components/ui/badge";

type ProfileTab = "overview" | "reputation" | "history" | "create";
type CreateType = "bounty" | "quest" | null;

export default function ProfilePage() {
    const router = useRouter();
    const { address, isConnecting, isReconnecting } = useAccount();
    const chainId = useChainId();
    const [mounted, setMounted] = useState(false);
    const { data: balanceData } = useBalance({
        address: address,
    });
    const { transactions, isLoading } = useHistory();
    const { bounties, isLoading: isBountiesLoading } = useBounties();
    const { quests, entryCounts, isLoading: isQuestsLoading } = useQuests();
    const { writeContract, data: bountyHash, isPending: isBountyPending } = useWriteContract();
    const { writeContractAsync } = useWriteContract();
    const { isLoading: isBountyConfirming, isSuccess: isBountyConfirmed } = useWaitForTransactionReceipt({ hash: bountyHash });
    const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
    const [historyFilter, setHistoryFilter] = useState<string>("all");
    const [createType, setCreateType] = useState<CreateType>(null);
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    
    // Username editing
    const { profile, updateUsername } = useAuth();
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

    // X account linking
    const { xAccount, connectX, disconnectX, isConnecting: isConnectingX, isConnected: isXConnected } = useSocialVerification();

    // Handle hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter bounties and quests created by the user
    const myBounties = useMemo(() => {
        if (!address) return [];
        return bounties.filter(b => b.creator.toLowerCase() === address.toLowerCase());
    }, [bounties, address]);

    const myQuests = useMemo(() => {
        if (!address) return [];
        return quests.filter(q => q.creator.toLowerCase() === address.toLowerCase());
    }, [quests, address]);

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

            // Append image URL to description if provided
            let description = formData.description;
            if (formData.imageUrl) {
                description = `${formData.description}\n\nImage: ${formData.imageUrl}`;
            }

            await writeContractAsync({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                abi: QUEST_ABI,
                functionName: "createQuest",
                args: [
                    formData.title,
                    description,
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

    // Show loading state during hydration or wallet connection
    if (!mounted || isConnecting || isReconnecting) {
        return (
            <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <User className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Loading...</h2>
                <p className="text-slate-500 text-sm font-medium">Please wait while we check your wallet connection.</p>
            </div>
        );
    }

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
        <div key={address || 'disconnected'} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">
            {/* Header Section */}
            <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Profile</h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">Your reputation and activity history</p>
            </div>

            {/* Wallet Info Card */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-white border-2 border-slate-200 p-6">
                    {/* Username Section */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-[#0EA885]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Display Name</span>
                        </div>
                        {isEditingUsername ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="max-w-xs text-sm font-bold"
                                    autoFocus
                                />
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        if (!newUsername.trim()) return;
                                        setIsUpdatingUsername(true);
                                        const success = await updateUsername(newUsername.trim());
                                        setIsUpdatingUsername(false);
                                        if (success) {
                                            setIsEditingUsername(false);
                                        }
                                    }}
                                    disabled={isUpdatingUsername || !newUsername.trim()}
                                    className="bg-[#0EA885] hover:bg-[#0c9676]"
                                >
                                    {isUpdatingUsername ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditingUsername(false);
                                        setNewUsername(profile?.username || "");
                                    }}
                                    disabled={isUpdatingUsername}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-slate-900">
                                    {profile?.username || formatAddress(address || "")}
                                </span>
                                <button
                                    onClick={() => {
                                        setNewUsername(profile?.username || "");
                                        setIsEditingUsername(true);
                                    }}
                                    className="p-1.5 hover:bg-slate-100 transition-colors border border-slate-200"
                                    title="Edit username"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* X Account Section */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <XIcon className="w-4 h-4 text-slate-900" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">X Account</span>
                            {isXConnected && (
                                <Badge className="bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20 text-[10px] font-bold">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>
                        {isXConnected && xAccount ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black flex items-center justify-center">
                                        <XIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-lg font-black text-slate-900">{xAccount.username}</span>
                                        <p className="text-xs text-slate-500">Connected & verified via OAuth</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={disconnectX}
                                    className="text-xs border-slate-200"
                                >
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Connect your X account to create bounties and quests
                                </p>
                                <Button
                                    size="sm"
                                    onClick={connectX}
                                    disabled={isConnectingX}
                                    className="bg-black hover:bg-slate-800 text-white"
                                >
                                    {isConnectingX ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="w-4 h-4 mr-2" />
                                            Connect X
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

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
                <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-100 border border-slate-200">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === "overview"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <User className="w-4 h-4 inline-block mr-1.5" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("reputation")}
                        className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === "reputation"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <Award className="w-4 h-4 inline-block mr-1.5" />
                        Reputation
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === "history"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        <HistoryIcon className="w-4 h-4 inline-block mr-1.5" />
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
                {activeTab === "overview" ? (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-12"
                    >
                        {/* My Bounties Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">My Bounties</h2>
                                        <p className="text-xs text-slate-500">{myBounties.length} bounties created</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setActiveTab("create");
                                        setCreateType("bounty");
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    New Bounty
                                </Button>
                            </div>
                            {isBountiesLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-64 bg-slate-50 animate-pulse border border-slate-100" />
                                    ))}
                                </div>
                            ) : myBounties.length === 0 ? (
                                <div className="py-12 text-center bg-white border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                        <Target className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No bounties created yet</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Create your first bounty to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myBounties.map((bounty) => (
                                        <BountyCard
                                            key={bounty.id}
                                            bounty={bounty}
                                            onSubmitToBounty={() => router.push(`/bounties/${bounty.id}`)}
                                            onSelectWinner={() => router.push(`/bounties/${bounty.id}`)}
                                            onTriggerSlash={() => router.push(`/bounties/${bounty.id}`)}
                                            onRefundNoSubmissions={() => router.push(`/bounties/${bounty.id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Quests Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">My Quests</h2>
                                        <p className="text-xs text-slate-500">{myQuests.length} quests created</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setActiveTab("create");
                                        setCreateType("quest");
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    New Quest
                                </Button>
                            </div>
                            {isQuestsLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-64 bg-slate-50 animate-pulse border border-slate-100" />
                                    ))}
                                </div>
                            ) : myQuests.length === 0 ? (
                                <div className="py-12 text-center bg-white border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                        <Zap className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No quests created yet</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Create your first quest to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myQuests.map((quest) => (
                                        <QuestCard
                                            key={quest.id}
                                            quest={quest}
                                            entryCount={entryCounts[quest.id] || 0}
                                            onShowSubmitModal={() => router.push(`/quests/${quest.id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : activeTab === "reputation" ? (
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
                ) : activeTab === "history" ? (
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
                ) : null}
            </AnimatePresence>
        </div>
    );
}
