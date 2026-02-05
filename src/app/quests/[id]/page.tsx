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
        <div className="min-h-dvh relative pt-20 sm:pt-24">
            {/* Loading Overlay */}
            {(isPending || isConfirming) && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="p-8 sm:p-10 shadow-2xl border border-white/60 bg-white/90 backdrop-blur-xl max-w-sm animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-4 bg-[#0EA885]/10">
                                <Loader2 className="size-10 sm:size-12 animate-spin text-[#0EA885]" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg sm:text-xl mb-2 text-balance">
                                    {isPending ? "Waiting for approval..." : "Confirming transaction..."}
                                </p>
                                <p className="text-sm text-muted-foreground text-pretty">
                                    Please don't close this page
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Breadcrumb */}
                <div className="mb-6 sm:mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        onClick={() => router.push("/")}
                                        className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium"
                                    >
                                        Home
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <ChevronRight className="size-4 text-foreground/40" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        onClick={() => router.push("/quests")}
                                        className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium"
                                    >
                                        Quests
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <ChevronRight className="size-4 text-foreground/40" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-sm font-semibold text-[#0EA885]">Quest #{questId}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT SIDEBAR - Sticky */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="lg:sticky lg:top-24 space-y-4">
                            {/* Reward Card */}
                            <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                                <CardContent className="p-6">
                                    <div className="text-center mb-6">
                                        <div className="inline-flex items-center justify-center size-16 bg-[#0EA885]/10 border-2 border-[#0EA885]/20 mb-4">
                                            <svg className="size-8 text-[#0EA885]" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.18-.76-6-5.08-6-9.5V8.5l6-3 6 3v2c0 4.42-2.82 8.74-6 9.5z"/>
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Reward Per User</p>
                                            <p className="text-4xl font-bold text-[#0EA885] tabular-nums">{formatETH(quest.perQualifier)}</p>
                                            <p className="text-sm text-muted-foreground font-semibold">ETH</p>
                                        </div>
                                    </div>

                                    {/* Submit Entry Button */}
                                    {!isExpired && !quest.resolved && !quest.cancelled && quest.qualifiersCount < quest.maxQualifiers && !userEntry && (
                                        <Button
                                            onClick={() => {
                                                const submitSection = document.getElementById('submit-entry-section');
                                                submitSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }}
                                            className="w-full bg-[#0EA885] hover:bg-[#0EA885]/90 text-white font-semibold py-6 text-base"
                                        >
                                            <Send className="size-5 mr-2" />
                                            Submit Entry
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Stats Card */}
                            <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-bold">Quest Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <Users className="size-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-muted-foreground">Participants</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold tabular-nums">{quest.qualifiersCount} / {quest.maxQualifiers}</span>
                                            <Progress value={progress} className="h-1 mt-1 w-20" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-muted-foreground">Deadline</span>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">{formatTimeLeft(BigInt(quest.deadline))}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <Coins className="size-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-muted-foreground">Total Budget</span>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">{formatETH(quest.totalAmount)} ETH</span>
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-2">
                                            <Target className="size-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                                        </div>
                                        <Badge className="bg-[#0EA885] hover:bg-[#0EA885]/90 text-white">{getStatusText()}</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Creator Info */}
                            <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-bold">Creator</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/30">
                                        <div className="size-10 bg-[#0EA885]/10 flex items-center justify-center border border-[#0EA885]/20">
                                            <Users className="size-5 text-[#0EA885]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-mono font-semibold">{formatAddress(quest.creator)}</p>
                                            {isCreator && (
                                                <Badge variant="outline" className="mt-1 text-xs h-5">You</Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Share Button */}
                            <Button
                                variant="outline"
                                onClick={copyLink}
                                className="w-full gap-2 border-white/60 bg-white/50 hover:bg-white/70"
                            >
                                {copied ? (
                                    <>
                                        <Check className="size-4" />
                                        <span className="font-medium">Link Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        <span className="font-medium">Share Quest</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT MAIN CONTENT */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Hero Image */}
                        {quest.imageUrl && (
                            <div className="w-full overflow-hidden border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                                <IpfsImage
                                    cid={quest.imageUrl.replace("ipfs://", "")}
                                    alt={quest.title}
                                    className="w-full h-auto max-h-96 object-cover"
                                />
                            </div>
                        )}

                        {/* Title Section */}
                        <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-[#0EA885]/10 flex items-center justify-center border-2 border-[#0EA885]/20 shrink-0">
                                        <Gift className="size-6 text-[#0EA885]" />
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-balance">
                                            {quest.title}
                                        </h1>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Badge className="bg-[#0EA885] hover:bg-[#0EA885]/90 text-white text-xs">{getStatusText()}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Quest #{questId}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* About This Quest */}
                        <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="size-5 text-[#0EA885]" />
                                    About This Quest
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                    {quest.description.replace(/\n\nImage:.*$/, "")}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        {quest.requirements && (
                            <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <CheckCircle2 className="size-5 text-[#0EA885]" />
                                        Requirements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {quest.requirements.split('\n').filter(req => req.trim()).map((req, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="size-5 bg-[#0EA885]/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <div className="size-2 bg-[#0EA885]" />
                                                </div>
                                                <span className="text-sm text-foreground/80 leading-relaxed">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* User's Own Entry Status */}
                        {userEntry && (
                            <Card className={`border shadow-lg ${
                                userEntry.status === 1
                                    ? "border-green-300 bg-green-50/70"
                                    : userEntry.status === 2
                                    ? "border-red-300 bg-red-50/70"
                                    : "border-blue-300 bg-blue-50/70"
                            } backdrop-blur-xl`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Check className="size-5" />
                                        Your Submission
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Status:{" "}
                                        <Badge
                                            variant={
                                                userEntry.status === 1
                                                    ? "default"
                                                    : userEntry.status === 2
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                        >
                                            {userEntry.status === 1
                                                ? "Approved"
                                                : userEntry.status === 2
                                                ? "Rejected"
                                                : "Pending"}
                                        </Badge>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            {userEntry.ipfsProofCid.includes("twitter.com") ||
                                                userEntry.ipfsProofCid.includes("x.com") ? (
                                                <>
                                                    <ExternalLink className="size-4 text-muted-foreground" />
                                                    <span className="text-sm">X Post: </span>
                                                    <a
                                                        href={userEntry.ipfsProofCid}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        View Post
                                                    </a>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="size-4 text-muted-foreground" />
                                                    <span className="text-sm">IPFS: {userEntry.ipfsProofCid}</span>
                                                </>
                                            )}
                                        </div>
                                        {userEntry.feedback && (
                                            <div className="p-3 bg-white border">
                                                <strong className="text-sm">Feedback:</strong>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {userEntry.feedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Submit Entry Section */}
                        {!isExpired && !quest.resolved && !quest.cancelled && quest.qualifiersCount < quest.maxQualifiers && !userEntry && (
                            <div id="submit-entry-section">
                                <Card className="border border-[#0EA885]/30 bg-[#0EA885]/5 backdrop-blur-xl shadow-lg">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Send className="size-5 text-[#0EA885]" />
                                            Submit Your Entry
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Provide proof of your social media engagement to qualify for rewards
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="twitterUrl" className="text-sm font-semibold">X Post URL (Optional)</Label>
                                                <div className="relative">
                                                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                                                    <Input
                                                        id="twitterUrl"
                                                        type="url"
                                                        placeholder="https://x.com/..."
                                                        value={newEntry.twitterUrl}
                                                        onChange={(e) =>
                                                            setNewEntry({ ...newEntry, twitterUrl: e.target.value })
                                                        }
                                                        className="pl-10 text-sm h-10 border-border bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="proofImage" className="text-sm font-semibold">Upload Proof Image *</Label>

                                                {!uploadedProofImage ? (
                                                    <div className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 p-6 transition-colors bg-white">
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
                                                            className="cursor-pointer flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <div className="size-12 mb-3 bg-muted flex items-center justify-center">
                                                                <Upload className="size-6" />
                                                            </div>
                                                            <span className="text-sm font-medium mb-1">
                                                                Click to upload proof
                                                            </span>
                                                            <span className="text-xs text-center">
                                                                JPG, PNG, GIF up to 10MB
                                                            </span>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="relative group">
                                                        <img
                                                            src={URL.createObjectURL(uploadedProofImage)}
                                                            alt="Proof preview"
                                                            className="w-full h-48 object-cover border"
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
                                                        <div className="text-xs text-muted-foreground mt-2 truncate">
                                                            {uploadedProofImage.name}
                                                        </div>
                                                    </div>
                                                )}

                                                <p className="text-xs text-muted-foreground">
                                                    Upload a screenshot or proof image (will be uploaded to IPFS)
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="notes" className="text-sm font-semibold">Additional Notes (Optional)</Label>
                                                <Textarea
                                                    id="notes"
                                                    placeholder="Any additional information..."
                                                    value={newEntry.description}
                                                    onChange={(e) =>
                                                        setNewEntry({ ...newEntry, description: e.target.value })
                                                    }
                                                    rows={3}
                                                    className="text-sm resize-none border-border bg-white"
                                                />
                                            </div>

                                            <Button
                                                onClick={submitEntry}
                                                disabled={(!uploadedProofImage && !newEntry.ipfsProofCid.trim()) || isPending || isConfirming || isUploadingProof}
                                                className="w-full bg-[#0EA885] hover:bg-[#0EA885]/90 text-white font-semibold py-6"
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
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* All Entries Section */}
                        {entries.length > 0 && (
                            <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="size-5 text-[#0EA885]" />
                                        All Entries ({entries.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {entries.map((entry, index) => (
                                            <div key={index} className="p-4 border bg-white border-border">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="size-10 bg-[#0EA885]/10 flex items-center justify-center border border-[#0EA885]/20">
                                                                <Users className="size-5 text-[#0EA885]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold">{formatAddress(entry.solver)}</p>
                                                                <Badge
                                                                    variant={
                                                                        entry.status === 1
                                                                            ? "default"
                                                                            : entry.status === 2
                                                                            ? "destructive"
                                                                            : "secondary"
                                                                    }
                                                                    className="text-xs mt-1"
                                                                >
                                                                    {entry.status === 1
                                                                        ? "Approved"
                                                                        : entry.status === 2
                                                                        ? "Rejected"
                                                                        : "Pending"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 ml-13">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                {entry.ipfsProofCid.includes("twitter.com") ||
                                                                    entry.ipfsProofCid.includes("x.com") ? (
                                                                    <>
                                                                        <ExternalLink className="size-3" />
                                                                        <span>X Post: </span>
                                                                        <a
                                                                            href={entry.ipfsProofCid}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:text-blue-800 underline"
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
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Calendar className="size-3" />
                                                                <span>
                                                                    Submitted: {new Date(entry.timestamp * 1000).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {entry.feedback && (
                                                                <div className="mt-2 p-2 bg-muted border text-xs">
                                                                    <strong>Feedback:</strong> {entry.feedback}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!(entry.ipfsProofCid.includes("twitter.com") || entry.ipfsProofCid.includes("x.com")) && (
                                                        <Button variant="outline" size="sm" className="h-8 border-border" asChild>
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
                                </CardContent>
                            </Card>
                        )}

                        {/* Transaction Status */}
                        {hash && (
                            <Card className="border border-blue-300 bg-blue-50/70 backdrop-blur-xl shadow-lg">
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold">Transaction Hash:</p>
                                        <a
                                            href={`https://shannon-explorer.somnia.network/tx/${hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all underline"
                                        >
                                            {hash}
                                        </a>
                                        {isConfirming && (
                                            <div className="flex items-center gap-2 text-xs text-blue-600">
                                                <Clock className="size-3 animate-spin" />
                                                Waiting for confirmation...
                                            </div>
                                        )}
                                        {isConfirmed && (
                                            <div className="flex items-center gap-2 text-xs text-green-600">
                                                <Check className="size-4" />
                                                Transaction confirmed!
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
