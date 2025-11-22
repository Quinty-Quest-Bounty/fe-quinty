"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import {
 CONTRACT_ADDRESSES,
 LOOKING_FOR_GRANT_ABI,
 BASE_SEPOLIA_CHAIN_ID,
} from "../../../../utils/contracts";
import { formatETH, formatAddress, wagmiConfig, parseETH } from "../../../../utils/web3";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "../../../../components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import { Separator } from "../../../../components/ui/separator";
import { Progress } from "../../../../components/ui/progress";
import {
 ChevronRight,
 Clock,
 Users,
 DollarSign,
 Copy,
 Check,
 Send,
 TrendingUp,
 ExternalLink,
 Share2,
 Loader2,
} from "lucide-react";

enum RequestStatus {
 ACTIVE = 0,
 FUNDED = 1,
 CANCELLED = 2,
}

interface Supporter {
 supporter: string;
 amount: bigint;
 timestamp: bigint;
}

interface Update {
 author: string;
 content: string;
 timestamp: bigint;
}

interface FundingRequest {
 id: number;
 creator: string;
 title: string;
 projectDetails: string;
 progress: string;
 socialAccounts: string;
 offering: string;
 fundingGoal: bigint;
 raisedAmount: bigint;
 deadline: bigint;
 status: RequestStatus;
 createdAt: bigint;
}

export default function LookingForGrantDetailPage() {
 const params = useParams();
 const router = useRouter();
 const { address } = useAccount();
 const { showAlert } = useAlertDialog();
 const requestId = params.id as string;

 const [request, setRequest] = useState<FundingRequest | null>(null);
 const [supporters, setSupporters] = useState<Supporter[]>([]);
 const [updates, setUpdates] = useState<Update[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [copied, setCopied] = useState(false);
 const [supportAmount, setSupportAmount] = useState("");
 const [updateContent, setUpdateContent] = useState("");
 const [withdrawAmount, setWithdrawAmount] = useState("");

 const { writeContract, data: hash, isPending } = useWriteContract();
 const { isLoading: isConfirming, isSuccess: isConfirmed } =
 useWaitForTransactionReceipt({ hash });

 const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant;

 // Load request data
 const loadRequest = async () => {
 try {
 setIsLoading(true);
 const requestData = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "getRequestInfo",
  args: [BigInt(requestId)],
 });

 if (requestData) {
  const [
  creator,
  title,
  projectDetails,
  progress,
  socialAccounts,
  offering,
  fundingGoal,
  raisedAmount,
  deadline,
  status,
  createdAt,
  ] = requestData as any;

  setRequest({
  id: parseInt(requestId),
  creator,
  title,
  projectDetails,
  progress,
  socialAccounts,
  offering,
  fundingGoal,
  raisedAmount,
  deadline,
  status,
  createdAt,
  });

  // Load supporters
  const supporterCount = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "getSupporterCount",
  args: [BigInt(requestId)],
  });

  const loadedSupporters: Supporter[] = [];
  for (let i = 0; i < Number(supporterCount); i++) {
  const supporterData = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "getSupporter",
  args: [BigInt(requestId), BigInt(i)],
  });
  const [supporter, amount, timestamp] = supporterData as any;
  loadedSupporters.push({ supporter, amount, timestamp });
  }
  setSupporters(loadedSupporters);

  // Load updates
  const updateCount = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "getUpdateCount",
  args: [BigInt(requestId)],
  });

  const loadedUpdates: Update[] = [];
  for (let i = 0; i < Number(updateCount); i++) {
  const updateData = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "getUpdate",
  args: [BigInt(requestId), BigInt(i)],
  });
  const [author, content, timestamp] = updateData as any;
  loadedUpdates.push({ author, content, timestamp });
  }
  setUpdates(loadedUpdates);
 }
 } catch (error) {
 console.error("Error loading request:", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 if (requestId) {
 loadRequest();
 }
 }, [requestId]);

 useEffect(() => {
 if (isConfirmed) {
 loadRequest();
 setSupportAmount("");
 setUpdateContent("");
 setWithdrawAmount("");
 }
 }, [isConfirmed]);

 const copyLink = () => {
 const url = window.location.href;
 navigator.clipboard.writeText(url);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const handleSupport = async () => {
 if (!supportAmount || parseFloat(supportAmount) <= 0) {
 showAlert({
  title: "Invalid Amount",
  description: "Please enter a valid support amount",
  variant: "warning",
 });
 return;
 }

 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "supportRequest",
  args: [BigInt(requestId)],
  value: parseETH(supportAmount),
 });
 } catch (error) {
 console.error("Error supporting request:", error);
 }
 };

 const handlePostUpdate = async () => {
 if (!updateContent) {
 showAlert({
  title: "Missing Content",
  description: "Please enter update content",
  variant: "warning",
 });
 return;
 }

 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "postUpdate",
  args: [BigInt(requestId), updateContent],
 });
 } catch (error) {
 console.error("Error posting update:", error);
 }
 };

 const handleWithdraw = async () => {
 if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
 showAlert({
  title: "Invalid Amount",
  description: "Please enter a valid withdrawal amount",
  variant: "warning",
 });
 return;
 }

 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: LOOKING_FOR_GRANT_ABI,
  functionName: "withdrawFunds",
  args: [BigInt(requestId), parseETH(withdrawAmount)],
 });
 } catch (error) {
 console.error("Error withdrawing funds:", error);
 }
 };

 if (isLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
  <p className="text-muted-foreground mt-4">Loading funding request...</p>
  </div>
 </div>
 );
 }

 if (!request) {
 return (
 <div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
  <h2 className="text-2xl font-bold mb-2">Request not found</h2>
  <p className="text-muted-foreground mb-4">The funding request you're looking for doesn't exist.</p>
  <Button onClick={() => router.push("/funding")}>
  Back to Funding
  </Button>
  </div>
 </div>
 );
 }

 const isCreator = address?.toLowerCase() === request.creator.toLowerCase();
 const isExpired = Date.now() / 1000 > Number(request.deadline);
 const progress = request.fundingGoal > BigInt(0)
 ? Math.min((Number(request.raisedAmount) / Number(request.fundingGoal)) * 100, 100)
 : 0;

 const statusLabels = ["Active", "Funded", "Cancelled"];
 const statusColors = ["default", "default", "destructive"];

 // Parse project links
 const projectLinks = request.projectDetails.includes("\n\nLinks:")
 ? request.projectDetails.split("\n\nLinks:")[1].trim().split("\n")
 : [];
 const projectDescription = request.projectDetails.split("\n\nLinks:")[0];

 return (
 <div className="min-h-screen relative">
 {/* Loading Overlay */}
 {(isPending || isConfirming) && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
  <div className="p-8 rounded-[2rem] shadow-lg border border-white/60 bg-white/70 backdrop-blur-xl">
  <div className="flex flex-col items-center gap-6">
   <Loader2 className="h-12 w-12 animate-spin text-primary" />
   <div className="text-center">
   <p className="font-semibold text-lg">
   {isPending ? "Waiting for approval..." : "Confirming transaction..."}
   </p>
   <p className="text-sm text-muted-foreground mt-1">
   Please don't close this page
   </p>
   </div>
  </div>
  </div>
  </div>
 )}

 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  {/* Breadcrumb */}
  <Breadcrumb className="mb-6">
  <BreadcrumbList>
  <BreadcrumbItem>
   <BreadcrumbLink
   onClick={() => router.push("/")}
   className="cursor-pointer hover:text-foreground transition-colors"
   >
   Home
   </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator>
   <ChevronRight className="h-4 w-4" />
  </BreadcrumbSeparator>
  <BreadcrumbItem>
   <BreadcrumbLink
   onClick={() => router.push("/funding")}
   className="cursor-pointer hover:text-foreground transition-colors"
   >
   Funding
   </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator>
   <ChevronRight className="h-4 w-4" />
  </BreadcrumbSeparator>
  <BreadcrumbItem>
   <BreadcrumbPage>LFG #{requestId}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

  {/* Main Content */}
  <div className="space-y-6">
  {/* Header Card */}
  <Card className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 ">
  <CardHeader className="pb-3">
   <div className="flex justify-between items-start gap-3">
   <div className="flex-1">
   <div className="flex items-center gap-2 mb-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
    <TrendingUp className="h-4 w-4 text-blue-600" />
    </div>
    <div>
    <CardTitle className="text-lg">{request.title}</CardTitle>
    <div className="flex items-center gap-2 mt-1">
    <span className="text-xs text-muted-foreground">By</span>
    <Badge variant="outline" className="text-xs py-0 h-5">
     {formatAddress(request.creator)}
    </Badge>
    </div>
    </div>
   </div>
   </div>
   <div className="flex gap-2">
   <Badge variant={statusColors[request.status] as any} className="text-xs">
    {statusLabels[request.status]}
   </Badge>
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
    <Share2 className="w-3 h-3" />
    <span className="text-xs">Share</span>
    </>
    )}
   </Button>
   </div>
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
   <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[1.25rem] p-3 border border-green-200 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <DollarSign className="w-3 h-3 text-green-600" />
    <span className="text-xs font-medium text-muted-foreground">Raised</span>
   </div>
   <p className="text-base font-bold text-green-600">
    {formatETH(request.raisedAmount)} ETH
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <TrendingUp className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">Goal</span>
   </div>
   <p className="text-sm font-semibold">
    {formatETH(request.fundingGoal)} ETH
   </p>
   <Progress value={progress} className="h-1 mt-1.5" />
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Users className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">Supporters</span>
   </div>
   <p className="text-sm font-semibold">
    {supporters.length}
   </p>
   </div>

   <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 ">
   <div className="flex items-center gap-1 mb-1">
    <Clock className="w-3 h-3 text-muted-foreground" />
    <span className="text-xs font-medium text-muted-foreground">Deadline</span>
   </div>
   <p className="text-sm font-semibold">
    {isExpired ? "Expired" : new Date(Number(request.deadline) * 1000).toLocaleDateString()}
   </p>
   </div>
   </div>
  </CardHeader>

  <CardContent className="pt-3">
   {/* Project Details */}
   <div className="space-y-4">
   <div>
   <h3 className="text-sm font-semibold mb-2">Project Details</h3>
   <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
    {projectDescription}
   </p>
   </div>

   {projectLinks.length > 0 && (
   <div>
    <h3 className="text-sm font-semibold mb-2">Project Links</h3>
    <div className="space-y-1">
    {projectLinks.map((link, idx) => (
    <a
     key={idx}
     href={link.includes("http") ? link : `https://${link}`}
     target="_blank"
     rel="noopener noreferrer"
     className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
    >
     <ExternalLink className="w-3 h-3" />
     {link}
    </a>
    ))}
    </div>
   </div>
   )}

   {request.progress && (
   <div>
    <h3 className="text-sm font-semibold mb-2">Current Progress</h3>
    <p className="text-sm text-muted-foreground">{request.progress}</p>
   </div>
   )}

   {request.socialAccounts && (
   <div>
    <h3 className="text-sm font-semibold mb-2">Social Accounts</h3>
    <p className="text-sm text-muted-foreground">{request.socialAccounts}</p>
   </div>
   )}

   {request.offering && (
   <div>
    <h3 className="text-sm font-semibold mb-2">What Supporters Get</h3>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
    <p className="text-sm text-blue-900">{request.offering}</p>
    </div>
   </div>
   )}
   </div>

   <Separator className="my-4" />

   {/* Support Section */}
   {!isCreator && request.status === RequestStatus.ACTIVE && !isExpired && (
   <Card className="rounded-[1.5rem] border-primary/20 bg-primary/5 mb-4 shadow-md transition-all duration-300">
   <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
    <Send className="w-4 w-4" />
    Support This Project
    </CardTitle>
   </CardHeader>
   <CardContent className="pt-0">
    <div className="space-y-3">
    <div className="space-y-1.5">
    <Label htmlFor="supportAmount" className="text-xs">Amount (ETH)</Label>
    <Input
     id="supportAmount"
     type="number"
     step="0.01"
     placeholder="0.0"
     value={supportAmount}
     onChange={(e) => setSupportAmount(e.target.value)}
     className="text-sm h-8"
    />
    </div>
    <Button
    onClick={handleSupport}
    disabled={!supportAmount || isPending || isConfirming}
    className="w-full"
    size="sm"
    >
    {isPending || isConfirming ? "Processing..." : "Support Project"}
    </Button>
    </div>
   </CardContent>
   </Card>
   )}

   {/* Creator Actions */}
   {isCreator && (
   <div className="space-y-4 mb-4">
   <Card className="rounded-[1.5rem] border-green-200 bg-green-50 shadow-md transition-all duration-300">
    <CardHeader className="pb-3">
    <CardTitle className="text-base">Withdraw Funds</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-3">
    <div className="space-y-1.5">
     <Label htmlFor="withdrawAmount" className="text-xs">Amount (ETH)</Label>
     <Input
     id="withdrawAmount"
     type="number"
     step="0.01"
     placeholder="0.0"
     value={withdrawAmount}
     onChange={(e) => setWithdrawAmount(e.target.value)}
     className="text-sm h-8"
     />
     <p className="text-xs text-muted-foreground">
     Available: {formatETH(request.raisedAmount)} ETH
     </p>
    </div>
    <Button
     onClick={handleWithdraw}
     disabled={!withdrawAmount || isPending || isConfirming}
     className="w-full bg-green-600 hover:bg-green-700"
     size="sm"
    >
     Withdraw
    </Button>
    </div>
    </CardContent>
   </Card>

   <Card className="rounded-[1.5rem] shadow-md transition-all duration-300">
    <CardHeader className="pb-3">
    <CardTitle className="text-base">Post Update</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
    <div className="space-y-3">
    <Textarea
     placeholder="Share progress with your supporters..."
     value={updateContent}
     onChange={(e) => setUpdateContent(e.target.value)}
     rows={3}
     className="text-sm resize-none"
    />
    <Button
     onClick={handlePostUpdate}
     disabled={!updateContent || isPending || isConfirming}
     className="w-full"
     size="sm"
    >
     Post Update
    </Button>
    </div>
    </CardContent>
   </Card>
   </div>
   )}

   {/* Supporters List */}
   {supporters.length > 0 && (
   <div className="mb-4">
   <h3 className="text-sm font-semibold mb-2">
    Supporters ({supporters.length})
   </h3>
   <div className="space-y-2">
    {supporters.map((supporter, idx) => (
    <Card key={idx} className="rounded-[1.25rem] transition-all duration-300 ">
    <CardContent className="py-3 px-4">
     <div className="flex justify-between items-center">
     <span className="text-sm font-medium">
     {formatAddress(supporter.supporter)}
     </span>
     <div className="text-right">
     <p className="text-sm font-bold text-green-600">
      {formatETH(supporter.amount)} ETH
     </p>
     <p className="text-xs text-muted-foreground">
      {new Date(Number(supporter.timestamp) * 1000).toLocaleDateString()}
     </p>
     </div>
     </div>
    </CardContent>
    </Card>
    ))}
   </div>
   </div>
   )}

   {/* Updates */}
   {updates.length > 0 && (
   <div>
   <h3 className="text-sm font-semibold mb-2">
    Project Updates ({updates.length})
   </h3>
   <div className="space-y-3">
    {updates.map((update, idx) => {
    const contentParts = update.content.split('\n\nImage: ');
    const textContent = contentParts[0];
    const imageUrl = contentParts[1];

    return (
    <Card key={idx} className="rounded-[1.25rem] transition-all duration-300 ">
     <CardContent className="py-3 px-4">
     <div className="mb-2">
     <div className="flex items-center gap-2 mb-1">
      <span className="text-xs font-medium">
      {formatAddress(update.author)}
      </span>
      <Badge variant="outline" className="text-xs h-4">
      {new Date(Number(update.timestamp) * 1000).toLocaleDateString()}
      </Badge>
     </div>
     <p className="text-sm whitespace-pre-wrap">{textContent}</p>
     </div>
     {imageUrl && (
     <div className="mt-2">
      <img
      src={imageUrl.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`
      : imageUrl}
      alt="Update image"
      className="max-w-full h-auto rounded border"
      onError={(e) => {
      e.currentTarget.style.display = 'none';
      }}
      />
     </div>
     )}
     </CardContent>
    </Card>
    );
    })}
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
