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
import { Separator } from "../../../components/ui/separator";
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
} from "lucide-react";

interface Airdrop {
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

export default function AirdropDetailPage() {
 const params = useParams();
 const router = useRouter();
 const { address } = useAccount();
 const { showAlert } = useAlert();
 const airdropId = params.id as string;

 const [airdrop, setAirdrop] = useState<Airdrop | null>(null);
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

 // Load airdrop data
 const loadAirdrop = async () => {
 try {
 setIsLoading(true);
 const airdropData = await readContract(wagmiConfig, {
  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
  abi: AIRDROP_ABI,
  functionName: "getAirdrop",
  args: [BigInt(airdropId)],
 });

 if (airdropData) {
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
  ] = airdropData as any;

  setAirdrop({
  id: parseInt(airdropId),
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
  args: [BigInt(airdropId)],
  });

  const loadedEntries: Entry[] = [];
  for (let i = 0; i < Number(entryCount); i++) {
  const entryData = await readContract(wagmiConfig, {
  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
  abi: AIRDROP_ABI,
  functionName: "getEntry",
  args: [BigInt(airdropId), BigInt(i)],
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
 console.error("Error loading airdrop:", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 if (airdropId) {
 loadAirdrop();
 }
 }, [airdropId]);

 useEffect(() => {
 if (isConfirmed) {
 loadAirdrop();
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
  airdropId: airdropId,
  type: "airdrop-proof",
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
  args: [BigInt(airdropId), proofCid],
 });
 } catch (error) {
 console.error("Error submitting entry:", error);
 }
 };

 if (isLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center p-4">
  <div className="text-center rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-[#0EA885]" />
  <p className="text-muted-foreground mt-6 text-sm sm:text-base">Loading airdrop...</p>
  </div>
 </div>
 );
 }

 if (!airdrop) {
 return (
 <div className="min-h-screen flex items-center justify-center p-4">
  <div className="text-center rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
  <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Airdrop not found</h2>
  <p className="text-muted-foreground mb-6 text-sm sm:text-base">The airdrop you're looking for doesn't exist.</p>
  <Button onClick={() => router.push("/airdrops")} className="rounded-[0.75rem] transition-all duration-300">
  Back to Airdrops
  </Button>
  </div>
 </div>
 );
 }

 const isCreator = address?.toLowerCase() === airdrop.creator.toLowerCase();
 const isExpired = Date.now() / 1000 > airdrop.deadline;
 const progress = Math.min((airdrop.qualifiersCount / airdrop.maxQualifiers) * 100, 100);
 const userEntry = entries.find((e) => e.solver.toLowerCase() === address?.toLowerCase());

 const getStatusColor = () => {
 if (airdrop.resolved) return "default";
 if (airdrop.cancelled) return "destructive";
 if (isExpired) return "destructive";
 if (airdrop.qualifiersCount >= airdrop.maxQualifiers) return "secondary";
 return "default";
 };

 const getStatusText = () => {
 if (airdrop.cancelled) return "Cancelled";
 if (airdrop.resolved) return "Completed";
 if (isExpired) return "Expired";
 if (airdrop.qualifiersCount >= airdrop.maxQualifiers) return "Full";
 return "Active";
 };

 return (
 <div className="min-h-screen relative">
 {/* Loading Overlay */}
 {(isPending || isConfirming) && (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
  <div className="p-8 sm:p-10 rounded-[2rem] shadow-2xl border border-white/60 bg-white/90 backdrop-blur-xl max-w-sm">
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
    onClick={() => router.push("/airdrops")}
    className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium "
   >
    Airdrops
   </BreadcrumbLink>
   </BreadcrumbItem>
   <BreadcrumbSeparator>
   <ChevronRight className="h-4 w-4 text-foreground/40" />
   </BreadcrumbSeparator>
   <BreadcrumbItem>
   <BreadcrumbPage className="text-sm font-semibold text-[#0EA885]">Airdrop #{airdropId}</BreadcrumbPage>
   </BreadcrumbItem>
   </BreadcrumbList>
  </Breadcrumb>
  </div>
  </div>

  {/* Main Content */}
  <div className="space-y-6">
  {/* Header Card */}
  <Card className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 ">
  <CardHeader className="pb-3">
   <div className="flex justify-between items-start gap-3">
   <div className="flex-1">
   <div className="flex items-center gap-2 mb-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
    <Gift className="h-4 w-4 text-primary" />
    </div>
    <div>
    <CardTitle className="text-lg">{airdrop.title}</CardTitle>
    <div className="flex items-center gap-2 mt-1">
    <span className="text-xs text-muted-foreground">Created by</span>
    <Badge variant="outline" className="text-xs py-0 h-5">
     {formatAddress(airdrop.creator)}
    </Badge>
    </div>
    </div>
   </div>
   </div>
   <div className="flex gap-2">
   <Badge variant={getStatusColor()} className="text-xs">{getStatusText()}</Badge>
   <Button
    variant="outline"
    size="sm"
    onClick={copyLink}
    className="gap-1 h-7 px-2"
   >
    {copied ? (
    <>
    <Check className="w-3 h-3" />
    <span className="text-xs">Copied!</span>
    </>
    ) : (
    <>
    <Copy className="w-3 h-3" />
    <span className="text-xs">Share</span>
    </>
    )}
   </Button>
   </div>
   </div>

   {/* Campaign Image */}
   {airdrop.imageUrl && (
   <div className="mt-3 flex justify-center">
   <div className="w-full max-w-2xl">
    <IpfsImage
    cid={airdrop.imageUrl.replace("ipfs://", "")}
    alt={airdrop.title}
    className="w-full h-auto rounded-xl shadow-sm"
    />
   </div>
   </div>
   )}

   {/* Stats Grid */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
   <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[1.25rem] p-3 border border-green-200 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Coins className="w-3 h-3 text-green-600" />
    <span className="text-xs font-medium text-muted-foreground">Reward Per User</span>
   </div>
   <p className="text-base font-bold text-green-600">
    {formatETH(airdrop.perQualifier)} ETH
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Users className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">Participants</span>
   </div>
   <p className="text-sm font-semibold">
    {airdrop.qualifiersCount} / {airdrop.maxQualifiers}
   </p>
   <Progress value={progress} className="h-1 mt-1.5" />
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Clock className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">Deadline</span>
   </div>
   <p className="text-sm font-semibold">
    {formatTimeLeft(BigInt(airdrop.deadline))}
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Target className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">Total Budget</span>
   </div>
   <p className="text-sm font-semibold">
    {formatETH(airdrop.totalAmount)} ETH
   </p>
   </div>
   </div>
  </CardHeader>

  <CardContent className="pt-3">
   {/* Description */}
   {airdrop.description && (
   <div className="mb-3">
   <h3 className="text-sm font-semibold mb-1.5">Description</h3>
   <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
    {airdrop.description.replace(/\n\nImage:.*$/, "")}
   </p>
   </div>
   )}

   {/* Requirements */}
   <div className="mb-3">
   <h3 className="text-sm font-semibold mb-1.5">Requirements</h3>
   <div className="bg-muted/50 rounded-lg p-2.5">
   <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
    {airdrop.requirements}
   </p>
   </div>
   </div>

   <Separator className="my-4" />

   {/* Submit Entry Section */}
   {!isExpired && !airdrop.resolved && !airdrop.cancelled && airdrop.qualifiersCount < airdrop.maxQualifiers && (
   <div className="mb-4">
   {userEntry ? (
    <Card className="rounded-[1.5rem] bg-blue-50 border-blue-200 shadow-md transition-all duration-300">
    <CardHeader className="pb-2">
    <CardTitle className="text-base flex items-center gap-2">
     <Check className="w-4 h-4" />
     Your Submission
    </CardTitle>
    <CardDescription className="text-sm">
     Status: {" "}
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
    <CardContent className="pt-0">
    <div className="space-y-2">
     <div className="flex items-center gap-1.5">
     {userEntry.ipfsProofCid.includes("twitter.com") ||
     userEntry.ipfsProofCid.includes("x.com") ? (
     <>
      <ExternalLink className="w-3 h-3 text-muted-foreground" />
      <span className="text-xs">X Post: </span>
      <a
      href={userEntry.ipfsProofCid}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
      View Post
      </a>
     </>
     ) : (
     <>
      <FileText className="w-3 h-3 text-muted-foreground" />
      <span className="text-xs">IPFS: {userEntry.ipfsProofCid}</span>
     </>
     )}
     </div>
     {userEntry.feedback && (
     <div className="mt-2 p-2 bg-white rounded-lg">
     <strong className="text-xs">Feedback:</strong>
     <p className="text-xs text-muted-foreground mt-0.5">
      {userEntry.feedback}
     </p>
     </div>
     )}
    </div>
    </CardContent>
    </Card>
   ) : (
    <Card className="rounded-[1.5rem] border-primary/20 bg-primary/5 shadow-md transition-all duration-300">
    <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
     <Send className="w-4 h-4" />
     Submit Your Entry
    </CardTitle>
    <CardDescription className="text-sm">
     Provide proof of your social media engagement to qualify for rewards
    </CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-3">
     <div className="space-y-1.5">
     <Label htmlFor="twitterUrl" className="text-xs">X Post URL</Label>
     <div className="relative">
     <ExternalLink className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
     <Input
      id="twitterUrl"
      type="url"
      placeholder="https://x.com/..."
      value={newEntry.twitterUrl}
      onChange={(e) =>
      setNewEntry({ ...newEntry, twitterUrl: e.target.value })
      }
      className="pl-8 text-sm h-8"
     />
     </div>
     </div>

     <div className="space-y-1.5">
     <Label htmlFor="proofImage" className="text-xs">Upload Proof Image *</Label>

     {!uploadedProofImage ? (
     <div className="border-2 border-dashed rounded-lg p-4 transition-colors border-muted-foreground/25 hover:border-muted-foreground/50">
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
      <div className="w-10 h-10 mb-2 bg-muted rounded-full flex items-center justify-center">
      <Upload className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium mb-1">
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
      className="w-full h-32 object-cover rounded-lg border"
      />
      <Button
      type="button"
      variant="destructive"
      size="icon"
      onClick={() => setUploadedProofImage(null)}
      className="absolute -top-2 -right-2 w-6 h-6"
      >
      <X className="w-3 h-3" />
      </Button>
      <div className="text-xs text-muted-foreground mt-1 truncate">
      {uploadedProofImage.name}
      </div>
     </div>
     )}

     <p className="text-xs text-muted-foreground">
     Upload a screenshot or proof image (will be uploaded to IPFS)
     </p>
     </div>

     <div className="space-y-1.5">
     <Label htmlFor="notes" className="text-xs">Additional Notes (Optional)</Label>
     <Textarea
     id="notes"
     placeholder="Any additional information..."
     value={newEntry.description}
     onChange={(e) =>
      setNewEntry({ ...newEntry, description: e.target.value })
     }
     rows={2}
     className="text-sm resize-none"
     />
     </div>

     <Button
     onClick={submitEntry}
     disabled={(!uploadedProofImage && !newEntry.ipfsProofCid.trim()) || isPending || isConfirming || isUploadingProof}
     className="w-full"
     size="sm"
     >
     {isUploadingProof ? (
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
      Submit Entry
     </>
     )}
     </Button>
    </div>
    </CardContent>
    </Card>
   )}
   </div>
   )}

   {/* Entries List */}
   {entries.length > 0 && (
   <div>
   <h3 className="text-sm font-semibold mb-2">
    All Entries ({entries.length})
   </h3>
   <div className="space-y-2">
    {entries.map((entry, index) => (
    <Card key={index} className="rounded-[1.25rem] transition-all duration-300 ">
    <CardContent className="py-3 px-4">
     <div className="flex justify-between items-start">
     <div className="flex-1">
     <div className="flex items-center gap-2 mb-2">
      <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center">
      <span className="text-[10px] font-medium">
      {entry.solver.slice(0, 2).toUpperCase()}
      </span>
      </div>
      <span className="text-sm font-medium">
      {formatAddress(entry.solver)}
      </span>
      <Badge
      variant={
      entry.status === 1
       ? "default"
       : entry.status === 2
       ? "destructive"
       : "secondary"
      }
      className="text-xs"
      >
      {entry.status === 1
      ? "Approved"
      : entry.status === 2
      ? "Rejected"
      : "Pending"}
      </Badge>
     </div>
     <div className="text-xs text-muted-foreground space-y-0.5">
      <div className="flex items-center gap-1.5">
      {entry.ipfsProofCid.includes("twitter.com") ||
      entry.ipfsProofCid.includes("x.com") ? (
      <>
       <ExternalLink className="w-3 h-3" />
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
       <FileText className="w-3 h-3" />
       <span>IPFS: {entry.ipfsProofCid}</span>
      </>
      )}
      </div>
      <div className="flex items-center gap-1.5">
      <Calendar className="w-3 h-3" />
      <span>
      Submitted: {new Date(entry.timestamp * 1000).toLocaleDateString()}
      </span>
      </div>
      {entry.feedback && (
      <div className="mt-1.5 p-2 bg-muted rounded text-xs">
      <strong>Feedback:</strong> {entry.feedback}
      </div>
      )}
     </div>
     </div>
     {!(entry.ipfsProofCid.includes("twitter.com") || entry.ipfsProofCid.includes("x.com")) && (
     <Button variant="outline" size="sm" className="h-7" asChild>
      <a
      href={`https://ipfs.io/ipfs/${entry.ipfsProofCid}`}
      target="_blank"
      rel="noopener noreferrer"
      >
      <ExternalLink className="w-3 h-3 mr-1" />
      <span className="text-xs">View</span>
      </a>
     </Button>
     )}
     </div>
    </CardContent>
    </Card>
    ))}
   </div>
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
 </div>
 );
}
