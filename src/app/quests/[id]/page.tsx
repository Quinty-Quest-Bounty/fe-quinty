"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
    CONTRACT_ADDRESSES,
    QUEST_ABI,
    BASE_SEPOLIA_CHAIN_ID,
} from "../../../utils/contracts";
import { formatETH, formatTimeLeft, formatAddress, wagmiConfig } from "../../../utils/web3";
import { uploadToIpfs, fetchMetadataFromIpfs, QuestMetadata, CUSTOM_PINATA_GATEWAY } from "../../../utils/ipfs";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../../../utils/prices";
import { useAlert } from "../../../hooks/useAlert";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import {
    ChevronRight,
    Clock,
    Users,
    Gift,
    Copy,
    Check,
    Send,
    ExternalLink,
    FileText,
    Loader2,
    Upload,
    X,
    CheckCircle2,
    Shield,
    TrendingUp,
    Timer,
    Target,
    Zap,
} from "lucide-react";
import ethIcon from "../../../assets/crypto/eth.svg";

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
    createdAt: number;
    resolved: boolean;
    cancelled: boolean;
    requirements: string;
    imageUrl?: string;
}

interface Entry {
    solver: string;
    ipfsProofCid: string;
    socialHandle: string;
    timestamp: number;
    status: number;
    feedback: string;
}

export default function QuestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { address } = useAccount();
    const { showAlert } = useAlert();
    const questId = params.id as string;

    const [quest, setQuest] = useState<Quest | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [newEntry, setNewEntry] = useState({
        twitterUrl: "",
        ipfsProofCid: "",
        socialHandle: "",
        description: "",
    });
    const [uploadedProofImage, setUploadedProofImage] = useState<File | null>(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [ethPrice, setEthPrice] = useState<number>(0);
    const [showSubmitForm, setShowSubmitForm] = useState(false);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        const fetchPrice = async () => {
            const price = await getEthPriceInUSD();
            setEthPrice(price);
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadQuest = async () => {
        try {
            setIsLoading(true);
            const questData = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                abi: QUEST_ABI,
                functionName: "getQuest",
                args: [BigInt(questId)],
            });

            if (questData) {
                const [creator, title, description, totalAmount, perQualifier, maxQualifiers, qualifiersCount, deadline, createdAt, resolved, cancelled, requirements] = questData as any;

                let imageUrl: string | undefined = undefined;
                const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
                if (metadataMatch) {
                    try {
                        const metadata = await fetchMetadataFromIpfs(metadataMatch[1]) as QuestMetadata;
                        if (metadata.images && metadata.images.length > 0) {
                            imageUrl = `${CUSTOM_PINATA_GATEWAY}${metadata.images[0]}`;
                        }
                    } catch (err) {
                        console.error("Error fetching quest metadata:", err);
                    }
                }

                setQuest({
                    id: parseInt(questId), creator, title, description, totalAmount, perQualifier,
                    maxQualifiers: Number(maxQualifiers), qualifiersCount: Number(qualifiersCount),
                    deadline: Number(deadline), createdAt: Number(createdAt), resolved, cancelled, requirements, imageUrl,
                });

                const entryCount = await readContract(wagmiConfig, {
                    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                    abi: QUEST_ABI,
                    functionName: "getEntryCount",
                    args: [BigInt(questId)],
                });

                const loadedEntries: Entry[] = [];
                for (let i = 0; i < Number(entryCount); i++) {
                    const entryData = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                        abi: QUEST_ABI,
                        functionName: "getEntry",
                        args: [BigInt(questId), BigInt(i)],
                    });
                    const [solver, ipfsProofCid, socialHandle, timestamp, status, feedback] = entryData as any;
                    loadedEntries.push({ solver, ipfsProofCid, socialHandle, timestamp: Number(timestamp), status: Number(status), feedback });
                }
                setEntries(loadedEntries);
            }
        } catch (error) {
            console.error("Error loading quest:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (questId) loadQuest(); }, [questId]);
    useEffect(() => {
        if (isConfirmed) {
            loadQuest();
            setNewEntry({ twitterUrl: "", ipfsProofCid: "", socialHandle: "", description: "" });
            setUploadedProofImage(null);
            setShowSubmitForm(false);
        }
    }, [isConfirmed]);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submitEntry = async () => {
        if (!uploadedProofImage && !newEntry.ipfsProofCid.trim()) {
            showAlert({ title: "Missing Proof", description: "Please upload a proof image or enter an IPFS CID" });
            return;
        }
        if (!newEntry.socialHandle.trim()) {
            showAlert({ title: "Missing Information", description: "Please enter your social handle" });
            return;
        }

        try {
            let proofCid = newEntry.ipfsProofCid;
            if (uploadedProofImage) {
                setIsUploadingProof(true);
                try {
                    proofCid = await uploadToIpfs(uploadedProofImage, { questId, type: "quest-proof" });
                } catch (uploadError) {
                    showAlert({ title: "Upload Failed", description: "Failed to upload proof to IPFS. Please try again." });
                    setIsUploadingProof(false);
                    return;
                } finally {
                    setIsUploadingProof(false);
                }
            }

            const handle = newEntry.socialHandle.replace('@', '');
            writeContract({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                abi: QUEST_ABI,
                functionName: "submitEntry",
                args: [BigInt(questId), proofCid, handle],
            });
        } catch (error) {
            console.error("Error submitting entry:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-stone-50">
                <div className="text-center">
                    <Loader2 className="size-10 animate-spin mx-auto text-amber-500" />
                    <p className="text-stone-500 mt-4 text-sm">Loading quest...</p>
                </div>
            </div>
        );
    }

    if (!quest) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-stone-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-3">Quest not found</h2>
                    <p className="text-stone-500 mb-6 text-sm">The quest you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push("/quests")}>Back to Quests</Button>
                </div>
            </div>
        );
    }

    const isCreator = address?.toLowerCase() === quest.creator.toLowerCase();
    const isExpired = Date.now() / 1000 > quest.deadline;
    const isFull = quest.qualifiersCount >= quest.maxQualifiers;
    const userEntry = entries.find((e) => e.solver.toLowerCase() === address?.toLowerCase());
    const canSubmit = !isExpired && !quest.resolved && !quest.cancelled && !isFull && !userEntry;
    const progress = Math.min((quest.qualifiersCount / quest.maxQualifiers) * 100, 100);

    const ethAmount = Number(quest.perQualifier) / 1e18;
    const totalEthAmount = Number(quest.totalAmount) / 1e18;
    const usdAmount = ethPrice > 0 ? convertEthToUSD(ethAmount, ethPrice) : 0;

    const getStatusConfig = () => {
        if (quest.cancelled) return { label: "Cancelled", color: "bg-stone-400", textColor: "text-stone-500", bgColor: "bg-stone-100" };
        if (quest.resolved) return { label: "Completed", color: "bg-stone-400", textColor: "text-stone-500", bgColor: "bg-stone-100" };
        if (isExpired) return { label: "Expired", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" };
        if (isFull) return { label: "Full", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" };
        return { label: "Active", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" };
    };

    const statusConfig = getStatusConfig();

    return (
        <div className="min-h-dvh bg-stone-50 relative pt-20 pb-16">
            {/* Loading Overlay */}
            {(isPending || isConfirming) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-8 shadow-2xl max-w-sm text-center">
                        <Loader2 className="size-10 animate-spin mx-auto text-amber-500" />
                        <p className="font-semibold text-lg mt-4 text-stone-800">{isPending ? "Waiting for approval..." : "Confirming..."}</p>
                        <p className="text-sm text-stone-500 mt-1">Please don't close this page</p>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-6 text-stone-400">
                    <button onClick={() => router.push("/")} className="hover:text-amber-500">Home</button>
                    <ChevronRight className="size-4" />
                    <button onClick={() => router.push("/dashboard")} className="hover:text-amber-500">Dashboard</button>
                    <ChevronRight className="size-4" />
                    <span className="text-stone-700 font-medium">Quest #{questId}</span>
                </div>

                {/* Type indicator bar */}
                <div className="h-1.5 w-full bg-amber-400 mb-6" />

                {/* TWO COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT SIDEBAR - Important Info (Sticky) */}
                    <div className="lg:col-span-4 order-2 lg:order-1">
                        <div className="lg:sticky lg:top-24 space-y-4">
                            
                            {/* REWARD CARD - The Big Highlight */}
                            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 text-white shadow-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Gift className="size-5 text-white/80" />
                                    <span className="text-amber-100 text-xs font-medium uppercase tracking-wider">Reward Per User</span>
                                </div>
                                <div className="flex items-center gap-3 mb-1">
                                    <Image src={ethIcon} alt="ETH" width={32} height={32} className="flex-shrink-0" />
                                    <span className="text-4xl font-bold tabular-nums">{ethAmount.toFixed(4)}</span>
                                    <span className="text-xl text-white/60">ETH</span>
                                </div>
                                {ethPrice > 0 && (
                                    <p className="text-amber-100 text-sm flex items-center gap-1 mt-2">
                                        <TrendingUp className="size-3" />
                                        ≈ {formatUSD(usdAmount)}
                                    </p>
                                )}

                                {/* CTA */}
                                {canSubmit && (
                                    <Button onClick={() => setShowSubmitForm(true)} className="w-full mt-5 bg-white text-amber-600 hover:bg-amber-50 font-semibold h-11 shadow-md">
                                        <Send className="size-4 mr-2" />
                                        Submit Entry
                                    </Button>
                                )}
                            </div>

                            {/* STATS - Eye-catching */}
                            <div className="bg-white border border-stone-200 overflow-hidden">
                                <div className="grid grid-cols-2 divide-x divide-stone-100">
                                    <div className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Timer className="size-3.5 text-amber-500" />
                                            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Deadline</span>
                                        </div>
                                        <p className="text-sm font-bold text-stone-800">{formatTimeLeft(BigInt(quest.deadline))}</p>
                                    </div>
                                    <div className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Users className="size-3.5 text-blue-500" />
                                            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Spots</span>
                                        </div>
                                        <p className="text-sm font-bold text-stone-800">{quest.qualifiersCount} / {quest.maxQualifiers}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-stone-100 border-t border-stone-100">
                                    <div className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Target className="size-3.5 text-emerald-500" />
                                            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Entries</span>
                                        </div>
                                        <p className="text-sm font-bold text-stone-800">{entries.length}</p>
                                    </div>
                                    <div className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Zap className="size-3.5 text-violet-500" />
                                            <span className="text-[10px] text-stone-400 uppercase tracking-wider">Pool</span>
                                        </div>
                                        <p className="text-sm font-bold text-stone-800">{totalEthAmount.toFixed(3)} ETH</p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-white border border-stone-200 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-stone-500">Progress</span>
                                    <span className="text-xs font-semibold text-stone-800">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-stone-100 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            {/* Status & Details */}
                            <div className="bg-white border border-stone-200 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-stone-500">Status</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Total Budget</span>
                                        <span className="font-semibold text-stone-800">{totalEthAmount.toFixed(4)} ETH</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Per Qualifier</span>
                                        <span className="font-semibold text-stone-800">{ethAmount.toFixed(4)} ETH</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Created</span>
                                        <span className="font-semibold text-stone-800">{new Date(quest.createdAt * 1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Creator */}
                            <div className="bg-white border border-stone-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-stone-100 flex items-center justify-center">
                                        <Shield className="size-5 text-stone-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-stone-400">Creator</p>
                                        <p className="text-sm font-mono font-medium text-stone-700">{formatAddress(quest.creator)}</p>
                                    </div>
                                    {isCreator && <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-600">You</span>}
                                </div>
                            </div>

                            {/* Share & User Status */}
                            <div className="space-y-2">
                                <Button onClick={copyLink} variant="outline" className="w-full border-stone-200 text-stone-600 h-10">
                                    {copied ? <Check className="size-4 mr-2 text-green-500" /> : <Copy className="size-4 mr-2" />}
                                    {copied ? "Copied!" : "Share Quest"}
                                </Button>
                            </div>

                            {/* Transaction */}
                            {hash && (
                                <div className="bg-white border border-stone-200 p-4">
                                    <p className="text-xs font-semibold text-stone-700 mb-2">Transaction</p>
                                    <a href={`https://shannon-explorer.somnia.network/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 text-xs font-mono break-all hover:underline">
                                        {hash.slice(0, 20)}...
                                    </a>
                                    {isConfirming && <p className="text-xs text-stone-500 mt-2 flex items-center gap-1"><Clock className="size-3 animate-spin" /> Confirming...</p>}
                                    {isConfirmed && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Check className="size-4" /> Confirmed!</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT CONTENT - Details */}
                    <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
                        
                        {/* Hero Image */}
                        {quest.imageUrl && (
                            <div className="bg-white border border-stone-200 overflow-hidden">
                                <img src={quest.imageUrl} alt={quest.title} className="w-full h-auto max-h-96 object-contain" />
                            </div>
                        )}

                        {/* Title Section */}
                        <div className="bg-white border border-stone-200 p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-amber-400" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Quest</span>
                                </div>
                                <span className="text-stone-300">•</span>
                                <span className="text-[11px] text-stone-400">#{questId}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                                {quest.title}
                            </h1>
                        </div>

                        {/* User's Entry Status */}
                        {userEntry && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-amber-100 flex items-center justify-center">
                                            <CheckCircle2 className="size-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Your Submission</p>
                                            <p className="font-semibold text-stone-800">
                                                {userEntry.status === 1 ? "Approved ✓" : userEntry.status === 2 ? "Rejected" : "Pending Review"}
                                            </p>
                                        </div>
                                    </div>
                                    {userEntry.status === 1 && (
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-amber-600">{ethAmount.toFixed(4)} ETH</p>
                                            {ethPrice > 0 && <p className="text-sm text-stone-500">{formatUSD(usdAmount)}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* About + Requirements (Combined) */}
                        <div className="bg-white border border-stone-200 p-6">
                            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                                <FileText className="size-5 text-amber-500" />
                                About This Quest
                            </h2>
                            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                                {quest.description.replace(/\n\nImage:.*$/, "").replace(/\n\nMetadata:.*$/, "")}
                            </p>

                            {quest.requirements && (
                                <div className="mt-6 pt-6 border-t border-stone-100">
                                    <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="size-4 text-amber-500" />
                                        Requirements
                                    </h3>
                                    <ul className="space-y-2">
                                        {quest.requirements.split('\n').filter(req => req.trim()).map((req, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                                                <div className="w-1.5 h-1.5 bg-amber-400 mt-2 flex-shrink-0" />
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* All Entries */}
                        {entries.length > 0 && (
                            <div className="bg-white border border-stone-200 p-6">
                                <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                                    <Users className="size-5 text-amber-500" />
                                    Entries ({entries.length})
                                </h2>
                                <div className="space-y-3">
                                    {entries.map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-stone-100 hover:border-stone-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 bg-stone-100 flex items-center justify-center">
                                                    <Users className="size-5 text-stone-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-mono font-medium text-stone-700">{formatAddress(entry.solver)}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 ${
                                                            entry.status === 1 ? "bg-amber-50 text-amber-600" :
                                                            entry.status === 2 ? "bg-stone-100 text-stone-500" :
                                                            "bg-stone-50 text-stone-400"
                                                        }`}>
                                                            {entry.status === 1 ? "Approved" : entry.status === 2 ? "Rejected" : "Pending"}
                                                        </span>
                                                        <span className="text-xs text-stone-400">@{entry.socialHandle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!(entry.ipfsProofCid.includes("twitter.com") || entry.ipfsProofCid.includes("x.com")) && (
                                                <Button variant="outline" size="sm" asChild className="border-stone-200 text-stone-600 h-8">
                                                    <a href={`https://ipfs.io/ipfs/${entry.ipfsProofCid}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="size-3 mr-1" /> View
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Form Modal */}
            <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="size-5 text-amber-500" />
                            Submit Entry
                        </DialogTitle>
                        <DialogDescription>
                            Provide proof of completion to qualify for the reward
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Social Handle *</label>
                            <Input placeholder="@username" value={newEntry.socialHandle} onChange={(e) => setNewEntry({ ...newEntry, socialHandle: e.target.value })} className="h-10 border-stone-200" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-700 mb-1.5 block">X Post URL (Optional)</label>
                            <Input placeholder="https://x.com/..." value={newEntry.twitterUrl} onChange={(e) => setNewEntry({ ...newEntry, twitterUrl: e.target.value })} className="h-10 border-stone-200" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Proof Image *</label>
                            {!uploadedProofImage ? (
                                <div className="border-2 border-dashed border-stone-200 hover:border-amber-300 bg-stone-50 p-6 text-center cursor-pointer transition-colors">
                                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setUploadedProofImage(e.target.files[0])} className="hidden" id="proof-upload" />
                                    <label htmlFor="proof-upload" className="cursor-pointer">
                                        <Upload className="size-6 mx-auto mb-2 text-stone-400" />
                                        <p className="text-sm text-stone-600">Click to upload</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative">
                                    <img src={URL.createObjectURL(uploadedProofImage)} alt="Preview" className="w-full h-32 object-cover border border-stone-200" />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => setUploadedProofImage(null)} className="absolute -top-2 -right-2 size-6">
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Notes (Optional)</label>
                            <Textarea placeholder="Any additional information..." value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })} rows={2} className="resize-none border-stone-200" />
                        </div>
                        <Button
                            onClick={submitEntry}
                            disabled={(!uploadedProofImage && !newEntry.ipfsProofCid.trim()) || !newEntry.socialHandle.trim() || isPending || isConfirming || isUploadingProof}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-11"
                        >
                            {isUploadingProof ? "Uploading..." : isPending || isConfirming ? "Submitting..." : "Submit Entry"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
