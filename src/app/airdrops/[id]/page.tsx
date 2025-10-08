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
  SOMNIA_TESTNET_ID,
} from "../../../utils/contracts";
import { formatSTT, formatTimeLeft, formatAddress, wagmiConfig } from "../../../utils/web3";
import { IpfsImage } from "../../../utils/ipfs";
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

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Load airdrop data
  const loadAirdrop = async () => {
    try {
      setIsLoading(true);
      const airdropData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].AirdropBounty as `0x${string}`,
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
          address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].AirdropBounty as `0x${string}`,
          abi: AIRDROP_ABI,
          functionName: "getEntryCount",
          args: [BigInt(airdropId)],
        });

        const loadedEntries: Entry[] = [];
        for (let i = 0; i < Number(entryCount); i++) {
          const entryData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].AirdropBounty as `0x${string}`,
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
    }
  }, [isConfirmed]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitEntry = async () => {
    if (!newEntry.ipfsProofCid.trim()) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES[SOMNIA_TESTNET_ID].AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "submitEntry",
        args: [BigInt(airdropId), newEntry.ipfsProofCid],
      });
    } catch (error) {
      console.error("Error submitting entry:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <TetrisLoading size="md" speed="fast" />
          <p className="text-muted-foreground mt-6">Loading airdrop...</p>
        </div>
      </div>
    );
  }

  if (!airdrop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Airdrop not found</h2>
          <p className="text-muted-foreground mb-4">The airdrop you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/airdrops")}>
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
                onClick={() => router.push("/airdrops")}
                className="cursor-pointer hover:text-foreground transition-colors"
              >
                Airdrops
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Airdrop #{airdropId}</BreadcrumbPage>
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
                <div className="mt-3">
                  <IpfsImage
                    cid={airdrop.imageUrl.replace("ipfs://", "")}
                    alt={airdrop.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Coins className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-muted-foreground">Reward Per User</span>
                  </div>
                  <p className="text-base font-bold text-green-600">
                    {formatSTT(airdrop.perQualifier)} STT
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Participants</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {airdrop.qualifiersCount} / {airdrop.maxQualifiers}
                  </p>
                  <Progress value={progress} className="h-1 mt-1.5" />
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Deadline</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatTimeLeft(BigInt(airdrop.deadline))}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Total Budget</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatSTT(airdrop.totalAmount)} STT
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
                    <Card className="bg-blue-50 border-blue-200">
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
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">IPFS: {userEntry.ipfsProofCid}</span>
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
                    <Card className="border-primary/20 bg-primary/5">
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
                            <Label htmlFor="twitterUrl" className="text-xs">Twitter/X Post URL</Label>
                            <div className="relative">
                              <ExternalLink className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input
                                id="twitterUrl"
                                type="url"
                                placeholder="https://twitter.com/..."
                                value={newEntry.twitterUrl}
                                onChange={(e) =>
                                  setNewEntry({ ...newEntry, twitterUrl: e.target.value })
                                }
                                className="pl-8 text-sm h-8"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="ipfsProof" className="text-xs">IPFS Proof CID *</Label>
                            <Input
                              id="ipfsProof"
                              placeholder="QmExample123..."
                              value={newEntry.ipfsProofCid}
                              onChange={(e) =>
                                setNewEntry({ ...newEntry, ipfsProofCid: e.target.value })
                              }
                              required
                              className="text-sm h-8"
                            />
                            <p className="text-xs text-muted-foreground">
                              Upload screenshots or proof to IPFS and paste the CID here
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
                            disabled={!newEntry.ipfsProofCid.trim() || isPending || isConfirming}
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
                      <Card key={index}>
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
                                  <FileText className="w-3 h-3" />
                                  <span>IPFS: {entry.ipfsProofCid}</span>
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
