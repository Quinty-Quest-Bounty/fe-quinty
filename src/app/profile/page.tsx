"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from "wagmi";
import { formatETH, parseETH, formatAddress, formatTimeLeft } from "../../utils/web3";
import { useHistory } from "../../hooks/useHistory";
import { useBounties } from "../../hooks/useBounties";
import { useQuests } from "../../hooks/useQuests";
import { CONTRACT_ADDRESSES, QUINTY_ABI, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID } from "../../utils/contracts";
import { uploadMetadataToIpfs, BountyMetadata, QuestMetadata, formatIpfsUrl, fetchMetadataFromIpfs } from "../../utils/ipfs";
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
    Settings,
    Pencil,
    Loader2,
    X as XIcon,
    CheckCircle,
    Link as LinkIcon,
    Filter,
    Trophy,
    Send,
    Sparkles,
    Clock,
    Users as UsersIcon,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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
    const { data: balanceData } = useBalance({ address: address });
    const { transactions, isLoading } = useHistory();
    const { bounties, isLoading: isBountiesLoading } = useBounties();
    const { quests, entryCounts, isLoading: isQuestsLoading } = useQuests();
    const { writeContract, data: bountyHash, isPending: isBountyPending } = useWriteContract();
    const { writeContractAsync } = useWriteContract();
    const { isLoading: isBountyConfirming, isSuccess: isBountyConfirmed } = useWaitForTransactionReceipt({ hash: bountyHash });
    const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
    const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "bounties" | "quests">("all");
    const [historyActionFilter, setHistoryActionFilter] = useState<"all" | "created" | "submitted" | "wins">("all");
    const [createType, setCreateType] = useState<CreateType>(null);
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [bountyMetadata, setBountyMetadata] = useState<Map<number, BountyMetadata>>(new Map());
    
    const { profile, updateUsername, refreshProfile } = useAuth();
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

    const { connectX, disconnectX, isConnecting: isConnectingX } = useSocialVerification();
    const xUsername = profile?.twitter_username
        ? (profile.twitter_username.startsWith('@') ? profile.twitter_username : `@${profile.twitter_username}`)
        : '';
    const isXConnected = !!profile?.twitter_username;

    useEffect(() => { setMounted(true); }, []);

    const myBounties = useMemo(() => {
        if (!address) return [];
        return bounties.filter(b => b.creator.toLowerCase() === address.toLowerCase());
    }, [bounties, address]);

    const myQuests = useMemo(() => {
        if (!address) return [];
        return quests.filter(q => q.creator.toLowerCase() === address.toLowerCase());
    }, [quests, address]);

    useEffect(() => {
        const loadMetadata = async () => {
            const newMeta = new Map<number, BountyMetadata>();
            for (const b of myBounties) {
                if (b.metadataCid && !bountyMetadata.has(b.id)) {
                    try { const meta = await fetchMetadataFromIpfs(b.metadataCid); newMeta.set(b.id, meta); } catch (e) { console.error(`Error fetching bounty metadata for ${b.id}:`, e); }
                }
            }
            if (newMeta.size > 0) setBountyMetadata(prev => new Map([...prev, ...newMeta]));
        };
        if (myBounties.length > 0) loadMetadata();
    }, [myBounties]);

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        if (historyTypeFilter === "bounties") filtered = filtered.filter(tx => tx.contractType === "Quinty");
        else if (historyTypeFilter === "quests") filtered = filtered.filter(tx => tx.contractType === "Quest");
        if (historyActionFilter === "created") filtered = filtered.filter(tx => tx.type.includes("created"));
        else if (historyActionFilter === "submitted") filtered = filtered.filter(tx => tx.type.includes("submitted"));
        else if (historyActionFilter === "wins") filtered = filtered.filter(tx => tx.type.includes("won") || tx.type.includes("approved"));
        return filtered;
    }, [transactions, historyTypeFilter, historyActionFilter]);

    const getIcon = (type: string) => {
        if (type.includes("bounty")) return <Target className="w-4 h-4 text-[#0EA885]" />;
        if (type.includes("quest")) return <Zap className="w-4 h-4 text-amber-500" />;
        return <HistoryIcon className="w-4 h-4 text-zinc-400" />;
    };

    const getStatusColor = (type: string) => {
        if (type.includes("created")) return "bg-violet-50 text-violet-600 border-violet-200/60";
        if (type.includes("submitted")) return "bg-sky-50 text-sky-600 border-sky-200/60";
        if (type.includes("won") || type.includes("approved")) return "bg-[#E6FAF5] text-[#0EA885] border-[#0EA885]/20";
        if (type.includes("rejected")) return "bg-red-50 text-red-600 border-red-200/60";
        return "bg-zinc-50 text-zinc-600 border-zinc-200";
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "bounty_created": return "Created Bounty";
            case "bounty_submitted": return "Submitted to Bounty";
            case "bounty_won": return "Won Bounty";
            case "quest_created": return "Created Quest";
            case "quest_submitted": return "Submitted to Quest";
            case "quest_approved": return "Quest Approved";
            case "quest_rejected": return "Quest Rejected";
            default: return type.replace("_", " ");
        }
    };

    const handleCreateBounty = async (formData: any) => {
        try {
            if (!address) { alert("Please connect your wallet first"); return; }
            const missingFields = [];
            if (!formData.title) missingFields.push("Title");
            if (!formData.description) missingFields.push("Description");
            if (!formData.amount) missingFields.push("Amount");
            if (!formData.openDeadline) missingFields.push("Submission Deadline");
            if (!formData.judgingDeadline) missingFields.push("Judging Deadline");
            if (missingFields.length > 0) { alert(`Please fill in: ${missingFields.join(", ")}`); return; }
            const openDeadlineTs = Math.floor(new Date(formData.openDeadline).getTime() / 1000);
            const judgingDeadlineTs = Math.floor(new Date(formData.judgingDeadline).getTime() / 1000);
            const metadata: BountyMetadata = {
                title: formData.title, description: formData.description,
                requirements: formData.requirements.filter((r: string) => r.trim()),
                deliverables: formData.deliverables.filter((d: string) => d.trim()),
                skills: formData.skills.filter((s: string) => s.trim()),
                images: formData.images || [], deadline: judgingDeadlineTs, bountyType: formData.bountyType,
            };
            const metadataCid = await uploadMetadataToIpfs(metadata);
            writeContract({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                abi: QUINTY_ABI, functionName: "createBounty",
                args: [formData.title, `${formData.description}\n\nMetadata: ipfs://${metadataCid}`, BigInt(openDeadlineTs), BigInt(judgingDeadlineTs), BigInt(formData.slashPercent)],
                value: parseETH(formData.amount),
            });
        } catch (e: any) { console.error("Error creating bounty:", e); alert(`Error creating bounty: ${e.message || e}`); }
    };

    const handleCreateQuest = async (formData: any) => {
        if (chainId !== BASE_SEPOLIA_CHAIN_ID) { const networkOk = await ensureBaseSepoliaNetwork(); if (!networkOk) return; }
        if (!address) { alert("Please connect your wallet first"); return; }
        try {
            const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);
            const perQualifierWei = parseETH(formData.perQualifier);
            const totalAmount = perQualifierWei * BigInt(formData.maxQualifiers);
            const metadata: QuestMetadata = {
                title: formData.title, description: formData.description,
                requirements: formData.requirements, images: formData.imageUrl ? [formData.imageUrl] : [],
                deadline: deadlineTimestamp, questType: formData.questType || "other",
            };
            const metadataCid = await uploadMetadataToIpfs(metadata);
            await writeContractAsync({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                abi: QUEST_ABI, functionName: "createQuest",
                args: [formData.title, `${formData.description}\n\nMetadata: ipfs://${metadataCid}`, perQualifierWei, BigInt(formData.maxQualifiers), BigInt(deadlineTimestamp), formData.requirements],
                value: totalAmount,
            });
            setTimeout(() => { setCreateType(null); setShowCreateOptions(false); setActiveTab("reputation"); }, 2000);
        } catch (error: any) { console.error("Error creating quest:", error); alert(`Error creating quest: ${error.message || error}`); }
    };

    useEffect(() => { if (isBountyConfirmed) { setCreateType(null); setShowCreateOptions(false); setActiveTab("reputation"); } }, [isBountyConfirmed]);

    const copyAddress = () => {
        if (address) { navigator.clipboard.writeText(address); setCopiedAddress(true); setTimeout(() => setCopiedAddress(false), 2000); }
    };

    if (!mounted || isConnecting || isReconnecting) {
        return (
            <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
                <div className="w-16 h-16 bg-zinc-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <User className="w-8 h-8 text-zinc-300" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2 font-heading">Loading...</h2>
                <p className="text-zinc-500 text-sm font-mono">Please wait while we check your wallet connection.</p>
            </div>
        );
    }

    if (!address || !profile) {
        return (
            <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
                <div className="w-16 h-16 bg-zinc-50 flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-zinc-300" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2 font-heading">Sign In</h2>
                <p className="text-zinc-500 text-sm font-mono">Please sign in to view your profile.</p>
            </div>
        );
    }

    return (
        <div key={address || 'disconnected'} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 relative">
            {/* Section header */}
            <div className="border-b border-zinc-200 pb-3 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-[#0EA885]" />
                    <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">Profile</h1>
                </div>
            </div>

            {/* Wallet Info Card */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-white border border-zinc-200 border-l-2 border-l-[#0EA885] p-6">
                    {/* Username Section */}
                    <div className="mb-6 pb-6 border-b border-zinc-100">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-[#0EA885]" />
                            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">Display Name</span>
                        </div>
                        {isEditingUsername ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="max-w-xs text-sm font-semibold"
                                    autoFocus
                                />
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        if (!newUsername.trim()) return;
                                        setIsUpdatingUsername(true);
                                        const success = await updateUsername(newUsername.trim());
                                        setIsUpdatingUsername(false);
                                        if (success) setIsEditingUsername(false);
                                        else alert('Failed to update display name. Please try logging out and back in.');
                                    }}
                                    disabled={isUpdatingUsername || !newUsername.trim()}
                                >
                                    {isUpdatingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setIsEditingUsername(false); setNewUsername(profile?.username || ""); }} disabled={isUpdatingUsername}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-zinc-900">{profile?.username || formatAddress(address || "")}</span>
                                <button onClick={() => { setNewUsername(profile?.username || ""); setIsEditingUsername(true); }} className="p-1.5 hover:bg-[#0EA885]/5 transition-colors border border-zinc-200 hover:border-[#0EA885]/30" title="Edit username">
                                    <Pencil className="w-3.5 h-3.5 text-zinc-400 hover:text-[#0EA885]" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* X Account Section */}
                    <div className="mb-6 pb-6 border-b border-zinc-100">
                        <div className="flex items-center gap-2 mb-3">
                            <XIcon className="w-4 h-4 text-zinc-900" />
                            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">X Account</span>
                            {isXConnected && (
                                <Badge className="bg-[#E6FAF5] text-[#0EA885] border-[#0EA885]/20 text-[10px] font-mono font-semibold">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>
                        {isXConnected ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black flex items-center justify-center">
                                        <XIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-lg font-semibold text-zinc-900">{xUsername}</span>
                                        <p className="text-xs font-mono text-zinc-400">Connected & verified via OAuth</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={async () => { await disconnectX(); await refreshProfile(); }} className="text-xs">
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-zinc-500">Connect your X account to create bounties and quests</p>
                                <Button size="sm" onClick={async () => { const result = await connectX(); if (result) await refreshProfile(); }} disabled={isConnectingX} className="bg-black hover:bg-zinc-800 text-white">
                                    {isConnectingX ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</>) : (<><LinkIcon className="w-4 h-4 mr-2" />Connect X</>)}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="w-4 h-4 text-[#0EA885]" />
                                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">Wallet Address</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-zinc-900">{formatAddress(address || "")}</span>
                                <button onClick={copyAddress} className="p-1.5 hover:bg-[#0EA885]/5 transition-colors border border-zinc-200 hover:border-[#0EA885]/30" title="Copy address">
                                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-[#0EA885]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                                </button>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-3">
                                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">Balance</span>
                            </div>
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-2xl font-semibold text-zinc-900 tabular-nums font-heading">{balanceData ? formatETH(balanceData.value) : "0.00"}</span>
                                <span className="text-xs font-mono font-semibold text-zinc-400">ETH</span>
                            </div>
                            <div className="text-xs font-mono text-zinc-400 mt-1">{balanceData?.symbol || "ETH"} · Base Sepolia</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8 sm:mb-10 relative">
                <div className="inline-flex flex-wrap gap-1 p-1 bg-zinc-50 border border-zinc-200">
                    {[
                        { id: "overview" as ProfileTab, label: "Overview", icon: <User className="w-4 h-4 inline-block mr-1.5" /> },
                        { id: "reputation" as ProfileTab, label: "Reputation", icon: <Award className="w-4 h-4 inline-block mr-1.5" /> },
                        { id: "history" as ProfileTab, label: "History", icon: <HistoryIcon className="w-4 h-4 inline-block mr-1.5" /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 sm:px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
                                activeTab === tab.id
                                    ? "bg-[#0EA885] text-white shadow-sm"
                                    : "text-zinc-500 hover:text-[#0EA885] hover:bg-[#0EA885]/5"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === "overview" ? (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-12 relative">
                        {/* My Bounties */}
                        <div>
                            <div className="flex items-center justify-between mb-6 border-b border-zinc-200 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#0EA885] flex items-center justify-center"><Target className="w-5 h-5 text-white" /></div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-900 font-heading">My Bounties</h2>
                                        <p className="text-xs font-mono text-zinc-400">{myBounties.length} bounties created</p>
                                    </div>
                                </div>
                                <Button onClick={() => { setActiveTab("create"); setCreateType("bounty"); }} variant="outline" size="sm" className="text-xs font-mono">
                                    <Plus className="w-3 h-3 mr-1" />New Bounty
                                </Button>
                            </div>
                            {isBountiesLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-64 bg-zinc-50 animate-pulse border border-zinc-200" />))}
                                </div>
                            ) : myBounties.length === 0 ? (
                                <div className="py-12 text-center bg-white border border-zinc-200">
                                    <div className="w-12 h-12 bg-zinc-50 flex items-center justify-center mx-auto mb-4"><Target className="w-6 h-6 text-zinc-300" /></div>
                                    <h3 className="text-sm font-semibold text-zinc-900 font-heading">No bounties created yet</h3>
                                    <p className="text-xs font-mono text-zinc-400 mt-1">Create your first bounty to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myBounties.map((bounty) => {
                                        const meta = bountyMetadata.get(bounty.id);
                                        const image = meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null;
                                        const statusLabel = bounty.status === 0 ? "Open" : bounty.status === 1 ? "Judging" : bounty.status === 2 ? "Resolved" : "Slashed";
                                        const statusColor = bounty.status === 0 ? "text-[#0EA885]" : bounty.status === 1 ? "text-amber-500" : bounty.status === 2 ? "text-zinc-400" : "text-red-500";
                                        const dotColor = bounty.status === 0 ? "bg-[#0EA885]" : bounty.status === 1 ? "bg-amber-500" : bounty.status === 2 ? "bg-zinc-400" : "bg-red-500";
                                        return (
                                            <div key={bounty.id} onClick={() => router.push(`/bounties/${bounty.id}`)} className="group cursor-pointer bg-white hover:shadow-md hover:shadow-[#0EA885]/5 border border-zinc-200 hover:border-[#0EA885]/30 transition-all duration-200 overflow-hidden flex flex-col">
                                                <div className="h-[2px] w-full bg-[#0EA885]" />
                                                <div className="p-4 flex flex-col flex-1">
                                                    {/* Status + ID */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={`flex items-center gap-1.5 ${statusColor}`}>
                                                            <div className={`w-1.5 h-1.5 ${dotColor}`} />
                                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{statusLabel}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-zinc-300 tabular-nums">#{bounty.id}</span>
                                                    </div>
                                                    {/* Title + thumbnail */}
                                                    <div className="flex gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#0EA885] transition-colors">{bounty.title}</h3>
                                                            <span className="text-[11px] font-mono text-zinc-400 mt-1 block">{bounty.submissionCount} submissions</span>
                                                        </div>
                                                        {image && (
                                                            <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-zinc-50">
                                                                <img src={image} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Data strip */}
                                                    <div className="mt-auto pt-3 border-t border-zinc-100 flex items-end justify-between">
                                                        <div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-lg font-bold text-zinc-900 tabular-nums tracking-tight">{formatETH(bounty.amount)}</span>
                                                                <span className="text-[10px] font-mono font-semibold text-zinc-400">ETH</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatTimeLeft(bounty.judgingDeadline)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* My Quests */}
                        <div>
                            <div className="flex items-center justify-between mb-6 border-b border-zinc-200 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-900 font-heading">My Quests</h2>
                                        <p className="text-xs font-mono text-zinc-400">{myQuests.length} quests created</p>
                                    </div>
                                </div>
                                <Button onClick={() => { setActiveTab("create"); setCreateType("quest"); }} variant="outline" size="sm" className="text-xs font-mono">
                                    <Plus className="w-3 h-3 mr-1" />New Quest
                                </Button>
                            </div>
                            {isQuestsLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-64 bg-zinc-50 animate-pulse border border-zinc-200" />))}
                                </div>
                            ) : myQuests.length === 0 ? (
                                <div className="py-12 text-center bg-white border border-zinc-200">
                                    <div className="w-12 h-12 bg-zinc-50 flex items-center justify-center mx-auto mb-4"><Zap className="w-6 h-6 text-zinc-300" /></div>
                                    <h3 className="text-sm font-semibold text-zinc-900 font-heading">No quests created yet</h3>
                                    <p className="text-xs font-mono text-zinc-400 mt-1">Create your first quest to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myQuests.map((quest) => {
                                        const isExpired = Date.now() / 1000 > quest.deadline;
                                        const image = quest.imageUrl || null;
                                        const statusLabel = quest.resolved ? "Completed" : quest.cancelled ? "Cancelled" : isExpired ? "Expired" : "Active";
                                        const statusColor = quest.resolved ? "text-zinc-400" : quest.cancelled ? "text-zinc-400" : isExpired ? "text-red-500" : "text-[#0EA885]";
                                        const dotColor = quest.resolved ? "bg-zinc-400" : quest.cancelled ? "bg-zinc-300" : isExpired ? "bg-red-500" : "bg-[#0EA885]";
                                        const progress = Math.min((quest.qualifiersCount / quest.maxQualifiers) * 100, 100);
                                        return (
                                            <div key={quest.id} onClick={() => router.push(`/quests/${quest.id}`)} className="group cursor-pointer bg-white hover:shadow-md hover:shadow-[#0EA885]/5 border border-zinc-200 hover:border-[#0EA885]/30 transition-all duration-200 overflow-hidden flex flex-col">
                                                <div className="h-[2px] w-full bg-amber-400" />
                                                <div className="p-4 flex flex-col flex-1">
                                                    {/* Status + ID */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={`flex items-center gap-1.5 ${statusColor}`}>
                                                            <div className={`w-1.5 h-1.5 ${dotColor}`} />
                                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{statusLabel}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-zinc-300 tabular-nums">#{quest.id}</span>
                                                    </div>
                                                    {/* Title + thumbnail */}
                                                    <div className="flex gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#0EA885] transition-colors">{quest.title}</h3>
                                                            <span className="text-[11px] font-mono text-zinc-400 mt-1 block">{entryCounts[quest.id] || 0} entries</span>
                                                        </div>
                                                        {image && (
                                                            <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-zinc-50">
                                                                <img src={image} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Progress */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] font-mono text-zinc-400">{quest.qualifiersCount}<span className="text-zinc-300">/{quest.maxQualifiers}</span> qualified</span>
                                                            <span className="text-[10px] font-mono text-zinc-300 tabular-nums">{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-zinc-100 overflow-hidden"><div className="h-full bg-[#0EA885] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                                                    </div>
                                                    {/* Data strip */}
                                                    <div className="mt-auto pt-3 border-t border-zinc-100 flex items-end justify-between">
                                                        <div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-lg font-bold text-zinc-900 tabular-nums tracking-tight">{(Number(quest.perQualifier) / 1e18).toFixed(4)}</span>
                                                                <span className="text-[10px] font-mono font-semibold text-zinc-400">ETH</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono text-zinc-300">per qualifier</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatTimeLeft(BigInt(quest.deadline))}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : activeTab === "reputation" ? (
                    <motion.div key="reputation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="relative">
                        <ReputationDisplay />
                    </motion.div>
                ) : activeTab === "create" ? (
                    <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto relative">
                        {!createType ? (
                            <div className="space-y-4">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-2 font-heading">What do you want to create?</h3>
                                    <p className="text-xs font-mono text-zinc-400">Choose between creating a bounty or a quest</p>
                                </div>
                                <button onClick={() => setCreateType("bounty")} className="w-full p-6 bg-white border border-zinc-200 hover:border-[#0EA885]/30 hover:bg-[#0EA885]/5 transition-all text-left group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-[#0EA885] flex items-center justify-center flex-shrink-0"><Target className="w-6 h-6 text-white" /></div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-zinc-900 mb-1 group-hover:text-[#0EA885]">Create Bounty</h4>
                                            <p className="text-xs text-zinc-500">Post a task with escrow payment for solvers to complete</p>
                                        </div>
                                    </div>
                                </button>
                                <button onClick={() => setCreateType("quest")} className="w-full p-6 bg-white border border-zinc-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-amber-500 flex items-center justify-center flex-shrink-0"><Zap className="w-6 h-6 text-white" /></div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-zinc-900 mb-1 group-hover:text-amber-600">Create Quest</h4>
                                            <p className="text-xs text-zinc-500">Launch a campaign with rewards for multiple participants</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ) : createType === "bounty" ? (
                            <div>
                                <button onClick={() => setCreateType(null)} className="mb-4 text-xs font-mono font-medium text-zinc-400 hover:text-[#0EA885] flex items-center gap-1">← Back to options</button>
                                <BountyForm onSubmit={handleCreateBounty} isPending={isBountyPending || isBountyConfirming} />
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => setCreateType(null)} className="mb-4 text-xs font-mono font-medium text-zinc-400 hover:text-[#0EA885] flex items-center gap-1">← Back to options</button>
                                <QuestForm onSubmit={handleCreateQuest} isPending={false} />
                            </div>
                        )}
                    </motion.div>
                ) : activeTab === "history" ? (
                    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="relative">
                        {/* History Filters */}
                        <div className="flex justify-center items-center gap-3 mb-8">
                            <div className="inline-flex gap-1 p-1 bg-zinc-50 border border-zinc-200">
                                {[
                                    { id: "all" as const, label: "All" },
                                    { id: "bounties" as const, label: "Bounties" },
                                    { id: "quests" as const, label: "Quests" },
                                ].map((tab) => (
                                    <button key={tab.id} onClick={() => setHistoryTypeFilter(tab.id)} className={`px-3 sm:px-4 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${historyTypeFilter === tab.id ? "bg-[#0EA885] text-white shadow-sm" : "text-zinc-500 hover:text-[#0EA885]"}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={`flex items-center gap-2 px-3 py-2 border transition-all text-xs font-mono font-semibold uppercase ${historyActionFilter !== "all" ? "bg-[#0EA885] text-white border-[#0EA885]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#0EA885]/30 hover:text-[#0EA885]"}`}>
                                        <Filter className="w-4 h-4" />
                                        <span>{historyActionFilter === "all" ? "Filter" : historyActionFilter}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => setHistoryActionFilter("all")} className={historyActionFilter === "all" ? "bg-zinc-100" : ""}>
                                        <Sparkles className="w-4 h-4 mr-2 text-zinc-400" /><span className="text-xs font-medium">All Actions</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setHistoryActionFilter("created")} className={historyActionFilter === "created" ? "bg-zinc-100" : ""}>
                                        <Plus className="w-4 h-4 mr-2 text-violet-500" /><span className="text-xs font-medium">Created</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setHistoryActionFilter("submitted")} className={historyActionFilter === "submitted" ? "bg-zinc-100" : ""}>
                                        <Send className="w-4 h-4 mr-2 text-sky-500" /><span className="text-xs font-medium">Submitted</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setHistoryActionFilter("wins")} className={historyActionFilter === "wins" ? "bg-zinc-100" : ""}>
                                        <Trophy className="w-4 h-4 mr-2 text-amber-500" /><span className="text-xs font-medium">Wins</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Transactions */}
                        <div className="space-y-3">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-20 bg-zinc-50 animate-pulse border border-zinc-200" />))
                            ) : filteredTransactions.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {filteredTransactions.map((tx, idx) => (
                                        <motion.div
                                            key={tx.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => router.push(tx.contractType === "Quinty" ? `/bounties/${tx.itemId}` : `/quests/${tx.itemId}`)}
                                            className="group cursor-pointer bg-white border border-zinc-200 p-4 hover:shadow-sm hover:shadow-[#0EA885]/5 hover:border-[#0EA885]/30 transition-all flex items-center gap-4"
                                        >
                                            <div className={`w-10 h-10 flex items-center justify-center border ${getStatusColor(tx.type)}`}>{getIcon(tx.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 border ${getStatusColor(tx.type)}`}>{getTypeLabel(tx.type)}</span>
                                                    <span className="text-[10px] font-mono text-zinc-400">
                                                        {new Date(Number(tx.timestamp) * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-[#0EA885] transition-colors">{tx.description}</p>
                                                <p className="text-xs font-mono text-zinc-400 mt-0.5">{tx.contractType === "Quinty" ? "Bounty" : "Quest"} #{tx.itemId}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                {tx.amount ? (
                                                    <div className={`text-sm font-bold ${tx.type.includes("won") || tx.type.includes("approved") ? "text-[#0EA885]" : "text-zinc-900"}`}>
                                                        {tx.type.includes("won") || tx.type.includes("approved") ? "+" : ""}{formatETH(tx.amount)} <span className="text-[10px] font-mono text-zinc-400">ETH</span>
                                                    </div>
                                                ) : (<div className="text-xs font-mono text-zinc-300">--</div>)}
                                                <div className="p-1 bg-zinc-50 text-zinc-300 group-hover:text-[#0EA885] group-hover:bg-[#0EA885]/5 transition-all"><ChevronRight className="w-4 h-4" /></div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="py-20 text-center bg-white border border-zinc-200">
                                    <div className="w-12 h-12 bg-zinc-50 flex items-center justify-center mx-auto mb-4"><Search className="w-6 h-6 text-zinc-300" /></div>
                                    <h3 className="text-sm font-semibold text-zinc-900 font-heading">No activity found</h3>
                                    <p className="text-xs font-mono text-zinc-400 mt-1">Try changing your filters or start interacting with the protocol.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
