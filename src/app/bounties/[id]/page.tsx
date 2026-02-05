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
import { Checkbox } from "../../../components/ui/checkbox";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
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
  MessageCircle,
  Unlock,
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
} from "lucide-react";

interface Reply {
  replier: string;
  content: string;
  timestamp: bigint;
}

interface Submission {
  solver: string;
  blindedIpfsCid: string;
  revealIpfsCid: string;
  deposit: bigint;
  replies: readonly Reply[];
  revealed: boolean;
}

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  allowMultipleWinners: boolean;
  winnerShares: readonly bigint[];
  status: number;
  slashPercent: bigint;
  submissions: readonly Submission[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
  hasOprec?: boolean;
  oprecDeadline?: bigint;
}

interface OprecApplication {
  applicant: string;
  teamMembers: readonly string[];
  workExamples: string;
  skillDescription: string;
  timestamp: bigint;
  approved: boolean;
  rejected: boolean;
}

const BountyStatusEnum = [
  "DEVELOPMENT", // 0: OPREC
  "LIVE", // 1: OPEN
  "IN REVIEW", // 2: PENDING_REVEAL
  "COMPLETED", // 3: RESOLVED
  "DISPUTED", // 4: DISPUTED
  "EXPIRED", // 5: EXPIRED
];

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const { showAlert } = useAlert();
  const bountyId = params.id as string;

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionCid, setSubmissionCid] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([]);
  const [winnerRanks, setWinnerRanks] = useState<{ [subId: number]: number }>(
    {}
  );
  const [replyContent, setReplyContent] = useState<{ [subId: number]: string }>(
    {}
  );
  const [revealCid, setRevealCid] = useState<{ [subId: number]: string }>({});
  const [copied, setCopied] = useState(false);
  const [viewingCid, setViewingCid] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState<string>("");
  const [uploadedSolutionImage, setUploadedSolutionImage] = useState<File | null>(null);
  const [isUploadingSolution, setIsUploadingSolution] = useState(false);

  // OPREC related state
  const [oprecApplications, setOprecApplications] = useState<OprecApplication[]>([]);
  const [oprecForm, setOprecForm] = useState({
    teamMembers: [""],
    workExamples: "",
    skillDescription: "",
  });
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<number[]>([]);
  const [isApprovedParticipant, setIsApprovedParticipant] = useState(false);
  const [userOprecApplication, setUserOprecApplication] = useState<OprecApplication | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Load bounty data
  const loadBounty = async () => {
    try {
      setIsLoading(true);
      const bountyData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getBountyData",
        args: [BigInt(bountyId)],
      });

      if (bountyData) {
        const bountyArray = bountyData as any[];
        const [
          creator,
          description,
          amount,
          deadline,
          allowMultipleWinners,
          winnerShares,
          status,
          slashPercent,
          selectedWinners,
          selectedSubmissionIds,
          hasOprec,
          oprecDeadline,
        ] = bountyArray;

        // Get submissions
        const submissionCount = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
            .Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getSubmissionCount",
          args: [BigInt(bountyId)],
        });

        const submissions: Submission[] = [];
        for (let i = 0; i < Number(submissionCount); i++) {
          const submissionData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
              .Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getSubmissionStruct",
            args: [BigInt(bountyId), BigInt(i)],
          });
          if (submissionData) {
            submissions.push(submissionData as unknown as Submission);
          }
        }

        const metadataMatch = description.match(
          /Metadata: ipfs:\/\/([a-zA-Z0-9]+)/
        );
        const metadataCid = metadataMatch ? metadataMatch[1] : undefined;

        setBounty({
          id: parseInt(bountyId),
          creator,
          description,
          amount,
          deadline,
          allowMultipleWinners,
          winnerShares,
          status,
          slashPercent,
          submissions,
          selectedWinners,
          selectedSubmissionIds,
          metadataCid,
          hasOprec,
          oprecDeadline,
        });

        // Load OPREC applications if hasOprec
        if (hasOprec) {
          await loadOprecApplications();
        }

        // Check if current user is approved participant
        if (address && hasOprec) {
          const isApproved = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "approvedParticipants",
            args: [BigInt(bountyId), address],
          });
          setIsApprovedParticipant(isApproved as boolean);
        }

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
  }, [bountyId]);

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

  // Load OPREC applications
  const loadOprecApplications = async () => {
    try {
      const appCount = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getOprecApplicationCount",
        args: [BigInt(bountyId)],
      });

      const apps: OprecApplication[] = [];
      for (let i = 0; i < Number(appCount); i++) {
        const appData = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getOprecApplication",
          args: [BigInt(bountyId), BigInt(i)],
        });
        const [applicant, teamMembers, workExamples, skillDescription, timestamp, approved, rejected] = appData as [
          string,
          readonly string[],
          string,
          string,
          bigint,
          boolean,
          boolean
        ];
        const app = { applicant, teamMembers, workExamples, skillDescription, timestamp, approved, rejected };
        apps.push(app);

        // Check if this is current user's application
        if (address && applicant.toLowerCase() === address.toLowerCase()) {
          setUserOprecApplication(app);
        }
      }
      setOprecApplications(apps);
    } catch (error) {
      console.error("Error loading OPREC applications:", error);
    }
  };

  // Apply to OPREC
  const applyToOprec = async () => {
    if (!oprecForm.workExamples.trim() || !oprecForm.skillDescription.trim()) {
      showAlert({
        title: "Missing Information",
        description: "Please provide work examples and skill description",
      });
      return;
    }

    try {
      const validTeamMembers = oprecForm.teamMembers
        .filter(addr => addr.trim())
        .filter(addr => /^0x[a-fA-F0-9]{40}$/.test(addr.trim()));

      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "applyToOprec",
        args: [
          BigInt(bountyId),
          validTeamMembers as `0x${string}`[],
          oprecForm.workExamples,
          oprecForm.skillDescription,
        ],
      });

      setOprecForm({ teamMembers: [""], workExamples: "", skillDescription: "" });
    } catch (error) {
      console.error("Error applying to OPREC:", error);
      showAlert({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to submit application",
      });
    }
  };

  // Approve OPREC applications
  const approveApplications = async () => {
    if (selectedApplicationIds.length === 0) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "approveOprecApplications",
        args: [BigInt(bountyId), selectedApplicationIds.map(id => BigInt(id))],
      });
      setSelectedApplicationIds([]);
    } catch (error) {
      console.error("Error approving applications:", error);
    }
  };

  // Reject OPREC applications
  const rejectApplications = async () => {
    if (selectedApplicationIds.length === 0) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "rejectOprecApplications",
        args: [BigInt(bountyId), selectedApplicationIds.map(id => BigInt(id))],
      });
      setSelectedApplicationIds([]);
    } catch (error) {
      console.error("Error rejecting applications:", error);
    }
  };

  // End OPREC phase
  const endOprecPhase = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "endOprecPhase",
        args: [BigInt(bountyId)],
      });
    } catch (error) {
      console.error("Error ending OPREC phase:", error);
    }
  };

  const submitSolution = async () => {
    if (!bounty || (!uploadedSolutionImage && !submissionCid.trim())) {
      showAlert({
        title: "Missing Information",
        description: "Please upload a solution image or enter an IPFS CID",
      });
      return;
    }

    // Check OPREC approval if hasOprec
    if (bounty.hasOprec && !isApprovedParticipant) {
      showAlert({
        title: "Not Approved",
        description: "You must be approved in the OPREC phase to submit a solution",
      });
      return;
    }

    const depositAmount = bounty.amount / BigInt(10);

    try {
      let solutionCid = submissionCid;

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

      const validTeamMembers = teamMembers
        .filter(addr => addr.trim())
        .filter(addr => /^0x[a-fA-F0-9]{40}$/.test(addr.trim()));

      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "submitSolution",
        args: [BigInt(bountyId), solutionCid, validTeamMembers as `0x${string}`[]],
        value: depositAmount,
      });
      setSubmissionCid("");
      setTeamMembers([]);
      setUploadedSolutionImage(null);
    } catch (error) {
      console.error("Error submitting solution:", error);
      showAlert({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit solution. Please try again.",
      });
    }
  };

  const selectWinners = async () => {
    if (!bounty) return;
    const rankedSubmissions = selectedSubmissions
      .filter((subId) => winnerRanks[subId] > 0)
      .sort((a, b) => winnerRanks[a] - winnerRanks[b]);

    const selectedSolvers = rankedSubmissions.map(
      (i) => bounty.submissions[i].solver
    );

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "selectWinners",
        args: [
          BigInt(bountyId),
          selectedSolvers,
          rankedSubmissions.map((id) => BigInt(id)),
        ],
      });
    } catch (error) {
      console.error("Error selecting winners:", error);
    }
  };

  const addReply = async (subId: number) => {
    if (!replyContent[subId]?.trim()) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "addReply",
        args: [BigInt(bountyId), BigInt(subId), replyContent[subId]],
      });
      setReplyContent({ ...replyContent, [subId]: "" });
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const revealSolution = async (subId: number) => {
    if (!revealCid[subId]?.trim()) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "revealSolution",
        args: [BigInt(bountyId), BigInt(subId), revealCid[subId]],
      });
    } catch (error) {
      console.error("Error revealing solution:", error);
    }
  };

  const toggleSubmissionSelection = (index: number) => {
    setSelectedSubmissions((prev) => {
      const isSelected = prev.includes(index);
      if (isSelected) {
        setWinnerRanks((prevRanks) => {
          const newRanks = { ...prevRanks };
          delete newRanks[index];
          return newRanks;
        });
        return prev.filter((i) => i !== index);
      } else {
        const nextRank = Math.max(0, ...Object.values(winnerRanks)) + 1;
        setWinnerRanks((prev) => ({ ...prev, [index]: nextRank }));
        return [...prev, index];
      }
    });
  };

  const openCidViewer = (cid: string, title: string) => {
    setViewingCid(cid);
    setViewingTitle(title);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-slate-50">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin mx-auto text-[#0EA885] mb-4" />
          <p className="text-sm text-slate-600 text-pretty">Loading bounty...</p>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-slate-50">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-balance">Bounty not found</h2>
          <p className="mb-6 text-sm text-slate-600 text-pretty">
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
  const isExpired = BigInt(Math.floor(Date.now() / 1000)) > bounty.deadline;
  const statusLabel = BountyStatusEnum[bounty.status] || "Unknown";
  const maxWinners = bounty.allowMultipleWinners
    ? bounty.winnerShares.length
    : 1;

  const getStatusColor = () => {
    if (bounty.status === 0) return "bg-blue-50 text-blue-600 border-blue-200";
    if (bounty.status === 1) return "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20";
    if (bounty.status === 2) return "bg-amber-50 text-amber-600 border-amber-200";
    if (bounty.status === 3) return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-slate-50 text-slate-500 border-slate-200";
  };

  return (
    <div className="relative min-h-dvh bg-slate-50">
      {/* Loading Overlay */}
      {(isPending || isConfirming) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="max-w-sm p-8 bg-white border border-slate-200">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-12 animate-spin text-[#0EA885]" />
              <div className="text-center">
                <p className="mb-2 text-lg font-bold text-balance">
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

      <div className="px-4 pt-20 pb-12 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:pt-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-slate-600">
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

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${getStatusColor()}`}>
                  {statusLabel}
                </Badge>
                <span className="text-xs uppercase text-slate-400">Bounty #{bountyId}</span>
              </div>
              <h1 className="mb-2 text-3xl font-black sm:text-4xl text-slate-900 text-balance">
                {metadata?.title || bounty.description.split("\n")[0]}
              </h1>
              <p className="text-sm text-slate-600">
                Created by <span className="font-mono font-bold">{formatAddress(bounty.creator)}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={copyLink}
                variant="outline"
                size="sm"
                className="border-slate-200"
              >
                {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
                {copied ? "Copied!" : "Share"}
              </Button>
            </div>
          </div>

          {/* Reward Banner */}
          <div className="p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-[#0EA885]/10 border border-[#0EA885]/20 flex items-center justify-center">
                  <Target className="size-6 text-[#0EA885]" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold tracking-wider uppercase text-slate-600">Bounty Reward</p>
                  <p className="text-3xl font-black text-slate-900 tabular-nums">{formatETH(bounty.amount)} ETH</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="mb-1 text-xs font-medium text-slate-500">Deadline</p>
                  <p className="font-bold text-slate-900">{formatTimeLeft(bounty.deadline)}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-right">
                  <p className="mb-1 text-xs font-medium text-slate-500">Submissions</p>
                  <p className="font-bold text-slate-900 tabular-nums">{bounty.submissions.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-right">
                  <p className="mb-1 text-xs font-medium text-slate-500">Slash Rate</p>
                  <p className="font-bold text-slate-900 tabular-nums">{Number(bounty.slashPercent) / 100}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {metadata?.images && metadata.images.length > 0 && (
          <div className="mb-8">
            <img
              src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
              alt={metadata.title}
              className="object-cover w-full h-auto border max-h-96 border-slate-200"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <div className="p-6 bg-white border border-slate-200">
              <h2 className="flex items-center gap-2 mb-4 text-lg font-black text-slate-900">
                <FileText className="size-5 text-[#0EA885]" />
                About This Bounty
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 text-pretty">
                {metadata?.description || bounty.description}
              </div>
            </div>

            {/* Requirements */}
            {metadata?.requirements && metadata.requirements.length > 0 && (
              <div className="p-6 bg-white border border-slate-200">
                <h2 className="flex items-center gap-2 mb-4 text-lg font-black text-slate-900">
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
              <div className="p-6 bg-white border border-slate-200">
                <h2 className="flex items-center gap-2 mb-4 text-lg font-black text-slate-900">
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

            {/* Winners Display */}
            {bounty.status >= 2 && bounty.selectedWinners.length > 0 && (
              <div className="p-6 border-2 bg-amber-50 border-amber-200">
                <h2 className="flex items-center gap-2 mb-4 text-lg font-black text-slate-900">
                  <Trophy className="size-5 text-amber-600" />
                  Selected Winners
                </h2>
                <div className="space-y-3">
                  {bounty.selectedWinners.map((winner, index) => {
                    const submissionIndex = Number(bounty.selectedSubmissionIds[index]);
                    const submission = bounty.submissions[submissionIndex];
                    const winnerShare = bounty.winnerShares[index]
                      ? Number(bounty.winnerShares[index]) / 100
                      : 0;

                    return (
                      <div key={index} className="p-4 bg-white border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏆"}
                            </span>
                            <div>
                              <p className="font-mono text-sm font-bold">{formatAddress(winner)}</p>
                              {submission?.revealed && (
                                <Badge variant="outline" className="mt-1 text-xs text-green-700 border-green-500">
                                  Revealed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-[#0EA885] text-lg tabular-nums">{winnerShare}%</p>
                            <p className="text-xs text-slate-500 tabular-nums">
                              {formatETH((bounty.amount * BigInt(winnerShare)) / BigInt(100))} ETH
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OPREC Section (Participants) */}
            {bounty.hasOprec && bounty.status === 0 && !isCreator && (
              <div id="oprec-section">
                {userOprecApplication ? (
                  <div className={`border-2 p-6 ${
                    userOprecApplication.approved
                      ? "border-green-200 bg-green-50"
                      : userOprecApplication.rejected
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
                  }`}>
                    <h3 className="mb-2 text-lg font-bold">
                      {userOprecApplication.approved
                        ? "✓ Application Approved"
                        : userOprecApplication.rejected
                        ? "✗ Application Rejected"
                        : "⏳ Application Pending"}
                    </h3>
                    <p className="text-sm text-slate-700">
                      {userOprecApplication.approved &&
                        "Your application has been approved! You can submit solutions when the bounty opens."}
                      {userOprecApplication.rejected &&
                        "Your application was rejected by the bounty creator."}
                      {!userOprecApplication.approved && !userOprecApplication.rejected &&
                        "Your application is pending review by the bounty creator."}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-white border border-slate-200">
                    <h2 className="mb-4 text-lg font-black text-slate-900">Apply to OPREC</h2>
                    <p className="mb-6 text-sm text-slate-600">
                      Deadline: {new Date(Number(bounty.oprecDeadline) * 1000).toLocaleString()}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-bold text-slate-900">Team Members (Optional)</label>
                        {oprecForm.teamMembers.map((member, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                            <Input
                              placeholder="0x..."
                              value={member}
                              onChange={(e) => {
                                const newMembers = [...oprecForm.teamMembers];
                                newMembers[idx] = e.target.value;
                                setOprecForm({ ...oprecForm, teamMembers: newMembers });
                              }}
                              className="flex-1 border-slate-200"
                            />
                            {idx === oprecForm.teamMembers.length - 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOprecForm({ ...oprecForm, teamMembers: [...oprecForm.teamMembers, ""] })}
                                className="border-slate-200"
                              >
                                +
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-bold text-slate-900">Work Examples *</label>
                        <textarea
                          placeholder="Links to your previous work, portfolio, GitHub, etc."
                          value={oprecForm.workExamples}
                          onChange={(e) => setOprecForm({ ...oprecForm, workExamples: e.target.value })}
                          className="w-full p-3 border border-slate-200 text-sm min-h-[100px]"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-bold text-slate-900">Skill Description *</label>
                        <textarea
                          placeholder="Describe your relevant skills and experience"
                          value={oprecForm.skillDescription}
                          onChange={(e) => setOprecForm({ ...oprecForm, skillDescription: e.target.value })}
                          className="w-full p-3 border border-slate-200 text-sm min-h-[100px]"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={applyToOprec}
                        disabled={isPending || isConfirming}
                        className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white"
                      >
                        {isPending || isConfirming ? "Applying..." : "Apply to OPREC"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OPREC Management (Creator) */}
            {bounty.hasOprec && bounty.status === 0 && isCreator && (
              <div className="p-6 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black text-slate-900">
                    OPREC Applications ({oprecApplications.length})
                  </h2>
                  <Button
                    onClick={endOprecPhase}
                    disabled={isPending}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    End OPREC Phase
                  </Button>
                </div>

                <div className="space-y-3">
                  {oprecApplications.length === 0 ? (
                    <p className="py-8 text-sm text-center text-slate-500">No applications yet</p>
                  ) : (
                    <>
                      {oprecApplications.map((app, idx) => (
                        <div
                          key={idx}
                          className={`p-4 border ${
                            app.approved
                              ? "bg-green-50 border-green-200"
                              : app.rejected
                              ? "bg-red-50 border-red-200"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedApplicationIds.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApplicationIds([...selectedApplicationIds, idx]);
                                } else {
                                  setSelectedApplicationIds(selectedApplicationIds.filter(id => id !== idx));
                                }
                              }}
                              disabled={app.approved || app.rejected}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="mb-1 font-mono text-sm font-bold">{formatAddress(app.applicant)}</p>
                              {app.approved && <Badge className="text-xs bg-green-600">Approved</Badge>}
                              {app.rejected && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                              {app.teamMembers.length > 0 && (
                                <p className="mt-2 text-xs text-slate-600">
                                  Team: {app.teamMembers.map(m => formatAddress(m)).join(", ")}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-slate-600">
                                <strong>Work:</strong> {app.workExamples}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                <strong>Skills:</strong> {app.skillDescription}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedApplicationIds.length > 0 && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={approveApplications}
                            disabled={isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            Approve ({selectedApplicationIds.length})
                          </Button>
                          <Button
                            onClick={rejectApplications}
                            disabled={isPending}
                            variant="destructive"
                            className="flex-1"
                            size="sm"
                          >
                            Reject ({selectedApplicationIds.length})
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Submit Solution */}
            {bounty.status === 1 && !isCreator && !isExpired && (
              <div id="submit-solution-section" className="bg-white border-2 border-[#0EA885]/20 p-6">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-black text-slate-900">
                  <Send className="size-5 text-[#0EA885]" />
                  Submit Your Solution
                </h2>

                <div className="space-y-4">
                  {bounty.hasOprec && !isApprovedParticipant && (
                    <Alert variant="destructive" className="border-red-200">
                      <AlertDescription>
                        You must be approved in the OPREC phase to submit a solution.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <label className="block mb-2 text-sm font-bold text-slate-900">Upload Solution Image *</label>
                    {!uploadedSolutionImage ? (
                      <div className="p-8 transition-colors border-2 border-dashed border-slate-300 hover:border-slate-400">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedSolutionImage(file);
                              setSubmissionCid("");
                            }
                          }}
                          className="hidden"
                          id="solution-image-upload"
                        />
                        <label
                          htmlFor="solution-image-upload"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="mb-3 size-8 text-slate-400" />
                          <span className="mb-1 text-sm font-medium text-slate-700">
                            Click to upload solution
                          </span>
                          <span className="text-xs text-slate-500">
                            JPG, PNG, GIF up to 10MB
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(uploadedSolutionImage)}
                          alt="Solution preview"
                          className="object-cover w-full h-48 border border-slate-200"
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
                        <p className="mt-2 text-xs truncate text-slate-600">
                          {uploadedSolutionImage.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-bold text-slate-900">Team Members (Optional)</label>
                    {teamMembers.map((member, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          placeholder="0x..."
                          value={member}
                          onChange={(e) => {
                            const newMembers = [...teamMembers];
                            newMembers[idx] = e.target.value;
                            setTeamMembers(newMembers);
                          }}
                          className="flex-1 border-slate-200"
                        />
                        {idx === teamMembers.length - 1 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTeamMembers([...teamMembers, ""])}
                            className="border-slate-200"
                          >
                            +
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                            className="border-slate-200"
                          >
                            -
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={submitSolution}
                    disabled={
                      isPending || isConfirming || isUploadingSolution || (!uploadedSolutionImage && !submissionCid.trim()) || (bounty.hasOprec && !isApprovedParticipant)
                    }
                    className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold py-6"
                  >
                    {isUploadingSolution ? (
                      <>
                        <Upload className="mr-2 size-4 animate-spin" />
                        Uploading to IPFS...
                      </>
                    ) : isPending || isConfirming ? (
                      <>
                        <Clock className="mr-2 size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" />
                        Submit Solution
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Submissions & Discussion */}
            {bounty.submissions.length > 0 && (
              <div className="p-6 bg-white border border-slate-200">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-black text-slate-900">
                  <MessageCircle className="size-5 text-[#0EA885]" />
                  Submissions & Discussion ({bounty.submissions.length})
                </h2>

                <div className="space-y-4">
                  {bounty.submissions.map((sub, index) => {
                    const isWinner = bounty.selectedSubmissionIds.includes(BigInt(index));
                    const winnerIndex = bounty.selectedSubmissionIds.findIndex((id) => id === BigInt(index));

                    return (
                      <div
                        key={index}
                        className={`p-4 border ${
                          isWinner ? "bg-amber-50 border-amber-200" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1 gap-3">
                            {isCreator && bounty.status === 1 && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`submission-${index}`}
                                  checked={selectedSubmissions.includes(index)}
                                  onCheckedChange={() => toggleSubmissionSelection(index)}
                                />
                                {selectedSubmissions.includes(index) && (
                                  <Select
                                    value={(winnerRanks[index] || 1).toString()}
                                    onValueChange={(value) => {
                                      const newRanks = { ...winnerRanks };
                                      newRanks[index] = parseInt(value);
                                      setWinnerRanks(newRanks);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-28 border-slate-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: maxWinners }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                          {i + 1 === 1 ? "🥇 1st" : i + 1 === 2 ? "🥈 2nd" : i + 1 === 3 ? "🥉 3rd" : `${i + 1}th`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            )}

                            {isWinner && bounty.status === 2 && (
                              <Badge className="text-xs text-white bg-amber-600">
                                {winnerIndex === 0 ? "🥇 1st" : winnerIndex === 1 ? "🥈 2nd" : winnerIndex === 2 ? "🥉 3rd" : `🏆 ${winnerIndex + 1}th`}
                              </Badge>
                            )}

                            <div>
                              <p className="font-mono text-sm font-bold">{formatAddress(sub.solver)}</p>
                              {sub.solver.toLowerCase() === bounty.creator.toLowerCase() && (
                                <Badge variant="outline" className="mt-1 text-xs">Creator</Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCidViewer(sub.blindedIpfsCid, `Submission by ${formatAddress(sub.solver)}`)}
                            className="border-slate-200"
                          >
                            <ExternalLink className="mr-1 size-3" />
                            View
                          </Button>
                        </div>

                        {/* Replies */}
                        {sub.replies.length > 0 && (
                          <div className="pt-3 mt-3 space-y-2 border-t border-slate-200">
                            {sub.replies.map((reply, rIndex) => (
                              <div key={rIndex} className="p-3 bg-slate-50">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs font-bold">{formatAddress(reply.replier)}</span>
                                  {reply.replier.toLowerCase() === bounty.creator.toLowerCase() && (
                                    <Badge variant="outline" className="text-xs">Creator</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 text-pretty">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Reply */}
                        {bounty.status === 1 && (isCreator || address?.toLowerCase() === sub.solver.toLowerCase()) && (
                          <div className="flex gap-2 pt-3 mt-3 border-t border-slate-200">
                            <Input
                              placeholder="Add reply..."
                              value={replyContent[index] || ""}
                              onChange={(e) => setReplyContent({ ...replyContent, [index]: e.target.value })}
                              className="text-sm border-slate-200"
                            />
                            <Button
                              size="sm"
                              onClick={() => addReply(index)}
                              disabled={isPending || isConfirming}
                              className="bg-[#0EA885] hover:bg-[#0c8a6f]"
                            >
                              Reply
                            </Button>
                          </div>
                        )}

                        {/* Reveal Solution */}
                        {bounty.status === 2 && isWinner && address?.toLowerCase() === sub.solver.toLowerCase() && !sub.revealed && (
                          <div className="pt-3 mt-3 border-t border-slate-200">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter reveal IPFS CID..."
                                value={revealCid[index] || ""}
                                onChange={(e) => setRevealCid({ ...revealCid, [index]: e.target.value })}
                                className="text-sm border-slate-200"
                              />
                              <Button
                                size="sm"
                                onClick={() => revealSolution(index)}
                                disabled={!revealCid[index]?.trim() || isPending || isConfirming}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Unlock className="mr-1 size-3" />
                                Reveal
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Already Revealed */}
                        {bounty.status === 2 && sub.revealed && isWinner && (
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
                            <Badge variant="outline" className="text-green-600 border-green-500">
                              ✓ Solution Revealed
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCidViewer(sub.revealIpfsCid, `Solution by ${formatAddress(sub.solver)}`)}
                              className="border-slate-200"
                            >
                              <ExternalLink className="mr-1 size-3" />
                              View Solution
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Select Winners Button */}
                {isCreator && bounty.status === 1 && selectedSubmissions.length > 0 && (
                  <Button
                    onClick={selectWinners}
                    disabled={
                      selectedSubmissions.length === 0 ||
                      selectedSubmissions.some((id) => !winnerRanks[id]) ||
                      isPending ||
                      isConfirming
                    }
                    className="w-full mt-6 font-bold text-white bg-green-600 hover:bg-green-700"
                  >
                    <Trophy className="mr-2 size-4" />
                    {isPending || isConfirming ? "Confirming..." : `Select Winners (${selectedSubmissions.length})`}
                  </Button>
                )}
              </div>
            )}

            {/* Transaction Status */}
            {hash && (
              <div className="p-4 border border-blue-200 bg-blue-50">
                <p className="mb-2 text-xs font-bold text-slate-900">Transaction Hash:</p>
                <a
                  href={`https://shannon-explorer.somnia.network/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 underline break-all hover:text-blue-800"
                >
                  {hash}
                </a>
                {isConfirming && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                    <Clock className="size-3 animate-spin" />
                    Waiting for confirmation...
                  </div>
                )}
                {isConfirmed && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                    <Check className="size-4" />
                    Transaction confirmed!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky p-6 bg-white border border-slate-200 top-24">
              <h3 className="mb-4 text-sm font-black tracking-wider uppercase text-slate-900">Quick Actions</h3>

              {bounty.status === 1 && !isCreator && !isExpired && (
                <Button
                  onClick={() => {
                    const submitSection = document.getElementById('submit-solution-section');
                    submitSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="w-full bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold mb-3"
                  disabled={bounty.hasOprec && !isApprovedParticipant}
                >
                  <Send className="mr-2 size-4" />
                  Submit Solution
                </Button>
              )}

              {metadata?.skills && metadata.skills.length > 0 && (
                <div className="pt-6 mt-6 border-t border-slate-200">
                  <h3 className="mb-3 text-sm font-black tracking-wider uppercase text-slate-900">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {metadata.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-slate-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                <div className="p-4 border border-slate-200">
                  <img
                    src={`https://ipfs.io/ipfs/${viewingCid}`}
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
                      <ExternalLink className="mr-2 size-3" />
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
                    className="border-slate-200"
                  >
                    <Copy className="mr-2 size-3" />
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
