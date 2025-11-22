"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import {
 CONTRACT_ADDRESSES,
 CROWDFUNDING_ABI,
 BASE_SEPOLIA_CHAIN_ID,
} from "../../../../utils/contracts";
import { formatETH, formatAddress, wagmiConfig, parseETH } from "../../../../utils/web3";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
 ChevronLeft,
 ChevronRight,
 Share2,
 Target,
 Calendar,
 TrendingUp,
 Users,
 Wallet,
 CheckCircle,
 Clock,
 ArrowRight,
 Loader2,
} from "lucide-react";

enum CampaignStatus {
 ACTIVE = 0,
 SUCCESSFUL = 1,
 FAILED = 2,
 CANCELLED = 3,
}

enum MilestoneStatus {
 PENDING = 0,
 RELEASED = 1,
 WITHDRAWN = 2,
}

interface Milestone {
 description: string;
 amount: bigint;
 status: MilestoneStatus;
}

interface Contributor {
 contributor: string;
 amount: bigint;
 refunded: boolean;
}

interface Campaign {
 id: number;
 creator: string;
 title: string;
 description: string;
 goal: bigint;
 raisedAmount: bigint;
 deadline: bigint;
 status: CampaignStatus;
 createdAt: bigint;
 milestoneCount: number;
}

export default function CrowdfundingDetailPage() {
 const params = useParams();
 const router = useRouter();
 const { address } = useAccount();
 const { writeContract, data: hash, isPending } = useWriteContract();
 const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
 const { showAlert, showConfirm } = useAlertDialog();

 const campaignId = params.id as string;
 const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding;

 const [campaign, setCampaign] = useState<Campaign | null>(null);
 const [milestones, setMilestones] = useState<Milestone[]>([]);
 const [contributors, setContributors] = useState<Contributor[]>([]);
 const [contributeAmount, setContributeAmount] = useState("");
 const [loading, setLoading] = useState(true);
 const [copied, setCopied] = useState(false);

 const isCreator = address && campaign && address.toLowerCase() === campaign.creator.toLowerCase();
 const progressPercent = campaign
 ? Number((campaign.raisedAmount * BigInt(100)) / campaign.goal)
 : 0;
 const isExpired = campaign
 ? Date.now() / 1000 > Number(campaign.deadline)
 : false;

 // Load campaign data
 const loadCampaign = async () => {
 try {
 setLoading(true);

 // Load campaign info
 const campaignData = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "getCampaignInfo",
  args: [BigInt(campaignId)],
 });

 const [
  creator,
  title,
  projectDetails,
  socialAccounts,
  fundingGoal,
  totalRaised,
  deadline,
  createdAt,
  status,
  totalWithdrawn,
 ] = campaignData as [
  string,
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  number,
  bigint
 ];

 // Get milestone count separately
 const milestoneCount = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "getMilestoneCount",
  args: [BigInt(campaignId)],
 });

 setCampaign({
  id: Number(campaignId),
  creator,
  title,
  description: projectDetails,
  goal: fundingGoal,
  raisedAmount: totalRaised,
  deadline,
  status,
  createdAt,
  milestoneCount: Number(milestoneCount),
 });

 // Load milestones
 const milestonesData: Milestone[] = [];
 for (let i = 0; i < Number(milestoneCount); i++) {
  const milestone = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "getMilestone",
  args: [BigInt(campaignId), BigInt(i)],
  });
  const [description, amount, status] = milestone as [string, bigint, number];
  milestonesData.push({ description, amount, status });
 }
 setMilestones(milestonesData);

 // Load contributors
 try {
  const contributionCount = await readContract(wagmiConfig, {
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "getContributionCount",
  args: [BigInt(campaignId)],
  });

  console.log(`Loading ${contributionCount} contributors for campaign ${campaignId}`);

  const contributorsData: Contributor[] = [];
  for (let i = 0; i < Number(contributionCount); i++) {
  try {
  const contrib = await readContract(wagmiConfig, {
   address: contractAddress as `0x${string}`,
   abi: CROWDFUNDING_ABI,
   functionName: "getContribution",
   args: [BigInt(campaignId), BigInt(i)],
  });
  console.log(`Contributor ${i}:`, contrib);
  const [contributor, amount, timestamp, refunded] = contrib as [string, bigint, bigint, boolean];
  contributorsData.push({ contributor, amount, refunded });
  } catch (error) {
  console.error(`❌ Failed to load contributor ${i}:`, error);
  // Still continue loading other contributors
  }
  }
  console.log(`✅ Successfully loaded ${contributorsData.length} out of ${contributionCount} contributors`);
  setContributors(contributorsData);
 } catch (error) {
  console.error("❌ Error loading contributors:", error);
 }
 } catch (error) {
 console.error("Error loading campaign:", error);
 showAlert({
  title: "Error",
  description: "Failed to load campaign details",
  variant: "destructive",
 });
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (campaignId && contractAddress) {
 loadCampaign();
 }
 }, [campaignId, contractAddress, isConfirmed]);

 // Handle contribute
 const handleContribute = async () => {
 if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
 showAlert({
  title: "Invalid Amount",
  description: "Please enter a valid contribution amount",
  variant: "warning",
 });
 return;
 }

 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "contribute",
  args: [BigInt(campaignId)],
  value: parseETH(contributeAmount),
 });
 setContributeAmount("");
 } catch (error) {
 console.error("Error contributing:", error);
 showAlert({
  title: "Transaction Failed",
  description: "Failed to contribute to campaign",
  variant: "destructive",
 });
 }
 };

 // Handle release milestone
 const handleReleaseMilestone = async (milestoneId: number) => {
 const confirmed = await showConfirm({
 title: "Release Milestone",
 description: `Release milestone ${milestoneId + 1} for withdrawal?`,
 confirmText: "Release",
 cancelText: "Cancel",
 });

 if (!confirmed) return;

 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "releaseMilestone",
  args: [BigInt(campaignId), BigInt(milestoneId)],
 });
 } catch (error) {
 console.error("Error releasing milestone:", error);
 showAlert({
  title: "Transaction Failed",
  description: "Failed to release milestone",
  variant: "destructive",
 });
 }
 };

 // Handle withdraw milestone
 const handleWithdrawMilestone = async (milestoneId: number) => {
 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "withdrawMilestone",
  args: [BigInt(campaignId), BigInt(milestoneId)],
 });
 } catch (error) {
 console.error("Error withdrawing milestone:", error);
 showAlert({
  title: "Transaction Failed",
  description: "Failed to withdraw milestone",
  variant: "destructive",
 });
 }
 };

 // Handle refund
 const handleRefund = async () => {
 const confirmed = await showConfirm({
 title: "Claim Refund",
 description: "Are you sure you want to claim your refund?",
 confirmText: "Claim Refund",
 cancelText: "Cancel",
 });

 if (!confirmed) return;

 try {
 writeContract({
  address: contractAddress as `0x${string}`,
  abi: CROWDFUNDING_ABI,
  functionName: "claimRefund",
  args: [BigInt(campaignId)],
 });
 } catch (error) {
 console.error("Error claiming refund:", error);
 showAlert({
  title: "Transaction Failed",
  description: "Failed to claim refund",
  variant: "destructive",
 });
 }
 };

 // Copy link
 const copyLink = () => {
 const url = window.location.href;
 navigator.clipboard.writeText(url);
 setCopied(true);
 showAlert({
 title: "Link Copied!",
 description: "Campaign link copied to clipboard",
 variant: "success",
 });
 setTimeout(() => setCopied(false), 2000);
 };

 if (loading) {
 return (
 <div className="flex min-h-screen items-center justify-center p-4">
  <div className="text-center rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-[#0EA885]" />
  <p className="text-muted-foreground mt-6 text-sm sm:text-base">Loading campaign...</p>
  </div>
 </div>
 );
 }

 if (!campaign) {
 return (
 <div className="flex min-h-screen items-center justify-center p-4">
  <div className="text-center rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-8 sm:p-12 max-w-md">
  <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Campaign not found</h2>
  <p className="text-muted-foreground mb-6 text-sm sm:text-base">The campaign you're looking for doesn't exist.</p>
  <Button onClick={() => router.push("/funding")} className="rounded-[0.75rem] transition-all duration-300">
  Back to Funding
  </Button>
  </div>
 </div>
 );
 }

 const statusColor =
 campaign.status === CampaignStatus.SUCCESSFUL
 ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
 : campaign.status === CampaignStatus.FAILED
 ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400"
 : campaign.status === CampaignStatus.CANCELLED
 ? "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400"
 : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400";

 const statusLabel =
 campaign.status === CampaignStatus.ACTIVE
 ? "Active"
 : campaign.status === CampaignStatus.SUCCESSFUL
 ? "Successful"
 : campaign.status === CampaignStatus.FAILED
 ? "Failed"
 : "Cancelled";

 return (
 <div className="min-h-screen relative">
 <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
  {/* Breadcrumb */}
  <div className="mb-6 sm:mb-8">
  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300">
  <button
   onClick={() => router.push("/funding")}
   className="flex items-center gap-1.5 text-sm font-medium hover:text-[#0EA885] transition-all duration-300 "
  >
   <ChevronLeft className="h-4 w-4" />
   Funding
  </button>
  <ChevronRight className="h-4 w-4 text-foreground/40" />
  <span className="text-sm text-muted-foreground font-medium">Crowdfunding</span>
  <ChevronRight className="h-4 w-4 text-foreground/40" />
  <span className="text-sm font-semibold text-[#0EA885]">#{campaign.id}</span>
  </div>
  </div>

 {/* Header */}
 <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div className="flex-1">
  <h1 className="mb-2 text-3xl font-bold">{campaign.title}</h1>
  <p className="text-muted-foreground">
  by {formatAddress(campaign.creator)}
  </p>
  </div>
  <div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={copyLink}>
  <Share2 className="mr-1 h-4 w-4" />
  {copied ? "Copied!" : "Share"}
  </Button>
  <Badge className={statusColor}>{statusLabel}</Badge>
  </div>
 </div>

 {/* Stats Grid */}
 <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 ">
  <CardContent className="p-4">
  <div className="flex items-start justify-between">
   <div>
   <p className="text-xs text-muted-foreground">Raised</p>
   <p className="text-xl font-bold">{formatETH(campaign.raisedAmount)} ETH</p>
   </div>
   <div className="rounded-lg bg-primary/10 p-2">
   <Wallet className="h-5 w-5 text-primary" />
   </div>
  </div>
  </CardContent>
  </Card>

  <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 ">
  <CardContent className="p-4">
  <div className="flex items-start justify-between">
   <div>
   <p className="text-xs text-muted-foreground">Goal</p>
   <p className="text-xl font-bold">{formatETH(campaign.goal)} ETH</p>
   </div>
   <div className="rounded-lg bg-green-500/10 p-2">
   <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
   </div>
  </div>
  </CardContent>
  </Card>

  <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 ">
  <CardContent className="p-4">
  <div className="flex items-start justify-between">
   <div>
   <p className="text-xs text-muted-foreground">Contributors</p>
   <p className="text-xl font-bold">{contributors.length}</p>
   </div>
   <div className="rounded-lg bg-blue-500/10 p-2">
   <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
   </div>
  </div>
  </CardContent>
  </Card>

  <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 ">
  <CardContent className="p-4">
  <div className="flex items-start justify-between">
   <div>
   <p className="text-xs text-muted-foreground">Deadline</p>
   <p className="text-sm font-bold">
   {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
   </p>
   {isExpired && (
   <Badge variant="destructive" className="mt-1 text-xs">
    Expired
   </Badge>
   )}
   </div>
   <div className="rounded-lg bg-amber-500/10 p-2">
   <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
   </div>
  </div>
  </CardContent>
  </Card>
 </div>

 {/* Progress Bar */}
 <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 mb-6">
  <CardContent className="p-4">
  <div className="mb-2 flex items-center justify-between text-sm">
  <span className="text-muted-foreground">Campaign Progress</span>
  <span className="font-bold">{progressPercent}%</span>
  </div>
  <Progress value={progressPercent} className="h-3" />
  </CardContent>
 </Card>

 {/* Description */}
 <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 mb-6">
  <CardContent className="p-4">
  <h2 className="mb-3 text-lg font-bold">Campaign Description</h2>
  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
  {campaign.description}
  </p>
  </CardContent>
 </Card>

 {/* Milestones */}
 <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 mb-6">
  <CardContent className="p-4">
  <h2 className="mb-4 text-lg font-bold">Milestones</h2>
  <div className="space-y-3">
  {milestones.map((milestone, idx) => (
   <Card key={idx} className="rounded-[1.25rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300">
   <CardContent className="py-3">
   <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
    <div className="mb-1 flex items-center gap-2">
    <Badge variant="outline">{`Milestone ${idx + 1}`}</Badge>
    <Badge
     variant={
     milestone.status === MilestoneStatus.WITHDRAWN
     ? "default"
     : milestone.status === MilestoneStatus.RELEASED
     ? "secondary"
     : "outline"
     }
    >
     {milestone.status === MilestoneStatus.PENDING
     ? "Pending"
     : milestone.status === MilestoneStatus.RELEASED
     ? "Released"
     : "Withdrawn"}
    </Badge>
    </div>
    <p className="text-sm">{milestone.description}</p>
    <p className="mt-1 text-xs text-muted-foreground">
    Amount: {formatETH(milestone.amount)} ETH
    </p>
    </div>

    {isCreator &&
    campaign.status === CampaignStatus.SUCCESSFUL && (
    <div className="flex gap-2">
     {/* Show Release button if milestone is PENDING and previous milestone is not PENDING */}
     {milestone.status === MilestoneStatus.PENDING &&
     (idx === 0 ||
     milestones[idx - 1].status !==
      MilestoneStatus.PENDING) && (
     <Button
      size="sm"
      variant="outline"
      onClick={() => handleReleaseMilestone(idx)}
      disabled={isPending}
     >
      <ArrowRight className="mr-1 h-3 w-3" />
      Release
     </Button>
     )}

     {/* Show Withdraw button if milestone is RELEASED */}
     {milestone.status === MilestoneStatus.RELEASED && (
     <Button
     size="sm"
     variant="default"
     onClick={() => handleWithdrawMilestone(idx)}
     disabled={isPending}
     >
     <Wallet className="mr-1 h-3 w-3" />
     Withdraw
     </Button>
     )}

     {/* Show checkmark if WITHDRAWN */}
     {milestone.status === MilestoneStatus.WITHDRAWN && (
     <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
     <CheckCircle className="h-4 w-4" />
     <span>Withdrawn</span>
     </div>
     )}
    </div>
    )}
   </div>
   </CardContent>
   </Card>
  ))}
  </div>
  </CardContent>
 </Card>

 {/* Contribute Section (for non-creators, if active) */}
 {!isCreator &&
  campaign.status === CampaignStatus.ACTIVE &&
  !isExpired && (
  <Card className="rounded-[1.5rem] border-primary/20 bg-primary/5 mb-6 shadow-md transition-all duration-300">
  <CardContent className="p-4">
   <h2 className="mb-4 text-lg font-bold">Contribute to Campaign</h2>
   <div className="space-y-3">
   <div>
   <Label htmlFor="contributeAmount">Amount (ETH)</Label>
   <Input
    id="contributeAmount"
    type="number"
    step="0.001"
    placeholder="0.0"
    value={contributeAmount}
    onChange={(e) => setContributeAmount(e.target.value)}
   />
   </div>
   <Button
   onClick={handleContribute}
   disabled={isPending || !contributeAmount}
   className="w-full"
   >
   <TrendingUp className="mr-2 h-4 w-4" />
   {isPending ? "Contributing..." : "Contribute"}
   </Button>
   </div>
  </CardContent>
  </Card>
  )}

 {/* Refund Button (if failed and user is contributor) */}
 {campaign.status === CampaignStatus.FAILED &&
  contributors.some(
  (c) =>
  c.contributor.toLowerCase() === address?.toLowerCase() &&
  !c.refunded
  ) && (
  <Card className="rounded-[1.5rem] border-red-200 bg-red-50 mb-6 shadow-md transition-all duration-300">
  <CardContent className="p-4">
   <h2 className="mb-4 text-lg font-bold text-red-600 dark:text-red-400">
   Campaign Failed - Refund Available
   </h2>
   <Button
   onClick={handleRefund}
   disabled={isPending}
   variant="destructive"
   className="w-full"
   >
   Claim Refund
   </Button>
  </CardContent>
  </Card>
  )}

 {/* Contributors List */}
 {contributors.length > 0 && (
  <Card className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300">
  <CardContent className="p-4">
  <h2 className="mb-4 text-lg font-bold">
   Contributors ({contributors.length})
  </h2>
  <div className="space-y-2">
   {contributors.map((contrib, idx) => (
   <div
   key={idx}
   className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
   >
   <div className="flex items-center gap-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
    <Users className="h-4 w-4 text-primary" />
    </div>
    <span className="text-sm font-medium">
    {formatAddress(contrib.contributor)}
    </span>
   </div>
   <div className="flex items-center gap-2">
    <span className="text-sm font-bold">
    {formatETH(contrib.amount)} ETH
    </span>
    {contrib.refunded && (
    <Badge variant="outline" className="text-xs">
    Refunded
    </Badge>
    )}
   </div>
   </div>
   ))}
  </div>
  </CardContent>
  </Card>
 )}
 </div>
 </div>
 );
}
