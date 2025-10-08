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
  SOMNIA_TESTNET_ID,
} from "../../../utils/contracts";
import {
  formatSTT,
  formatTimeLeft,
  formatAddress,
  wagmiConfig,
} from "../../../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata } from "../../../utils/ipfs";
import { useAlert } from "../../../hooks/useAlert";
import TetrisLoading from "../../../components/ui/tetris-loader";
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
}

const BountyStatusEnum = [
  "Open",
  "Pending Reveal",
  "Resolved",
  "Disputed",
  "Expired",
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

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Load bounty data
  const loadBounty = async () => {
    try {
      setIsLoading(true);
      const bountyData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].Quinty as `0x${string}`,
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
        ] = bountyArray;

        // Get submissions
        const submissionCount = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID]
            .Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getSubmissionCount",
          args: [BigInt(bountyId)],
        });

        const submissions: Submission[] = [];
        for (let i = 0; i < Number(submissionCount); i++) {
          const submissionData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID]
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

  const submitSolution = async () => {
    if (!bounty || !submissionCid.trim()) return;
    const depositAmount = bounty.amount / BigInt(10);

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "submitSolution",
        args: [BigInt(bountyId), submissionCid],
        value: depositAmount,
      });
      setSubmissionCid("");
    } catch (error) {
      console.error("Error submitting solution:", error);
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
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].Quinty as `0x${string}`,
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
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].Quinty as `0x${string}`,
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
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].Quinty as `0x${string}`,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <TetrisLoading size="md" speed="fast" />
          <p className="text-muted-foreground mt-6">Loading bounty...</p>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Bounty not found</h2>
          <p className="text-muted-foreground mb-4">
            The bounty you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/bounties")}>
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
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay */}
      {(isPending || isConfirming) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg border">
            <div className="flex flex-col items-center gap-6">
              <TetrisLoading size="md" speed="fast" />
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
                onClick={() => router.push("/bounties")}
                className="cursor-pointer hover:text-foreground transition-colors"
              >
                Bounties
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Bounty #{bountyId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {metadata?.title || bounty.description.split("\n")[0]}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Created by
                        </span>
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {formatAddress(bounty.creator)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="text-xs">{statusLabel}</Badge>
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

              {/* Images */}
              {metadata?.images && metadata.images.length > 0 && (
                <div className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {metadata.images.map((cid, index) => (
                      <img
                        key={index}
                        src={`https://ipfs.io/ipfs/${cid}`}
                        alt={`Bounty image ${index + 1}`}
                        className="rounded-lg object-cover w-full h-32"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Bounty Reward
                    </span>
                  </div>
                  <p className="text-base font-bold text-primary">
                    {formatSTT(bounty.amount)} STT
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
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

                <div className="bg-muted/50 rounded-lg p-3">
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

                <div className="bg-muted/50 rounded-lg p-3">
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

              {/* Winners Display */}
              {bounty.status === 1 && bounty.selectedWinners.length > 0 && (
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
                                  {formatSTT(
                                    (bounty.amount * BigInt(winnerShare)) /
                                      BigInt(100)
                                  )}{" "}
                                  STT
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

              {/* Submit Solution Section */}
              {bounty.status === 0 && !isCreator && (
                <div className="mb-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Your Solution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Input
                            placeholder="Enter IPFS CID of your solution"
                            value={submissionCid}
                            onChange={(e) => setSubmissionCid(e.target.value)}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload your solution to IPFS and paste the CID here
                          </p>
                        </div>
                        <Button
                          onClick={submitSolution}
                          disabled={
                            isPending || isConfirming || !submissionCid.trim()
                          }
                          className="w-full"
                          size="sm"
                        >
                          {isPending || isConfirming ? (
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
                        className={`${
                          isWinner
                            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                            : ""
                        }`}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                              {isCreator && bounty.status === 0 && (
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

                              {isWinner && bounty.status === 1 && (
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

                          {/* Add Reply */}
                          {bounty.status === 0 &&
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

                          {/* Reveal Solution */}
                          {bounty.status === 1 &&
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
                          {bounty.status === 1 && sub.revealed && isWinner && (
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

                  {/* Select Winners Button */}
                  {isCreator &&
                    bounty.status === 0 &&
                    selectedSubmissions.length > 0 && (
                      <Card className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
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
