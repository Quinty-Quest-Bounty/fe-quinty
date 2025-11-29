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
import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Separator } from "../../../components/ui/separator";
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
 DollarSign,
 Send,
 Loader2,
 Upload,
 X,
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
 "Open Rec", // 0: OPREC
 "Open", // 1: OPEN
 "Pending Reveal", // 2: PENDING_REVEAL
 "Resolved", // 3: RESOLVED
 "Disputed", // 4: DISPUTED
 "Expired", // 5: EXPIRED
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
 <div className="min-h-screen flex items-center justify-center p-4">
  <div className="text-center rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-[#0EA885]" />
  <p className="text-muted-foreground mt-6 text-sm sm:text-base">Loading bounty...</p>
  </div>
 </div>
 );
 }

 if (!bounty) {
 return (
 <div className="min-h-screen flex items-center justify-center p-4">
  <div className="text-center rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
  <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Bounty not found</h2>
  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
  The bounty you're looking for doesn't exist.
  </p>
  <Button
  onClick={() => router.push("/bounties")}
  className="rounded-[0.75rem] transition-all duration-300"
  >
  Back to Bounties
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

 return (
 <div className="min-h-screen relative pt-20 sm:pt-24">
 {/* Loading Overlay */}
 {(isPending || isConfirming) && (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
  <div className="p-8 sm:p-10 rounded-[2rem] shadow-2xl border border-white/60 bg-white/90 backdrop-blur-xl max-w-sm animate-in fade-in zoom-in duration-300">
  <div className="flex flex-col items-center gap-6">
   <div className="p-4 rounded-[1.25rem] bg-[#0EA885]/10">
   <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-[#0EA885]" />
   </div>
   <div className="text-center">
   <p className="font-bold text-lg sm:text-xl mb-2">
   {isPending ? "Waiting for approval..." : "Confirming transaction..."}
   </p>
   <p className="text-sm text-muted-foreground">
   Please don't close this page
   </p>
   </div>
  </div>
  </div>
  </div>
 )}

 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
  {/* Breadcrumb */}
  <div className="mb-6 sm:mb-8">
  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300">
  <Breadcrumb>
   <BreadcrumbList>
   <BreadcrumbItem>
   <BreadcrumbLink
    onClick={() => router.push("/")}
    className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium "
   >
    Home
   </BreadcrumbLink>
   </BreadcrumbItem>
   <BreadcrumbSeparator>
   <ChevronRight className="h-4 w-4 text-foreground/40" />
   </BreadcrumbSeparator>
   <BreadcrumbItem>
   <BreadcrumbLink
    onClick={() => router.push("/bounties")}
    className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium "
   >
    Bounties
   </BreadcrumbLink>
   </BreadcrumbItem>
   <BreadcrumbSeparator>
   <ChevronRight className="h-4 w-4 text-foreground/40" />
   </BreadcrumbSeparator>
   <BreadcrumbItem>
   <BreadcrumbPage className="text-sm font-semibold text-[#0EA885]">Bounty #{bountyId}</BreadcrumbPage>
   </BreadcrumbItem>
   </BreadcrumbList>
  </Breadcrumb>
  </div>
  </div>

  {/* Main Content */}
  <div className="space-y-4 sm:space-y-6">
  {/* Header Card */}
  <Card className="rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 ">
  <CardHeader className="pb-3 sm:pb-4">
   <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
   <div className="flex-1 w-full">
   <div className="flex items-start gap-3 mb-2">
    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#0EA885]/10 to-[#0EA885]/5 border border-[#0EA885]/20">
    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-[#0EA885]" />
    </div>
    <div className="flex-1">
    <CardTitle className="text-lg sm:text-xl font-bold">
    {metadata?.title || bounty.description.split("\n")[0]}
    </CardTitle>
    <div className="flex items-center gap-2 mt-1.5">
    <span className="text-xs text-muted-foreground font-medium">
     Created by
    </span>
    <Badge variant="outline" className="text-xs py-0.5 h-auto px-2 rounded-full border-white/60 bg-white/50">
     {formatAddress(bounty.creator)}
    </Badge>
    </div>
    </div>
   </div>
   </div>
   <div className="flex gap-2 w-full sm:w-auto">
   <Badge variant="default" className="text-xs rounded-full px-3 py-1 bg-[#0EA885] hover:bg-[#0EA885]/90">{statusLabel}</Badge>
   <Button
    variant="outline"
    size="sm"
    onClick={copyLink}
    className="gap-1.5 h-auto px-3 py-1.5 rounded-full border-white/60 bg-white/50 hover:bg-white/70 transition-all duration-300"
   >
    {copied ? (
    <>
    <Check className="w-3 h-3" />
    <span className="text-xs font-medium">Copied!</span>
    </>
    ) : (
    <>
    <Copy className="w-3 h-3" />
    <span className="text-xs font-medium">Share</span>
    </>
    )}
   </Button>
   </div>
   </div>

   {/* Images */}
   {metadata?.images && metadata.images.length > 0 && (
   <div className="mt-3 flex justify-center">
   <div className="w-full max-w-2xl">
    <img
    src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
    alt={metadata.title}
    className="w-full h-auto rounded-xl shadow-sm"
    />
   </div>
   </div>
   )}

   {/* Stats Grid */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
   <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-[1.25rem] p-3 border border-primary/20 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <DollarSign className="w-3 h-3 text-primary" />
    <span className="text-xs font-medium text-muted-foreground">
    Bounty Reward
    </span>
   </div>
   <p className="text-base font-bold text-primary">
    {formatETH(bounty.amount)} ETH
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Clock className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">
    Deadline
    </span>
   </div>
   <p className="text-sm font-semibold">
    {formatTimeLeft(bounty.deadline)}
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Users className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">
    Submissions
    </span>
   </div>
   <p className="text-sm font-semibold">
    {bounty.submissions.length}
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Shield className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">
    Slash %
    </span>
   </div>
   <p className="text-sm font-semibold">
    {Number(bounty.slashPercent) / 100}%
   </p>
   </div>
   </div>
  </CardHeader>

  <CardContent className="pt-3">
   {/* Description */}
   {metadata?.description && (
   <div className="mb-3">
   <h3 className="text-sm font-semibold mb-1.5">Description</h3>
   <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
    {metadata.description}
   </p>
   </div>
   )}

   {/* Requirements */}
   {metadata?.requirements && metadata.requirements.length > 0 && (
   <div className="mb-3">
   <h3 className="text-sm font-semibold mb-1.5">Requirements</h3>
   <ul className="list-disc list-inside space-y-0.5">
    {metadata.requirements.map((req, index) => (
    <li key={index} className="text-sm text-muted-foreground">
    {req}
    </li>
    ))}
   </ul>
   </div>
   )}

   {/* Deliverables */}
   {metadata?.deliverables && metadata.deliverables.length > 0 && (
   <div className="mb-3">
   <h3 className="text-sm font-semibold mb-1.5">Deliverables</h3>
   <ul className="list-disc list-inside space-y-0.5">
    {metadata.deliverables.map((del, index) => (
    <li key={index} className="text-sm text-muted-foreground">
    {del}
    </li>
    ))}
   </ul>
   </div>
   )}

   {/* Skills */}
   {metadata?.skills && metadata.skills.length > 0 && (
   <div className="mb-3">
   <h3 className="text-sm font-semibold mb-1.5">Required Skills</h3>
   <div className="flex flex-wrap gap-1.5">
    {metadata.skills.map((skill, index) => (
    <Badge key={index} variant="outline" className="text-xs py-0 h-5">
    {skill}
    </Badge>
    ))}
   </div>
   </div>
   )}

   <Separator className="my-4" />

   {/* Winners Display - Show on PENDING_REVEAL and after */}
   {bounty.status >= 2 && bounty.selectedWinners.length > 0 && (
   <div className="mb-4">
   <h3 className="text-sm font-semibold mb-2">
    Selected Winners ({bounty.selectedWinners.length})
   </h3>
   <div className="space-y-3">
    {bounty.selectedWinners.map((winner, index) => {
    const submissionIndex = Number(
    bounty.selectedSubmissionIds[index]
    );
    const submission = bounty.submissions[submissionIndex];
    const winnerShare = bounty.winnerShares[index]
    ? Number(bounty.winnerShares[index]) / 100
    : 0;

    return (
    <Card key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
     <CardContent className="pt-4 pb-4">
     <div className="flex justify-between items-center">
     <div className="flex items-center gap-3">
      <Badge
      variant={index === 0 ? "default" : "secondary"}
      >
      {index === 0
      ? "🥇"
      : index === 1
      ? "🥈"
      : index === 2
      ? "🥉"
      : "🏆"}
      </Badge>
      <div>
      <p className="font-medium">
      {formatAddress(winner)}
      </p>
      {submission?.revealed && (
      <Badge
       variant="outline"
       className="text-xs mt-1"
      >
       ✅ Revealed
      </Badge>
      )}
      </div>
     </div>
     <div className="text-right">
      <p className="font-bold text-primary">
      {winnerShare}%
      </p>
      <p className="text-xs text-muted-foreground">
      {formatETH(
      (bounty.amount * BigInt(winnerShare)) /
       BigInt(100)
      )}{" "}
      ETH
      </p>
     </div>
     </div>
     </CardContent>
    </Card>
    );
    })}
   </div>
   </div>
   )}

   {/* Apply to OPREC Section */}
   {bounty.hasOprec && bounty.status === 0 && !isCreator && (
   <div className="mb-4">
   {userOprecApplication ? (
    // User already applied
    <Card className={`rounded-[1.5rem] shadow-md transition-all duration-300 ${
    userOprecApplication.approved
    ? "border-green-200 bg-green-50 dark:bg-green-950"
    : userOprecApplication.rejected
    ? "border-red-200 bg-red-50 dark:bg-red-950"
    : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"
    }`}>
    <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
     <Users className="w-4 h-4" />
     {userOprecApplication.approved
     ? "✅ OPREC Application Approved"
     : userOprecApplication.rejected
     ? "❌ OPREC Application Rejected"
     : "⏳ OPREC Application Pending"}
    </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-2 text-sm">
     {userOprecApplication.approved && (
     <p className="text-green-700 dark:text-green-300">
     Your application has been approved! You can submit solutions when bounty status changes to OPEN.
     </p>
     )}
     {userOprecApplication.rejected && (
     <p className="text-red-700 dark:text-red-300">
     Your application was rejected by the bounty creator.
     </p>
     )}
     {!userOprecApplication.approved && !userOprecApplication.rejected && (
     <p className="text-yellow-700 dark:text-yellow-300">
     Your application is pending review by the bounty creator.
     </p>
     )}
    </div>
    </CardContent>
    </Card>
   ) : (
    // User hasn't applied yet
    <Card className="rounded-[1.5rem] border-blue-200 bg-blue-50 dark:bg-blue-950 shadow-md transition-all duration-300">
    <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
     <Users className="w-4 h-4" />
     Apply to OPREC (Open Recruitment)
    </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-3">
     <p className="text-sm text-muted-foreground">
     Deadline: {new Date(Number(bounty.oprecDeadline) * 1000).toLocaleString()}
     </p>

    <div className="space-y-2">
     <label className="text-sm font-medium">Team Members (Optional)</label>
     {oprecForm.teamMembers.map((member, idx) => (
     <div key={idx} className="flex gap-2">
     <Input
      placeholder="0x..."
      value={member}
      onChange={(e) => {
      const newMembers = [...oprecForm.teamMembers];
      newMembers[idx] = e.target.value;
      setOprecForm({ ...oprecForm, teamMembers: newMembers });
      }}
      className="flex-1"
     />
     {idx === oprecForm.teamMembers.length - 1 && (
      <Button
      variant="outline"
      size="sm"
      onClick={() => setOprecForm({ ...oprecForm, teamMembers: [...oprecForm.teamMembers, ""] })}
      >
      +
      </Button>
     )}
     </div>
     ))}
    </div>

    <div className="space-y-2">
     <label className="text-sm font-medium">Work Examples *</label>
     <textarea
     placeholder="Links to your previous work, portfolio, GitHub, etc."
     value={oprecForm.workExamples}
     onChange={(e) => setOprecForm({ ...oprecForm, workExamples: e.target.value })}
     className="w-full p-2 border rounded-md text-sm"
     rows={3}
     />
    </div>

    <div className="space-y-2">
     <label className="text-sm font-medium">Skill Description *</label>
     <textarea
     placeholder="Describe your relevant skills and experience"
     value={oprecForm.skillDescription}
     onChange={(e) => setOprecForm({ ...oprecForm, skillDescription: e.target.value })}
     className="w-full p-2 border rounded-md text-sm"
     rows={3}
     />
    </div>

     <Button
     onClick={applyToOprec}
     disabled={isPending || isConfirming}
     className="w-full"
     size="sm"
     >
     {isPending || isConfirming ? "Applying..." : "Apply to OPREC"}
     </Button>
    </div>
    </CardContent>
    </Card>
   )}
   </div>
   )}

   {/* OPREC Applications Management (Creator Only) */}
   {bounty.hasOprec && bounty.status === 0 && isCreator && (
   <div className="mb-4">
   <Card className="rounded-[1.5rem] shadow-md transition-all duration-300">
    <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
    <CardTitle className="text-base flex items-center gap-2">
     <Users className="w-4 h-4" />
     OPREC Applications ({oprecApplications.length})
    </CardTitle>
    <Button
     variant="outline"
     size="sm"
     onClick={endOprecPhase}
     disabled={isPending}
    >
     End OPREC Phase
    </Button>
    </div>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-3">
    {oprecApplications.length === 0 ? (
     <p className="text-sm text-muted-foreground text-center py-4">
     No applications yet
     </p>
    ) : (
     <>
     {oprecApplications.map((app, idx) => (
     <Card key={idx} className={`rounded-[1.25rem] transition-all duration-300 ${app.approved ? "bg-green-50 dark:bg-green-950" : app.rejected ? "bg-red-50 dark:bg-red-950" : ""}`}>
      <CardContent className="pt-3 pb-3">
      <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
       <div className="flex items-center gap-2">
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
       className="h-4 w-4"
       />
       <p className="text-sm font-medium">{formatAddress(app.applicant)}</p>
       {app.approved && <Badge variant="default" className="text-xs">Approved</Badge>}
       {app.rejected && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
       </div>
       {app.teamMembers.length > 0 && (
       <p className="text-xs text-muted-foreground">
       Team: {app.teamMembers.map(m => formatAddress(m)).join(", ")}
       </p>
       )}
       <p className="text-xs text-muted-foreground">
       <strong>Work:</strong> {app.workExamples}
       </p>
       <p className="text-xs text-muted-foreground">
       <strong>Skills:</strong> {app.skillDescription}
       </p>
      </div>
      </div>
      </CardContent>
     </Card>
     ))}
     {selectedApplicationIds.length > 0 && (
     <div className="flex gap-2">
      <Button
      variant="default"
      size="sm"
      onClick={approveApplications}
      disabled={isPending}
      className="flex-1"
      >
      Approve Selected ({selectedApplicationIds.length})
      </Button>
      <Button
      variant="destructive"
      size="sm"
      onClick={rejectApplications}
      disabled={isPending}
      className="flex-1"
      >
      Reject Selected ({selectedApplicationIds.length})
      </Button>
     </div>
     )}
     </>
    )}
    </div>
    </CardContent>
   </Card>
   </div>
   )}

   {/* Submit Solution Section - Only OPEN (1) status allows submissions */}
   {bounty.status === 1 && !isCreator && !isExpired && (
   <div className="mb-4">
   <Card className="rounded-[1.5rem] border-primary/20 bg-primary/5 shadow-md transition-all duration-300">
    <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
    <Send className="w-4 h-4" />
    Submit Your Solution
    </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-3">
    {bounty.hasOprec && !isApprovedParticipant && (
     <Alert variant="destructive">
     <AlertDescription>
     You must be approved in the OPREC phase to submit a solution.
     </AlertDescription>
     </Alert>
    )}

    <div className="space-y-1.5">
     <label className="text-sm font-medium">Upload Solution Image *</label>

     {!uploadedSolutionImage ? (
     <div className="border-2 border-dashed rounded-lg p-4 transition-colors border-muted-foreground/25 hover:border-muted-foreground/50">
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
      className="cursor-pointer flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
     >
      <div className="w-10 h-10 mb-2 bg-muted rounded-full flex items-center justify-center">
      <Upload className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium mb-1">
      Click to upload solution
      </span>
      <span className="text-xs text-center">
      JPG, PNG, GIF up to 10MB
      </span>
     </label>
     </div>
     ) : (
     <div className="relative group">
     <img
      src={URL.createObjectURL(uploadedSolutionImage)}
      alt="Solution preview"
      className="w-full h-32 object-cover rounded-lg border"
     />
     <Button
      type="button"
      variant="destructive"
      size="icon"
      onClick={() => setUploadedSolutionImage(null)}
      className="absolute -top-2 -right-2 w-6 h-6"
     >
      <X className="w-3 h-3" />
     </Button>
     <div className="text-xs text-muted-foreground mt-1 truncate">
      {uploadedSolutionImage.name}
     </div>
     </div>
     )}

     <p className="text-xs text-muted-foreground">
     Upload your solution image (will be uploaded to IPFS)
     </p>
    </div>

    <div className="space-y-2">
     <label className="text-sm font-medium">Team Members (Optional)</label>
     <p className="text-xs text-muted-foreground">
     Add wallet addresses of team members who contributed to this solution
     </p>
     {teamMembers.map((member, idx) => (
     <div key={idx} className="flex gap-2">
     <Input
      placeholder="0x..."
      value={member}
      onChange={(e) => {
      const newMembers = [...teamMembers];
      newMembers[idx] = e.target.value;
      setTeamMembers(newMembers);
      }}
      className="flex-1 text-sm"
     />
     {idx === teamMembers.length - 1 ? (
      <Button
      variant="outline"
      size="sm"
      onClick={() => setTeamMembers([...teamMembers, ""])}
      >
      +
      </Button>
     ) : (
      <Button
      variant="outline"
      size="sm"
      onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
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
     className="w-full"
     size="sm"
    >
     {isUploadingSolution ? (
     <>
     <Upload className="w-3 h-3 mr-2 animate-spin" />
     Uploading to IPFS...
     </>
     ) : isPending || isConfirming ? (
     <>
     <Clock className="w-3 h-3 mr-2 animate-spin" />
     Submitting...
     </>
     ) : (
     <>
     <Send className="w-3 h-3 mr-2" />
     Submit Solution
     </>
     )}
    </Button>
    </div>
    </CardContent>
   </Card>
   </div>
   )}

   {/* Submissions */}
   {bounty.submissions.length > 0 && (
   <div>
   <h3 className="text-sm font-semibold mb-2">
    All Submissions ({bounty.submissions.length})
   </h3>
   <div className="space-y-2">
   {bounty.submissions.map((sub, index) => {
    const isWinner = bounty.selectedSubmissionIds.includes(
    BigInt(index)
    );
    const winnerIndex = bounty.selectedSubmissionIds.findIndex(
    (id) => id === BigInt(index)
    );

    return (
    <Card
    key={index}
    className={`rounded-[1.25rem] transition-all duration-300 ${
     isWinner
     ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
     : ""
    }`}
    >
    <CardContent className="py-3 px-4">
     <div className="flex justify-between items-start">
     <div className="flex-1">
     <div className="flex items-center gap-2 mb-2">
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
       <SelectTrigger className="w-24 h-7 text-xs">
       <SelectValue />
       </SelectTrigger>
       <SelectContent>
       {Array.from({ length: maxWinners }, (_, i) => (
       <SelectItem key={i + 1} value={(i + 1).toString()}>
        {i + 1 === 1
        ? "🥇 1st"
        : i + 1 === 2
        ? "🥈 2nd"
        : i + 1 === 3
        ? "🥉 3rd"
        : `${i + 1}th`}
       </SelectItem>
       ))}
       </SelectContent>
      </Select>
      )}
      </div>
     )}

     {isWinner && bounty.status === 2 && (
      <Badge
      variant={
      winnerIndex === 0 ? "default" : "secondary"
      }
      className="text-xs"
      >
      {winnerIndex === 0
      ? "🥇 1st"
      : winnerIndex === 1
      ? "🥈 2nd"
      : winnerIndex === 2
      ? "🥉 3rd"
      : `🏆 ${winnerIndex + 1}th`}
      </Badge>
     )}

      <div>
      <p className="text-sm font-medium">
      {formatAddress(sub.solver)}
      </p>
      {sub.solver.toLowerCase() ===
      bounty.creator.toLowerCase() && (
      <Badge
       variant="outline"
       className="text-xs mt-0.5 h-4"
      >
       Creator
      </Badge>
      )}
      </div>
     </div>
     </div>

     <Button
     variant="outline"
     size="sm"
     className="h-7"
     onClick={() => openCidViewer(sub.blindedIpfsCid, `Submission by ${formatAddress(sub.solver)}`)}
     >
     <ExternalLink className="w-3 h-3 mr-1" />
     <span className="text-xs">View</span>
     </Button>
     </div>

     {/* Replies */}
     {sub.replies.length > 0 && (
     <div className="mt-3 pt-3 border-t space-y-2">
     <div className="flex items-center gap-1.5">
      <MessageCircle className="w-3 h-3 text-muted-foreground" />
      <span className="text-xs font-medium">
      Discussion ({sub.replies.length})
      </span>
     </div>
     {sub.replies.map((reply, rIndex) => (
      <div
      key={rIndex}
      className="bg-muted/50 p-2.5 rounded-lg"
      >
      <div className="flex items-center gap-1.5 mb-1">
      <span className="font-medium text-xs">
       {formatAddress(reply.replier)}
      </span>
      {reply.replier.toLowerCase() ===
       bounty.creator.toLowerCase() && (
       <Badge
       variant="outline"
       className="text-xs h-4"
       >
       Creator
       </Badge>
      )}
      </div>
      <p className="text-xs leading-relaxed">
      {reply.content}
      </p>
      </div>
     ))}
     </div>
     )}

     {/* Add Reply - Only on OPEN status */}
     {bounty.status === 1 &&
     (isCreator ||
     address?.toLowerCase() ===
      sub.solver.toLowerCase()) && (
     <div className="flex gap-2 mt-3 pt-3 border-t">
      <Input
      placeholder="Add reply..."
      value={replyContent[index] || ""}
      onChange={(e) =>
      setReplyContent({
       ...replyContent,
       [index]: e.target.value,
      })
      }
      className="text-sm h-8"
      />
      <Button
      size="sm"
      onClick={() => addReply(index)}
      disabled={isPending || isConfirming}
      className="h-8"
      >
      <MessageCircle className="w-3 h-3 mr-1" />
      <span className="text-xs">Reply</span>
      </Button>
     </div>
     )}

     {/* Reveal Solution - Only for winners on PENDING_REVEAL status */}
     {bounty.status === 2 &&
     isWinner &&
     address?.toLowerCase() ===
     sub.solver.toLowerCase() &&
     !sub.revealed && (
     <div className="mt-3 pt-3 border-t">
      <div className="flex gap-2">
      <Input
      placeholder="Enter reveal IPFS CID..."
      value={revealCid[index] || ""}
      onChange={(e) =>
       setRevealCid({
       ...revealCid,
       [index]: e.target.value,
       })
      }
      className="text-sm h-8"
      />
      <Button
      size="sm"
      onClick={() => revealSolution(index)}
      disabled={
       !revealCid[index]?.trim() ||
       isPending ||
       isConfirming
      }
      className="bg-green-600 hover:bg-green-700 h-8"
      >
      <Unlock className="w-3 h-3 mr-1" />
      <span className="text-xs">Reveal</span>
      </Button>
      </div>
     </div>
     )}

     {/* Already Revealed */}
     {bounty.status === 2 && sub.revealed && isWinner && (
     <div className="mt-3 pt-3 border-t flex items-center justify-between">
     <Badge
      variant="outline"
      className="text-green-600 text-xs"
     >
      ✅ Solution Revealed
     </Badge>
     <Button
      variant="outline"
      size="sm"
      className="h-7"
      onClick={() => openCidViewer(sub.revealIpfsCid, `Solution by ${formatAddress(sub.solver)}`)}
     >
      <ExternalLink className="w-3 h-3 mr-1" />
      <span className="text-xs">View Solution</span>
     </Button>
     </div>
     )}
    </CardContent>
    </Card>
    );
   })}
   </div>

   {/* Select Winners Button - Only on OPEN status */}
   {isCreator &&
    bounty.status === 1 &&
    selectedSubmissions.length > 0 && (
    <Card className="rounded-[1.5rem] mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-md transition-all duration-300">
    <CardContent className="py-3 px-4">
     <div className="flex justify-between items-center">
     <div>
     <h4 className="text-sm font-bold mb-0.5">
      Ready to Select Winners?
     </h4>
     <p className="text-xs text-muted-foreground">
      {selectedSubmissions.length} submission(s)
      selected
     </p>
     </div>
     <Button
     onClick={selectWinners}
     disabled={
      selectedSubmissions.length === 0 ||
      selectedSubmissions.some(
      (id) => !winnerRanks[id]
      ) ||
      isPending ||
      isConfirming
     }
     size="sm"
     >
     <Trophy className="w-3 h-3 mr-2" />
     <span className="text-xs">
      {isPending || isConfirming
      ? "Confirming..."
      : "Confirm Winners"}
     </span>
     </Button>
     </div>
    </CardContent>
    </Card>
    )}
   </div>
   )}

   {/* Transaction Status */}
   {hash && (
   <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
   <div className="space-y-2">
    <p className="text-xs font-medium">Transaction Hash:</p>
    <a
    href={`https://shannon-explorer.somnia.network/tx/${hash}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
    >
    {hash}
    </a>
    {isConfirming && (
    <div className="flex items-center gap-2 text-xs text-blue-600">
    <Clock className="w-3 h-3 animate-spin" />
    Waiting for confirmation...
    </div>
    )}
    {isConfirmed && (
    <div className="flex items-center gap-2 text-xs text-green-600">
    <Check className="w-4 h-4" />
    Transaction confirmed!
    </div>
    )}
   </div>
   </div>
   )}
  </CardContent>
  </Card>
  </div>
 </div>

 {/* IPFS Content Viewer Dialog */}
 <Dialog open={!!viewingCid} onOpenChange={() => setViewingCid(null)}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto rounded-[2rem]">
  <DialogHeader>
  <DialogTitle>{viewingTitle}</DialogTitle>
  <DialogDescription className="text-xs">
   IPFS CID: {viewingCid}
  </DialogDescription>
  </DialogHeader>
  <div className="mt-4">
  {viewingCid && (
   <div className="space-y-4">
   {/* Image/Media Preview */}
   <div className="rounded-lg border bg-muted/30 p-4">
   <img
    src={`https://ipfs.io/ipfs/${viewingCid}`}
    alt="IPFS Content"
    className="w-full rounded-lg"
    onError={(e) => {
    // If image fails, try to load as text/json
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
     container.innerHTML = '<p class="text-sm text-muted-foreground">Unable to load content. The file might be in an unsupported format.</p>';
     }
    });
    }}
   />
   </div>

   {/* Action Buttons */}
   <div className="flex gap-2">
   <Button
    variant="outline"
    size="sm"
    asChild
    className="flex-1"
   >
    <a
    href={`https://ipfs.io/ipfs/${viewingCid}`}
    target="_blank"
    rel="noopener noreferrer"
    >
    <ExternalLink className="w-3 h-3 mr-2" />
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
   >
    <Copy className="w-3 h-3 mr-2" />
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
