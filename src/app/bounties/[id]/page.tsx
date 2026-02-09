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
import { useAlert } from "../../../hooks/useAlert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
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
} from "lucide-react";

// New interface matching the updated contract
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

// Phase helper
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

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Load bounty data using new contract interface
  const loadBounty = async () => {
    try {
      setIsLoading(true);
      
      // Get bounty data using new getBounty function
      const bountyData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getBounty",
        args: [BigInt(bountyId)],
      }) as any[];

      if (bountyData) {
        const [
          creator,
          title,
          description,
          amount,
          openDeadline,
          judgingDeadline,
          slashPercent,
          status,
          selectedWinner,
          selectedSubmissionId,
          submissionCount,
          totalDeposits,
        ] = bountyData;

        // Get all submissions using new getAllSubmissions function
        const submissions = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getAllSubmissions",
          args: [BigInt(bountyId)],
        }) as Submission[];

        // Get required deposit amount
        const deposit = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getRequiredDeposit",
          args: [BigInt(bountyId)],
        }) as bigint;
        setRequiredDeposit(deposit);

        // Check if current user has submitted
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
          id: parseInt(bountyId),
          creator,
          title,
          description,
          amount,
          openDeadline,
          judgingDeadline,
          slashPercent,
          status: Number(status) as BountyStatus,
          selectedWinner,
          selectedSubmissionId,
          submissionCount: Number(submissionCount),
          totalDeposits,
          submissions: submissions as Submission[],
          metadataCid,
        });

        // Load metadata
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

  useEffect(() => {
    if (bountyId) {
      loadBounty();
    }
  }, [bountyId, address]);

  useEffect(() => {
    if (isConfirmed) {
      loadBounty();
    }
  }, [isConfirmed]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit solution with 1% deposit
  const submitSolution = async () => {
    if (!bounty || !uploadedSolutionImage) {
      showAlert({
        title: "Missing Information",
        description: "Please upload a solution image",
      });
      return;
    }

    if (!socialHandle.trim()) {
      showAlert({
        title: "Missing Information",
        description: "Please enter your social handle",
      });
      return;
    }

    try {
      let solutionCid = "";

      // Upload image to IPFS if a file is selected
      if (uploadedSolutionImage) {
        setIsUploadingSolution(true);
        try {
          solutionCid = await uploadToIpfs(uploadedSolutionImage, {
            bountyId: bountyId,
            type: "bounty-solution",
          });
          console.log("Solution uploaded to IPFS:", solutionCid);
        } catch (uploadError) {
          console.error("Error uploading solution to IPFS:", uploadError);
          showAlert({
            title: "Upload Failed",
            description: "Failed to upload solution to IPFS. Please try again.",
          });
          setIsUploadingSolution(false);
          return;
        } finally {
          setIsUploadingSolution(false);
        }
      }

      // Use the manually entered social handle
      const handle = socialHandle.replace('@', '');

      console.log("Submitting with deposit:", requiredDeposit.toString());
      console.log("Using social handle:", handle);

      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "submitToBounty",
        args: [BigInt(bountyId), solutionCid, handle],
        value: requiredDeposit,
      });

      setUploadedSolutionImage(null);
      setSocialHandle("");
    } catch (error) {
      console.error("Error submitting solution:", error);
      showAlert({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit solution. Please try again.",
      });
    }
  };

  // Select winner (creator only, during judging phase)
  const selectWinner = async () => {
    if (selectedWinnerId === null) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "selectWinner",
        args: [BigInt(bountyId), BigInt(selectedWinnerId)],
      });
    } catch (error) {
      console.error("Error selecting winner:", error);
    }
  };

  // Trigger slash (anyone can call after judging deadline)
  const triggerSlash = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "triggerSlash",
        args: [BigInt(bountyId)],
      });
    } catch (error) {
      console.error("Error triggering slash:", error);
    }
  };

  // Refund if no submissions
  const refundNoSubmissions = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "refundNoSubmissions",
        args: [BigInt(bountyId)],
      });
    } catch (error) {
      console.error("Error refunding:", error);
    }
  };

  const openCidViewer = (cid: string, title: string) => {
    setViewingCid(cid);
    setViewingTitle(title);
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin mx-auto text-[#0EA885] mb-4" />
          <p className="text-sm text-slate-600 text-pretty">Loading bounty...</p>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-3 text-balance">Bounty not found</h2>
          <p className="text-sm text-slate-600 mb-6 text-pretty">
            The bounty you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800"
          >
            Back to Dashboard
          </Button>
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

  const getPhaseLabel = () => {
    switch (phase) {
      case "OPEN": return "Open for Submissions";
      case "JUDGING": return "Judging Phase";
      case "RESOLVED": return "Completed";
      case "SLASHED": return "Creator Slashed";
      case "SLASH_PENDING": return "Slash Pending";
      default: return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (phase) {
      case "OPEN": return "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20";
      case "JUDGING": return "bg-amber-50 text-amber-600 border-amber-200";
      case "RESOLVED": return "bg-slate-100 text-slate-600 border-slate-200";
      case "SLASHED": return "bg-red-50 text-red-600 border-red-200";
      case "SLASH_PENDING": return "bg-red-50 text-red-600 border-red-200";
      default: return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 relative">
      {/* Loading Overlay */}
      {(isPending || isConfirming) && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white p-8 border border-slate-200 max-w-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-12 animate-spin text-[#0EA885]" />
              <div className="text-center">
                <p className="font-bold text-lg mb-2 text-balance">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">
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
          <span className="font-bold text-slate-900">Bounty #{bountyId}</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Reward Card */}
              <div className="bg-white border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 bg-[#0EA885]/10 border border-[#0EA885]/20 flex items-center justify-center">
                    <Target className="size-5 text-[#0EA885]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-0.5">Bounty Reward</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{formatETH(bounty.amount)} ETH</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {canSubmit && (
                  <Button
                    onClick={() => {
                      const submitSection = document.getElementById('submit-solution-section');
                      submitSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold mb-3"
                  >
                    <Send className="size-4 mr-2" />
                    Submit Solution ({formatETH(requiredDeposit)} ETH deposit)
                  </Button>
                )}

                {canSlash && (
                  <Button
                    onClick={triggerSlash}
                    disabled={isPending || isConfirming}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold mb-3"
                  >
                    <Zap className="size-4 mr-2" />
                    Trigger Slash ({Number(bounty.slashPercent) / 100}%)
                  </Button>
                )}

                {canRefund && (
                  <Button
                    onClick={refundNoSubmissions}
                    disabled={isPending || isConfirming}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold mb-3"
                  >
                    Claim Refund (No Submissions)
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

              {/* Quick Stats Card */}
              <div className="bg-white border border-slate-200 p-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Phase</span>
                    <Badge className={`text-[10px] font-black uppercase tracking-wider border ${getStatusColor()}`}>
                      {getPhaseLabel()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Submissions Close</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{formatTimeLeft(bounty.openDeadline)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Judging Ends</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{formatTimeLeft(bounty.judgingDeadline)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Submissions</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{bounty.submissionCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-600">Required Deposit</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{formatETH(requiredDeposit)} ETH</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-bold text-slate-600">Slash Penalty</span>
                    <span className="text-xs font-black text-red-600 tabular-nums">{Number(bounty.slashPercent) / 100}%</span>
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
                    <p className="text-xs font-mono font-bold text-slate-900">{formatAddress(bounty.creator)}</p>
                    {isCreator && (
                      <Badge variant="outline" className="mt-1 text-[10px] border-slate-200">You</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              {metadata?.skills && metadata.skills.length > 0 && (
                <div className="bg-white border border-slate-200 p-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {metadata.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-[10px] font-bold border-slate-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
            {/* Slash Warning Banner */}
            {canSlash && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="size-4 text-red-600" />
                <AlertDescription className="text-red-700 font-medium">
                  Creator missed the judging deadline! Anyone can trigger the slash to distribute {Number(bounty.slashPercent) / 100}% of the escrow to submitters.
                </AlertDescription>
              </Alert>
            )}

            {/* Hero Image */}
            {metadata?.images && metadata.images.length > 0 && (
              <div className="bg-white border border-slate-200 overflow-hidden">
                <img
                  src={`https://purple-elderly-silverfish-382.mypinata.cloud/ipfs/${metadata.images[0]}`}
                  alt={metadata.title}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}

            {/* Title Section */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-[10px] font-black uppercase tracking-wider border ${getStatusColor()}`}>
                  {getPhaseLabel()}
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bounty #{bountyId}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 text-balance">
                {metadata?.title || bounty.title || bounty.description.split("\n")[0]}
              </h1>
              <p className="text-sm text-slate-600 text-pretty">
                Created by <span className="font-mono font-bold">{formatAddress(bounty.creator)}</span>
              </p>
            </div>

            {/* About */}
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="size-5 text-[#0EA885]" />
                About This Bounty
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap text-pretty">
                {metadata?.description || bounty.description}
              </div>
            </div>

            {/* Requirements */}
            {metadata?.requirements && metadata.requirements.length > 0 && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-[#0EA885]" />
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {metadata.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="size-5 bg-[#0EA885]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="size-2 bg-[#0EA885]" />
                      </div>
                      <span className="text-sm text-slate-700 text-pretty">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deliverables */}
            {metadata?.deliverables && metadata.deliverables.length > 0 && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="size-5 text-[#0EA885]" />
                  Deliverables
                </h2>
                <ul className="space-y-2">
                  {metadata.deliverables.map((del, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="size-5 bg-[#0EA885]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="size-2 bg-[#0EA885]" />
                      </div>
                      <span className="text-sm text-slate-700 text-pretty">{del}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Winner Display */}
            {bounty.status === BountyStatus.RESOLVED && bounty.selectedWinner !== "0x0000000000000000000000000000000000000000" && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy className="size-5 text-[#0EA885]" />
                  Winner
                </h2>
                <div className="bg-amber-50 border border-amber-200 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-[#0EA885]/10 border border-[#0EA885]/20 flex items-center justify-center">
                        <span className="text-lg">🏆</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm font-mono">{formatAddress(bounty.selectedWinner)}</p>
                        <p className="text-xs text-slate-600">Submission #{Number(bounty.selectedSubmissionId)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#0EA885] text-lg tabular-nums">{formatETH(bounty.amount)} ETH</p>
                      <p className="text-xs font-bold text-slate-500">+ deposit refunded</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slashed Display */}
            {bounty.status === BountyStatus.SLASHED && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-black text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle className="size-5" />
                  Bounty Slashed
                </h2>
                <div className="bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-700">
                    The creator missed the judging deadline. {Number(bounty.slashPercent) / 100}% of the escrow 
                    ({formatETH((bounty.amount * bounty.slashPercent) / BigInt(10000))} ETH) was distributed to submitters.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Solution */}
            {canSubmit && (
              <div id="submit-solution-section" className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Send className="size-5 text-[#0EA885]" />
                  Submit Your Solution
                </h2>

                <div className="space-y-4">
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-amber-700 text-sm">
                      <strong>1% deposit required:</strong> You must pay {formatETH(requiredDeposit)} ETH as a deposit. 
                      This will be refunded when the winner is selected.
                    </AlertDescription>
                  </Alert>

                  {/* Social Handle Input */}
                  <div>
                    <label className="text-sm font-black text-slate-900 mb-2 block">Your Social Handle *</label>
                    <Input
                      type="text"
                      placeholder="@username"
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      className="text-sm border-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">Your social handle will be stored on-chain for transparency</p>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-900 mb-2 block">Upload Solution *</label>
                    {!uploadedSolutionImage ? (
                      <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 p-8 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedSolutionImage(file);
                            }
                          }}
                          className="hidden"
                          id="solution-image-upload"
                        />
                        <label
                          htmlFor="solution-image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="size-8 mb-3 text-slate-400" />
                          <span className="text-sm font-bold text-slate-700 mb-1">
                            Click to upload solution
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            JPG, PNG, GIF up to 10MB
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(uploadedSolutionImage)}
                          alt="Solution preview"
                          className="w-full h-48 object-cover border border-slate-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => setUploadedSolutionImage(null)}
                          className="absolute -top-2 -right-2 size-8"
                          aria-label="Remove solution image"
                        >
                          <X className="size-4" />
                        </Button>
                        <p className="text-xs font-bold text-slate-600 mt-2 truncate">
                          {uploadedSolutionImage.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={submitSolution}
                    disabled={
                      isPending || isConfirming || isUploadingSolution || !uploadedSolutionImage || !socialHandle.trim()
                    }
                    className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-black py-6"
                  >
                    {isUploadingSolution ? (
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
                        Submit Solution (Pay {formatETH(requiredDeposit)} ETH Deposit)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Already Submitted Notice */}
            {hasUserSubmitted && phase === "OPEN" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="size-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  You have already submitted to this bounty. Wait for the creator to select a winner.
                </AlertDescription>
              </Alert>
            )}

            {/* Submissions List */}
            {bounty.submissions.length > 0 && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Users className="size-5 text-[#0EA885]" />
                  Submissions ({bounty.submissions.length})
                </h2>

                <div className="space-y-4">
                  {bounty.submissions.map((sub, index) => {
                    const isWinner = bounty.selectedWinner.toLowerCase() === sub.submitter.toLowerCase() && 
                                     Number(bounty.selectedSubmissionId) === index;

                    return (
                      <div
                        key={index}
                        className={`p-4 border ${
                          isWinner ? "bg-amber-50 border-amber-200" : "border-slate-200"
                        } ${canSelectWinner ? "cursor-pointer hover:border-[#0EA885]" : ""} ${
                          selectedWinnerId === index ? "ring-2 ring-[#0EA885]" : ""
                        }`}
                        onClick={() => canSelectWinner && setSelectedWinnerId(selectedWinnerId === index ? null : index)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 flex-1">
                            {canSelectWinner && (
                              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                                selectedWinnerId === index ? "border-[#0EA885] bg-[#0EA885]" : "border-slate-300"
                              }`}>
                                {selectedWinnerId === index && <Check className="size-3 text-white" />}
                              </div>
                            )}

                            {isWinner && (
                              <Badge className="text-[10px] font-black bg-[#0EA885] text-white border-0">
                                🏆 Winner
                              </Badge>
                            )}

                            <div>
                              <p className="text-sm font-bold font-mono">{formatAddress(sub.submitter)}</p>
                              <p className="text-xs text-slate-500">@{sub.socialHandle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              Deposit: {formatETH(sub.deposit)} ETH
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCidViewer(sub.ipfsCid, `Submission by ${formatAddress(sub.submitter)}`);
                              }}
                              className="border-slate-200 font-bold"
                            >
                              <ExternalLink className="size-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Select Winner Button */}
                {canSelectWinner && selectedWinnerId !== null && (
                  <Button
                    onClick={selectWinner}
                    disabled={isPending || isConfirming}
                    className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-black mt-6"
                  >
                    <Trophy className="size-4 mr-2" />
                    {isPending || isConfirming ? "Confirming..." : "Select as Winner"}
                  </Button>
                )}

                {/* Judging Deadline Warning */}
                {canSelectWinner && (
                  <Alert className="mt-4 border-amber-200 bg-amber-50">
                    <Gavel className="size-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm">
                      You must select a winner before {new Date(Number(bounty.judgingDeadline) * 1000).toLocaleString()} 
                      or you will be slashed {Number(bounty.slashPercent) / 100}% of the escrow.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Transaction Status */}
            {hash && (
              <div className="bg-white border border-slate-200 p-4">
                <p className="text-xs font-black text-slate-900 mb-2">Transaction Hash:</p>
                <a
                  href={`https://sepolia-explorer.base.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0EA885] hover:text-[#0c8a6f] font-mono text-xs break-all underline font-bold"
                >
                  {hash}
                </a>
                {isConfirming && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-2 font-bold">
                    <Clock className="size-3 animate-spin" />
                    Waiting for confirmation...
                  </div>
                )}
                {isConfirmed && (
                  <div className="flex items-center gap-2 text-xs text-[#0EA885] mt-2 font-bold">
                    <Check className="size-4" />
                    Transaction confirmed!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IPFS Content Viewer Dialog */}
      <Dialog open={!!viewingCid} onOpenChange={() => setViewingCid(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{viewingTitle}</DialogTitle>
            <DialogDescription className="text-xs">IPFS CID: {viewingCid}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {viewingCid && (
              <div className="space-y-4">
                <div className="border border-slate-200 p-4">
                  <img
                    src={`https://purple-elderly-silverfish-382.mypinata.cloud/ipfs/${viewingCid}`}
                    alt="IPFS Content"
                    className="w-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      fetch(`https://ipfs.io/ipfs/${viewingCid}`)
                        .then(res => res.text())
                        .then(text => {
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `<pre class="text-xs whitespace-pre-wrap break-all overflow-auto max-h-96">${text}</pre>`;
                          }
                        })
                        .catch(() => {
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = '<p class="text-sm text-slate-600">Unable to load content.</p>';
                          }
                        });
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 border-slate-200">
                    <a href={`https://ipfs.io/ipfs/${viewingCid}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://ipfs.io/ipfs/${viewingCid}`);
                      showAlert({
                        title: "Copied!",
                        description: "IPFS link copied to clipboard"
                      });
                    }}
                    className="flex-1 border-slate-200"
                  >
                    <Copy className="size-3 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
