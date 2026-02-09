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
  QUINTY_ABI,
  BASE_SEPOLIA_CHAIN_ID,
  BountyStatus,
} from "../../../utils/contracts";
import {
  formatETH,
  formatTimeLeft,
  formatAddress,
  wagmiConfig,
} from "../../../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata, uploadToIpfs } from "../../../utils/ipfs";
import { getEthPriceInUSD, convertEthToUSD, formatUSD } from "../../../utils/prices";
import { WalletName } from "../../../components/WalletName";
import { useAlert } from "../../../hooks/useAlert";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Alert, AlertDescription } from "../../../components/ui/alert";
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
  Trophy,
  ExternalLink,
  Copy,
  Check,
  Target,
  Shield,
  Send,
  Loader2,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Package,
  AlertTriangle,
  Gavel,
  Zap,
  TrendingUp,
  Timer,
  Layers,
} from "lucide-react";
import ethIcon from "../../../assets/crypto/eth.svg";

interface Submission {
  submitter: string;
  ipfsCid: string;
  socialHandle: string;
  deposit: bigint;
  timestamp: bigint;
}

interface Bounty {
  id: number;
  creator: string;
  title: string;
  description: string;
  amount: bigint;
  openDeadline: bigint;
  judgingDeadline: bigint;
  slashPercent: bigint;
  status: BountyStatus;
  selectedWinner: string;
  selectedSubmissionId: bigint;
  submissionCount: number;
  totalDeposits: bigint;
  submissions: Submission[];
  metadataCid?: string;
}

function getCurrentPhase(bounty: Bounty): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (bounty.status === BountyStatus.RESOLVED) return "RESOLVED";
  if (bounty.status === BountyStatus.SLASHED) return "SLASHED";
  if (now <= bounty.openDeadline) return "OPEN";
  if (now <= bounty.judgingDeadline) return "JUDGING";
  return "SLASH_PENDING";
}

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const { showAlert } = useAlert();
  const bountyId = params.id as string;

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socialHandle, setSocialHandle] = useState("");
  const [copied, setCopied] = useState(false);
  const [viewingCid, setViewingCid] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState<string>("");
  const [uploadedSolutionImage, setUploadedSolutionImage] = useState<File | null>(null);
  const [isUploadingSolution, setIsUploadingSolution] = useState(false);
  const [requiredDeposit, setRequiredDeposit] = useState<bigint>(BigInt(0));
  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
  const [hasUserSubmitted, setHasUserSubmitted] = useState(false);
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

  const loadBounty = async () => {
    try {
      setIsLoading(true);
      const bountyData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getBounty",
        args: [BigInt(bountyId)],
      }) as any[];

      if (bountyData) {
        const [creator, title, description, amount, openDeadline, judgingDeadline, slashPercent, status, selectedWinner, selectedSubmissionId, submissionCount, totalDeposits] = bountyData;

        const submissions = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getAllSubmissions",
          args: [BigInt(bountyId)],
        }) as Submission[];

        const deposit = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getRequiredDeposit",
          args: [BigInt(bountyId)],
        }) as bigint;
        setRequiredDeposit(deposit);

        if (address) {
          const hasSubmitted = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "hasUserSubmitted",
            args: [BigInt(bountyId), address],
          }) as boolean;
          setHasUserSubmitted(hasSubmitted);
        }

        const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
        const metadataCid = metadataMatch ? metadataMatch[1] : undefined;

        setBounty({
          id: parseInt(bountyId), creator, title, description, amount, openDeadline, judgingDeadline, slashPercent,
          status: Number(status) as BountyStatus, selectedWinner, selectedSubmissionId,
          submissionCount: Number(submissionCount), totalDeposits, submissions: submissions as Submission[], metadataCid,
        });

        if (metadataCid) {
          try {
            const meta = await fetchMetadataFromIpfs(metadataCid);
            setMetadata(meta);
          } catch (error) {
            console.error("Failed to load metadata:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading bounty:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (bountyId) loadBounty(); }, [bountyId, address]);
  useEffect(() => { if (isConfirmed) loadBounty(); }, [isConfirmed]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitSolution = async () => {
    if (!bounty || !uploadedSolutionImage) {
      showAlert({ title: "Missing Information", description: "Please upload a solution image" });
      return;
    }
    if (!socialHandle.trim()) {
      showAlert({ title: "Missing Information", description: "Please enter your social handle" });
      return;
    }

    try {
      setIsUploadingSolution(true);
      const solutionCid = await uploadToIpfs(uploadedSolutionImage, { bountyId, type: "bounty-solution" });
      const handle = socialHandle.replace('@', '');

      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "submitToBounty",
        args: [BigInt(bountyId), solutionCid, handle],
        value: requiredDeposit,
      });

      setUploadedSolutionImage(null);
      setSocialHandle("");
      setShowSubmitForm(false);
    } catch (error) {
      console.error("Error submitting solution:", error);
      showAlert({ title: "Submission Failed", description: "Failed to submit solution. Please try again." });
    } finally {
      setIsUploadingSolution(false);
    }
  };

  const selectWinner = async () => {
    if (selectedWinnerId === null) return;
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "selectWinner",
      args: [BigInt(bountyId), BigInt(selectedWinnerId)],
    });
  };

  const triggerSlash = async () => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "triggerSlash",
      args: [BigInt(bountyId)],
    });
  };

  const refundNoSubmissions = async () => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "refundNoSubmissions",
      args: [BigInt(bountyId)],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-[#0EA885]" />
          <p className="text-stone-500 mt-4 text-sm">Loading bounty...</p>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-3">Bounty not found</h2>
          <p className="text-sm text-stone-500 mb-6">The bounty you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-stone-900 hover:bg-stone-800">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isCreator = address?.toLowerCase() === bounty.creator.toLowerCase();
  const phase = getCurrentPhase(bounty);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const canSubmit = phase === "OPEN" && !isCreator && !hasUserSubmitted;
  const canSelectWinner = isCreator && (phase === "JUDGING" || (phase === "OPEN" && now > bounty.openDeadline));
  const canSlash = phase === "SLASH_PENDING" && bounty.submissionCount > 0;
  const canRefund = phase === "SLASH_PENDING" && bounty.submissionCount === 0 && isCreator;

  const ethAmount = Number(bounty.amount) / 1e18;
  const usdAmount = ethPrice > 0 ? convertEthToUSD(ethAmount, ethPrice) : 0;
  const depositEth = Number(requiredDeposit) / 1e18;

  const getPhaseConfig = () => {
    switch (phase) {
      case "OPEN": return { label: "Open", color: "bg-emerald-500", textColor: "text-emerald-600", bgColor: "bg-emerald-50" };
      case "JUDGING": return { label: "Judging", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" };
      case "RESOLVED": return { label: "Completed", color: "bg-stone-400", textColor: "text-stone-500", bgColor: "bg-stone-100" };
      case "SLASHED": return { label: "Slashed", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" };
      case "SLASH_PENDING": return { label: "Slash Pending", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" };
      default: return { label: "Unknown", color: "bg-stone-400", textColor: "text-stone-500", bgColor: "bg-stone-100" };
    }
  };

  const phaseConfig = getPhaseConfig();

  return (
    <div className="min-h-dvh bg-stone-50 relative pt-20 pb-16">
      {/* Loading Overlay */}
      {(isPending || isConfirming) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 shadow-2xl max-w-sm text-center">
            <Loader2 className="size-10 animate-spin mx-auto text-[#0EA885]" />
            <p className="font-semibold text-lg mt-4 text-stone-800">{isPending ? "Waiting for approval..." : "Confirming..."}</p>
            <p className="text-sm text-stone-500 mt-1">Please don't close this page</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 text-stone-400">
          <button onClick={() => router.push("/")} className="hover:text-[#0EA885]">Home</button>
          <ChevronRight className="size-4" />
          <button onClick={() => router.push("/dashboard")} className="hover:text-[#0EA885]">Dashboard</button>
          <ChevronRight className="size-4" />
          <span className="text-stone-700 font-medium">Bounty #{bountyId}</span>
        </div>

        {/* Type indicator bar */}
        <div className="h-1.5 w-full bg-[#0EA885] mb-6" />

        {/* Creator Banner */}
        {isCreator && (
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-white/20 flex items-center justify-center">
                <Shield className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold">You created this bounty</p>
                <p className="text-sm text-white/80">
                  {phase === "OPEN" && `Wait until ${new Date(Number(bounty.openDeadline) * 1000).toLocaleString()} to select a winner`}
                  {phase === "JUDGING" && `Select a winner before ${new Date(Number(bounty.judgingDeadline) * 1000).toLocaleString()}`}
                  {phase === "RESOLVED" && "Winner has been selected"}
                  {phase === "SLASHED" && "This bounty was slashed"}
                  {phase === "SLASH_PENDING" && "Deadline passed! Select a winner now or get slashed"}
                </p>
              </div>
              {phase === "OPEN" && (
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase tracking-wider">Judging starts in</p>
                  <p className="font-bold">{formatTimeLeft(bounty.openDeadline)}</p>
                </div>
              )}
              {phase === "JUDGING" && (
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase tracking-wider">Time to judge</p>
                  <p className="font-bold">{formatTimeLeft(bounty.judgingDeadline)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - Important Info (Sticky) */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              
              {/* REWARD CARD - The Big Highlight */}
              <div className="bg-gradient-to-br from-emerald-500 via-[#0EA885] to-teal-600 p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="size-5 text-white/80" />
                  <span className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Bounty Reward</span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <Image src={ethIcon} alt="ETH" width={32} height={32} className="flex-shrink-0" />
                  <span className="text-4xl font-bold tabular-nums">{ethAmount.toFixed(4)}</span>
                  <span className="text-xl text-white/60">ETH</span>
                </div>
                {ethPrice > 0 && (
                  <p className="text-emerald-100 text-sm flex items-center gap-1 mt-2">
                    <TrendingUp className="size-3" />
                    ≈ {formatUSD(usdAmount)}
                  </p>
                )}

                {/* CTA */}
                <div className="mt-5 space-y-2">
                  {canSubmit && (
                    <Button onClick={() => setShowSubmitForm(true)} className="w-full bg-white text-[#0EA885] hover:bg-emerald-50 font-semibold h-11 shadow-md">
                      <Send className="size-4 mr-2" />
                      Submit Solution
                    </Button>
                  )}
                  {canSlash && (
                    <Button onClick={triggerSlash} disabled={isPending || isConfirming} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold h-10">
                      <Zap className="size-4 mr-2" />
                      Trigger Slash ({Number(bounty.slashPercent) / 100}%)
                    </Button>
                  )}
                  {canRefund && (
                    <Button onClick={refundNoSubmissions} disabled={isPending || isConfirming} className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold h-10">
                      Claim Refund
                    </Button>
                  )}
                </div>
              </div>

              {/* STATS - Eye-catching */}
              <div className="bg-white border border-stone-200 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-stone-100">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Timer className="size-3.5 text-amber-500" />
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider">Submit By</span>
                    </div>
                    <p className="text-sm font-bold text-stone-800">{formatTimeLeft(bounty.openDeadline)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Gavel className="size-3.5 text-violet-500" />
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider">Judge By</span>
                    </div>
                    <p className="text-sm font-bold text-stone-800">{formatTimeLeft(bounty.judgingDeadline)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-stone-100 border-t border-stone-100">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Users className="size-3.5 text-blue-500" />
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider">Entries</span>
                    </div>
                    <p className="text-sm font-bold text-stone-800">{bounty.submissionCount}</p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Layers className="size-3.5 text-red-500" />
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider">Slash</span>
                    </div>
                    <p className="text-sm font-bold text-red-500">{Number(bounty.slashPercent) / 100}%</p>
                  </div>
                </div>
              </div>

              {/* Status & Deposit */}
              <div className="bg-white border border-stone-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-stone-500">Status</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 ${phaseConfig.bgColor} ${phaseConfig.textColor}`}>
                    {phaseConfig.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Deposit</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-stone-800">{depositEth.toFixed(4)} ETH</span>
                    {ethPrice > 0 && (
                      <span className="text-[10px] text-stone-400 ml-1">({formatUSD(convertEthToUSD(depositEth, ethPrice))})</span>
                    )}
                  </div>
                </div>
                {metadata?.skills && metadata.skills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="flex flex-wrap gap-1">
                      {metadata.skills.map((skill, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Creator */}
              <div className="bg-white border border-stone-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-stone-100 flex items-center justify-center">
                    <Shield className="size-5 text-stone-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400">Creator</p>
                    <p className="text-sm font-medium text-stone-700"><WalletName address={bounty.creator} /></p>
                  </div>
                  {isCreator && <span className="text-[10px] font-medium px-2 py-0.5 bg-[#0EA885]/10 text-[#0EA885]">You</span>}
                </div>
              </div>

              {/* Share & User Status */}
              <div className="space-y-2">
                <Button onClick={copyLink} variant="outline" className="w-full border-stone-200 text-stone-600 h-10">
                  {copied ? <Check className="size-4 mr-2 text-green-500" /> : <Copy className="size-4 mr-2" />}
                  {copied ? "Copied!" : "Share Bounty"}
                </Button>
                {hasUserSubmitted && phase === "OPEN" && (
                  <div className="text-center p-3 bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="size-5 text-[#0EA885] mx-auto mb-1" />
                    <p className="text-xs text-[#0EA885] font-medium">You've submitted!</p>
                  </div>
                )}
              </div>

              {/* Transaction */}
              {hash && (
                <div className="bg-white border border-stone-200 p-4">
                  <p className="text-xs font-semibold text-stone-700 mb-2">Transaction</p>
                  <a href={`https://sepolia-explorer.base.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-[#0EA885] text-xs font-mono break-all hover:underline">
                    {hash.slice(0, 20)}...
                  </a>
                  {isConfirming && <p className="text-xs text-stone-500 mt-2 flex items-center gap-1"><Clock className="size-3 animate-spin" /> Confirming...</p>}
                  {isConfirmed && <p className="text-xs text-[#0EA885] mt-2 flex items-center gap-1"><Check className="size-4" /> Confirmed!</p>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT - Details */}
          <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
            
            {/* Slash Warning */}
            {canSlash && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="size-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">
                  Creator missed the judging deadline! Trigger slash to distribute {Number(bounty.slashPercent) / 100}% to submitters.
                </AlertDescription>
              </Alert>
            )}

            {/* Hero Image */}
            {metadata?.images && metadata.images.length > 0 && (
              <div className="bg-white border border-stone-200 overflow-hidden">
                <img
                  src={`https://purple-elderly-silverfish-382.mypinata.cloud/ipfs/${metadata.images[0]}`}
                  alt={metadata.title}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            )}

            {/* Title Section */}
            <div className="bg-white border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0EA885]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Bounty</span>
                </div>
                <span className="text-stone-300">•</span>
                <span className="text-[11px] text-stone-400">#{bountyId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {metadata?.title || bounty.title || bounty.description.split("\n")[0]}
              </h1>
            </div>

            {/* About + Requirements + Deliverables (Combined) */}
            <div className="bg-white border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <FileText className="size-5 text-[#0EA885]" />
                About This Bounty
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                {metadata?.description || bounty.description.replace(/\n\nMetadata:.*$/, "")}
              </p>

              {metadata?.requirements && metadata.requirements.length > 0 && (
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#0EA885]" />
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {metadata.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <div className="w-1.5 h-1.5 bg-[#0EA885] mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {metadata?.deliverables && metadata.deliverables.length > 0 && (
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <Package className="size-4 text-[#0EA885]" />
                    Deliverables
                  </h3>
                  <ul className="space-y-2">
                    {metadata.deliverables.map((del, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <div className="w-1.5 h-1.5 bg-[#0EA885] mt-2 flex-shrink-0" />
                        {del}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Winner Display */}
            {bounty.status === BountyStatus.RESOLVED && bounty.selectedWinner !== "0x0000000000000000000000000000000000000000" && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-amber-100 flex items-center justify-center text-2xl">🏆</div>
                    <div>
                      <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Winner</p>
                      <p className="font-bold text-stone-800"><WalletName address={bounty.selectedWinner} /></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#0EA885]">{ethAmount.toFixed(4)} ETH</p>
                    {ethPrice > 0 && <p className="text-sm text-stone-500">{formatUSD(usdAmount)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Slashed Display */}
            {bounty.status === BountyStatus.SLASHED && (
              <div className="bg-red-50 border border-red-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="size-5 text-red-600" />
                  <h3 className="font-semibold text-red-700">Bounty Slashed</h3>
                </div>
                <p className="text-sm text-red-600">
                  The creator missed the judging deadline. {Number(bounty.slashPercent) / 100}% was distributed to submitters.
                </p>
              </div>
            )}

            {/* Submissions List */}
            {bounty.submissions.length > 0 && (
              <div className="bg-white border border-stone-200 p-6">
                <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Users className="size-5 text-[#0EA885]" />
                  Submissions ({bounty.submissions.length})
                </h2>
                <div className="space-y-3">
                  {bounty.submissions.map((sub, index) => {
                    const isWinner = bounty.selectedWinner.toLowerCase() === sub.submitter.toLowerCase() && Number(bounty.selectedSubmissionId) === index;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 border transition-all ${
                          isWinner ? "bg-amber-50 border-amber-200" : "border-stone-100 hover:border-stone-200"
                        } ${canSelectWinner ? "cursor-pointer" : ""} ${selectedWinnerId === index ? "ring-2 ring-[#0EA885]" : ""}`}
                        onClick={() => canSelectWinner && setSelectedWinnerId(selectedWinnerId === index ? null : index)}
                      >
                        <div className="flex items-center gap-3">
                          {canSelectWinner && (
                            <div className={`size-5 border-2 flex items-center justify-center ${selectedWinnerId === index ? "border-[#0EA885] bg-[#0EA885]" : "border-stone-300"}`}>
                              {selectedWinnerId === index && <Check className="size-3 text-white" />}
                            </div>
                          )}
                          {isWinner && <span className="text-xs font-semibold bg-[#0EA885] text-white px-2 py-0.5">🏆 Winner</span>}
                          <div>
                            <p className="text-sm font-medium text-stone-700"><WalletName address={sub.submitter} /></p>
                            <p className="text-xs text-stone-400">@{sub.socialHandle} • {formatETH(sub.deposit)} ETH deposit</p>
                          </div>
                        </div>
                        <Button
                          variant="outline" size="sm"
                          onClick={(e) => { e.stopPropagation(); setViewingCid(sub.ipfsCid); setViewingTitle(`Submission by ${formatAddress(sub.submitter)}`); }}
                          className="border-stone-200 text-stone-600 h-8"
                        >
                          <ExternalLink className="size-3 mr-1" /> View
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {canSelectWinner && selectedWinnerId !== null && (
                  <Button onClick={selectWinner} disabled={isPending || isConfirming} className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-semibold h-11 mt-4">
                    <Trophy className="size-4 mr-2" /> Select as Winner
                  </Button>
                )}
                {canSelectWinner && (
                  <Alert className="mt-4 border-amber-100 bg-amber-50">
                    <Gavel className="size-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm">
                      Select a winner before {new Date(Number(bounty.judgingDeadline) * 1000).toLocaleString()} or be slashed.
                    </AlertDescription>
                  </Alert>
                )}
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
              <Send className="size-5 text-[#0EA885]" />
              Submit Solution
            </DialogTitle>
            <DialogDescription>
              Deposit {depositEth.toFixed(4)} ETH • Refunded when winner selected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1.5 block">Social Handle</label>
              <Input placeholder="@username" value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} className="h-10 border-stone-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1.5 block">Solution Image</label>
              {!uploadedSolutionImage ? (
                <div className="border-2 border-dashed border-stone-200 hover:border-[#0EA885]/50 bg-stone-50 p-6 text-center cursor-pointer transition-colors">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setUploadedSolutionImage(e.target.files[0])} className="hidden" id="solution-upload" />
                  <label htmlFor="solution-upload" className="cursor-pointer">
                    <Upload className="size-6 mx-auto mb-2 text-stone-400" />
                    <p className="text-sm text-stone-600">Click to upload</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img src={URL.createObjectURL(uploadedSolutionImage)} alt="Preview" className="w-full h-32 object-cover border border-stone-200" />
                  <Button type="button" variant="destructive" size="icon" onClick={() => setUploadedSolutionImage(null)} className="absolute -top-2 -right-2 size-6">
                    <X className="size-3" />
                  </Button>
                </div>
              )}
            </div>
            <Button
              onClick={submitSolution}
              disabled={isPending || isConfirming || isUploadingSolution || !uploadedSolutionImage || !socialHandle.trim()}
              className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-semibold h-11"
            >
              {isUploadingSolution ? "Uploading..." : isPending || isConfirming ? "Submitting..." : `Submit (${depositEth.toFixed(4)} ETH)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* IPFS Viewer */}
      <Dialog open={!!viewingCid} onOpenChange={() => setViewingCid(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewingTitle}</DialogTitle>
          </DialogHeader>
          {viewingCid && (
            <div className="mt-4">
              <img src={`https://purple-elderly-silverfish-382.mypinata.cloud/ipfs/${viewingCid}`} alt="Submission" className="w-full max-h-96 object-contain border border-stone-200" />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a href={`https://ipfs.io/ipfs/${viewingCid}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3 mr-2" /> Open
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`https://ipfs.io/ipfs/${viewingCid}`); showAlert({ title: "Copied!", description: "Link copied" }); }} className="flex-1">
                  <Copy className="size-3 mr-2" /> Copy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
