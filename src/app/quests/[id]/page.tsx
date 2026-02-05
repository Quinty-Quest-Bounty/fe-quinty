"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
    CONTRACT_ADDRESSES,
    AIRDROP_ABI,
    BASE_SEPOLIA_CHAIN_ID,
} from "../../../utils/contracts";
import { formatETH, formatTimeLeft, formatAddress, wagmiConfig } from "../../../utils/web3";
import { IpfsImage, uploadToIpfs } from "../../../utils/ipfs";
import { useAlert } from "../../../hooks/useAlert";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Progress } from "../../../components/ui/progress";
import {
    ChevronRight,
    Clock,
    Users,
    Gift,
    Copy,
    Check,
    Send,
    ExternalLink,
    Calendar,
    Coins,
    FileText,
    Target,
    Loader2,
    Upload,
    X,
    CheckCircle2,
    Sparkles,
    Shield,
} from "lucide-react";

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
        description: "",
    });
    const [uploadedProofImage, setUploadedProofImage] = useState<File | null>(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    // Load quest data
    const loadQuest = async () => {
        try {
            setIsLoading(true);
            const questData = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                abi: AIRDROP_ABI,
                functionName: "getAirdrop",
                args: [BigInt(questId)],
            });

            if (questData) {
                const [
                    creator,
                    title,
                    description,
                    totalAmount,
                    perQualifier,
                    maxQualifiers,
                    qualifiersCount,
                    deadline,
                    createdAt,
                    resolved,
                    cancelled,
                    requirements,
                ] = questData as any;

                setQuest({
                    id: parseInt(questId),
                    creator,
                    title,
                    description,
                    totalAmount,
                    perQualifier,
                    maxQualifiers: Number(maxQualifiers),
                    qualifiersCount: Number(qualifiersCount),
                    deadline: Number(deadline),
                    createdAt: Number(createdAt),
                    resolved,
                    cancelled,
                    requirements,
                    imageUrl: description.includes("ipfs://")
                        ? description.match(/ipfs:\/\/[^\s\n]+/)?.[0]
                        : undefined,
                });

                // Load entries
                const entryCount = await readContract(wagmiConfig, {
                    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                    abi: AIRDROP_ABI,
                    functionName: "getEntryCount",
                    args: [BigInt(questId)],
                });

                const loadedEntries: Entry[] = [];
                for (let i = 0; i < Number(entryCount); i++) {
                    const entryData = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                        abi: AIRDROP_ABI,
                        functionName: "getEntry",
                        args: [BigInt(questId), BigInt(i)],
                    });
                    const [solver, ipfsProofCid, timestamp, status, feedback] = entryData as any;
                    loadedEntries.push({
                        solver,
                        ipfsProofCid,
                        timestamp: Number(timestamp),
                        status: Number(status),
                        feedback,
                    });
                }
                setEntries(loadedEntries);
            }
        } catch (error) {
            console.error("Error loading quest:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (questId) {
            loadQuest();
        }
    }, [questId]);

    useEffect(() => {
        if (isConfirmed) {
            loadQuest();
            setNewEntry({ twitterUrl: "", ipfsProofCid: "", description: "" });
            setUploadedProofImage(null);
        }
    }, [isConfirmed]);

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submitEntry = async () => {
        if (!uploadedProofImage && !newEntry.ipfsProofCid.trim()) {
            showAlert({
                title: "Missing Proof",
                description: "Please upload a proof image or enter an IPFS CID",
            });
            return;
        }

        try {
            let proofCid = newEntry.ipfsProofCid;

            // Upload image to IPFS if a file is selected
            if (uploadedProofImage) {
                setIsUploadingProof(true);
                try {
                    proofCid = await uploadToIpfs(uploadedProofImage, {
                        questId: questId,
                        type: "quest-proof",
                    });
                    console.log("Proof uploaded to IPFS:", proofCid);
                } catch (uploadError) {
                    console.error("Error uploading proof to IPFS:", uploadError);
                    showAlert({
                        title: "Upload Failed",
                        description: "Failed to upload proof to IPFS. Please try again.",
                    });
                    setIsUploadingProof(false);
                    return;
                } finally {
                    setIsUploadingProof(false);
                }
            }

            writeContract({
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                abi: AIRDROP_ABI,
                functionName: "submitEntry",
                args: [BigInt(questId), proofCid],
            });
        } catch (error) {
            console.error("Error submitting entry:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh flex items-center justify-center p-4">
                <div className="text-center border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
                    <Loader2 className="size-10 sm:size-12 animate-spin mx-auto text-[#0EA885]" />
                    <p className="text-muted-foreground mt-6 text-sm sm:text-base text-pretty">Loading quest...</p>
                </div>
            </div>
        );
    }

    if (!quest) {
        return (
            <div className="min-h-dvh flex items-center justify-center p-4">
                <div className="text-center border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-balance">Quest not found</h2>
                    <p className="text-muted-foreground mb-6 text-sm sm:text-base text-pretty">The quest you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push("/quests")} className="transition-all duration-300">
                        Back to Quests
                    </Button>
                </div>
            </div>
        );
    }

    const isCreator = address?.toLowerCase() === quest.creator.toLowerCase();
    const isExpired = Date.now() / 1000 > quest.deadline;
    const progress = Math.min((quest.qualifiersCount / quest.maxQualifiers) * 100, 100);
    const userEntry = entries.find((e) => e.solver.toLowerCase() === address?.toLowerCase());

    const getStatusColor = () => {
        if (quest.resolved) return "default";
        if (quest.cancelled) return "destructive";
        if (isExpired) return "destructive";
        if (quest.qualifiersCount >= quest.maxQualifiers) return "secondary";
        return "default";
    };

    const getStatusText = () => {
        if (quest.cancelled) return "Cancelled";
        if (quest.resolved) return "Completed";
        if (isExpired) return "Expired";
        if (quest.qualifiersCount >= quest.maxQualifiers) return "Full";
        return "Active";
    };

    return (
        <div className="min-h-dvh bg-slate-50 relative pt-20 sm:pt-24 pb-12">
            {/* Loading Overlay */}
            {(isPending || isConfirming) && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
                    <div className="p-8 sm:p-10 bg-white border border-slate-200 max-w-sm">
                        <div className="flex flex-col items-center gap-6">
                            <Loader2 className="size-10 sm:size-12 animate-spin text-[#0EA885]" />
                            <div className="text-center">
                                <p className="font-bold text-lg sm:text-xl mb-2 text-balance">
                                    {isPending ? "Waiting for approval..." : "Confirming transaction..."}
                                </p>
                                <p className="text-sm text-slate-600 text-pretty">
                                    Please don't close this page
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-6 text-slate-600">
                    <button onClick={() => router.push("/")} className="hover:text-[#0EA885]">
                        Home
                    </button>
                    <ChevronRight className="size-4" />
                    <button onClick={() => router.push("/dashboard")} className="hover:text-[#0EA885]">
                        Dashboard
                    </button>
                    <ChevronRight className="size-4" />
                    <span className="font-bold text-slate-900">Quest #{questId}</span>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT SIDEBAR - Sticky */}
                    <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
                        <div className="lg:sticky lg:top-24 space-y-4">
                            {/* Reward Card */}
                            <div className="bg-white border border-slate-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 bg-[#0EA885]/10 border border-[#0EA885]/20 flex items-center justify-center">
                                        <Gift className="size-5 text-[#0EA885]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-0.5">Reward Per User</p>
                                        <p className="text-2xl font-black text-slate-900 tabular-nums">{formatETH(quest.perQualifier)} ETH</p>
                                    </div>
                                </div>

                                {/* Submit Entry Button */}
                                {!isExpired && !quest.resolved && !quest.cancelled && quest.qualifiersCount < quest.maxQualifiers && !userEntry && (
                                    <Button
                                        onClick={() => {
                                            const submitSection = document.getElementById('submit-entry-section');
                                            submitSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold mb-3"
                                    >
                                        <Send className="size-4 mr-2" />
                                        Submit Entry
                                    </Button>
                                )}

                                <Button
                                    onClick={copyLink}
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-slate-200"
                                >
                                    {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                                    {copied ? "Copied!" : "Share"}
                                </Button>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-white border border-slate-200 p-6">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                                        <span className="text-xs font-bold text-slate-600">Status</span>
                                        <Badge className={`text-[10px] font-black uppercase tracking-wider border ${
                                            quest.resolved ? "bg-slate-100 text-slate-600 border-slate-200" :
                                            quest.cancelled ? "bg-slate-100 text-slate-400 border-slate-200" :
                                            isExpired ? "bg-slate-100 text-slate-400 border-slate-200" :
                                            "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20"
                                        }`}>
                                            {getStatusText()}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                                        <span className="text-xs font-bold text-slate-600">Participants</span>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{quest.qualifiersCount} / {quest.maxQualifiers}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                                        <span className="text-xs font-bold text-slate-600">Deadline</span>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{formatTimeLeft(BigInt(quest.deadline))}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-xs font-bold text-slate-600">Total Budget</span>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{formatETH(quest.totalAmount)} ETH</span>
                                    </div>
                                </div>
                            </div>

                            {/* Creator Info */}
                            <div className="bg-white border border-slate-200 p-6">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">Creator</h3>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <Shield className="size-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono font-bold text-slate-900">{formatAddress(quest.creator)}</p>
                                        {isCreator && (
                                            <Badge variant="outline" className="mt-1 text-[10px] border-slate-200">You</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT MAIN CONTENT */}
                    <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
                        {/* Hero Image */}
                        {quest.imageUrl && (
                            <div className="bg-white border border-slate-200 overflow-hidden">
                                <IpfsImage
                                    cid={quest.imageUrl.replace("ipfs://", "")}
                                    alt={quest.title}
                                    className="w-full h-auto max-h-96 object-cover"
                                />
                            </div>
                        )}

                        {/* Title Section */}
                        <div className="bg-white border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge className={`text-[10px] font-black uppercase tracking-wider border ${
                                    quest.resolved ? "bg-slate-100 text-slate-600 border-slate-200" :
                                    quest.cancelled ? "bg-slate-100 text-slate-400 border-slate-200" :
                                    isExpired ? "bg-slate-100 text-slate-400 border-slate-200" :
                                    "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20"
                                }`}>
                                    {getStatusText()}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Quest #{questId}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 text-balance">
                                {quest.title}
                            </h1>
                            <p className="text-sm text-slate-600 text-pretty">
                                Created by <span className="font-mono font-bold">{formatAddress(quest.creator)}</span>
                            </p>
                        </div>

                        {/* About This Quest */}
                        <div className="bg-white border border-slate-200 p-6">
                            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="size-5 text-[#0EA885]" />
                                About This Quest
                            </h2>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap text-pretty">
                                {quest.description.replace(/\n\nImage:.*$/, "")}
                            </p>
                        </div>

                        {/* Requirements */}
                        {quest.requirements && (
                            <div className="bg-white border border-slate-200 p-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="size-5 text-[#0EA885]" />
                                    Requirements
                                </h2>
                                <div className="space-y-2">
                                    {quest.requirements.split('\n').filter(req => req.trim()).map((req, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="size-5 bg-[#0EA885]/10 border border-[#0EA885]/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <div className="size-2 bg-[#0EA885]" />
                                            </div>
                                            <span className="text-sm text-slate-700 leading-relaxed text-pretty">{req}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User's Own Entry Status */}
                        {userEntry && (
                            <div className="bg-white border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Check className="size-5 text-[#0EA885]" />
                                        Your Submission
                                    </h2>
                                    <Badge className={`text-[10px] font-black uppercase tracking-wider border ${
                                        userEntry.status === 1
                                            ? "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20"
                                            : userEntry.status === 2
                                            ? "bg-slate-100 text-slate-600 border-slate-200"
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}>
                                        {userEntry.status === 1
                                            ? "Approved"
                                            : userEntry.status === 2
                                            ? "Rejected"
                                            : "Pending"}
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        {userEntry.ipfsProofCid.includes("twitter.com") ||
                                            userEntry.ipfsProofCid.includes("x.com") ? (
                                            <>
                                                <ExternalLink className="size-4 text-slate-600" />
                                                <span className="font-bold text-slate-700">X Post:</span>
                                                <a
                                                    href={userEntry.ipfsProofCid}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#0EA885] hover:text-[#0c8a6f] underline font-bold"
                                                >
                                                    View Post
                                                </a>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="size-4 text-slate-600" />
                                                <span className="font-bold text-slate-700">IPFS:</span>
                                                <span className="font-mono text-xs">{userEntry.ipfsProofCid}</span>
                                            </>
                                        )}
                                    </div>
                                    {userEntry.feedback && (
                                        <div className="p-3 bg-slate-50 border border-slate-200">
                                            <strong className="text-sm font-black text-slate-900">Feedback:</strong>
                                            <p className="text-sm text-slate-700 mt-1 text-pretty">
                                                {userEntry.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit Entry Section */}
                        {!isExpired && !quest.resolved && !quest.cancelled && quest.qualifiersCount < quest.maxQualifiers && !userEntry && (
                            <div id="submit-entry-section">
                                <div className="bg-white border border-slate-200 p-6">
                                    <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                                        <Send className="size-5 text-[#0EA885]" />
                                        Submit Your Entry
                                    </h2>
                                    <p className="text-sm text-slate-600 mb-6 text-pretty">
                                        Provide proof of your social media engagement to qualify for rewards
                                    </p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-900">X Post URL (Optional)</label>
                                            <Input
                                                type="url"
                                                placeholder="https://x.com/..."
                                                value={newEntry.twitterUrl}
                                                onChange={(e) =>
                                                    setNewEntry({ ...newEntry, twitterUrl: e.target.value })
                                                }
                                                className="text-sm border-slate-200"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-900">Upload Proof Image *</label>

                                            {!uploadedProofImage ? (
                                                <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 p-8 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setUploadedProofImage(file);
                                                                setNewEntry({ ...newEntry, ipfsProofCid: "" });
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id="proof-image-upload"
                                                    />
                                                    <label
                                                        htmlFor="proof-image-upload"
                                                        className="cursor-pointer flex flex-col items-center"
                                                    >
                                                        <Upload className="size-8 mb-3 text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-700 mb-1">
                                                            Click to upload proof
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            JPG, PNG, GIF up to 10MB
                                                        </span>
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <img
                                                        src={URL.createObjectURL(uploadedProofImage)}
                                                        alt="Proof preview"
                                                        className="w-full h-48 object-cover border border-slate-200"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => setUploadedProofImage(null)}
                                                        className="absolute -top-2 -right-2 size-8"
                                                        aria-label="Remove proof image"
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                    <div className="text-xs font-bold text-slate-600 mt-2 truncate">
                                                        {uploadedProofImage.name}
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-xs font-medium text-slate-500">
                                                Upload a screenshot or proof image (will be uploaded to IPFS)
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-900">Additional Notes (Optional)</label>
                                            <Textarea
                                                placeholder="Any additional information..."
                                                value={newEntry.description}
                                                onChange={(e) =>
                                                    setNewEntry({ ...newEntry, description: e.target.value })
                                                }
                                                rows={3}
                                                className="text-sm resize-none border-slate-200"
                                            />
                                        </div>

                                        <Button
                                            onClick={submitEntry}
                                            disabled={(!uploadedProofImage && !newEntry.ipfsProofCid.trim()) || isPending || isConfirming || isUploadingProof}
                                            className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-black py-6"
                                        >
                                            {isUploadingProof ? (
                                                <>
                                                    <Upload className="size-4 mr-2 animate-spin" />
                                                    Uploading to IPFS...
                                                </>
                                            ) : isPending || isConfirming ? (
                                                <>
                                                    <Clock className="size-4 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="size-4 mr-2" />
                                                    Submit Entry
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All Entries Section */}
                        {entries.length > 0 && (
                            <div className="bg-white border border-slate-200 p-6">
                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <Users className="size-5 text-[#0EA885]" />
                                    All Entries ({entries.length})
                                </h2>
                                <div className="space-y-3">
                                    {entries.map((entry, index) => (
                                        <div key={index} className="p-4 border border-slate-200 bg-slate-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="size-10 bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                            <Users className="size-5 text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold font-mono">{formatAddress(entry.solver)}</p>
                                                            <Badge className={`text-[10px] font-black uppercase tracking-wider border mt-1 ${
                                                                entry.status === 1
                                                                    ? "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20"
                                                                    : entry.status === 2
                                                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                                            }`}>
                                                                {entry.status === 1
                                                                    ? "Approved"
                                                                    : entry.status === 2
                                                                    ? "Rejected"
                                                                    : "Pending"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 ml-13">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                            {entry.ipfsProofCid.includes("twitter.com") ||
                                                                entry.ipfsProofCid.includes("x.com") ? (
                                                                <>
                                                                    <ExternalLink className="size-3" />
                                                                    <span>X Post:</span>
                                                                    <a
                                                                        href={entry.ipfsProofCid}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[#0EA885] hover:text-[#0c8a6f] underline"
                                                                    >
                                                                        View Post
                                                                    </a>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FileText className="size-3" />
                                                                    <span>IPFS: {entry.ipfsProofCid}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                            <Calendar className="size-3" />
                                                            <span>
                                                                Submitted: {new Date(entry.timestamp * 1000).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {entry.feedback && (
                                                            <div className="mt-2 p-2 bg-white border border-slate-200 text-xs">
                                                                <strong className="font-black">Feedback:</strong> {entry.feedback}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {!(entry.ipfsProofCid.includes("twitter.com") || entry.ipfsProofCid.includes("x.com")) && (
                                                    <Button variant="outline" size="sm" className="h-8 border-slate-200 font-bold" asChild>
                                                        <a
                                                            href={`https://ipfs.io/ipfs/${entry.ipfsProofCid}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label="View IPFS proof"
                                                        >
                                                            <ExternalLink className="size-3 mr-1" />
                                                            <span className="text-xs">View</span>
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transaction Status */}
                        {hash && (
                            <div className="bg-white border border-slate-200 p-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-900">Transaction Hash:</p>
                                    <a
                                        href={`https://shannon-explorer.somnia.network/tx/${hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#0EA885] hover:text-[#0c8a6f] font-mono text-xs break-all underline font-bold"
                                    >
                                        {hash}
                                    </a>
                                    {isConfirming && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                                            <Clock className="size-3 animate-spin" />
                                            Waiting for confirmation...
                                        </div>
                                    )}
                                    {isConfirmed && (
                                        <div className="flex items-center gap-2 text-xs text-[#0EA885] font-bold">
                                            <Check className="size-4" />
                                            Transaction confirmed!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
