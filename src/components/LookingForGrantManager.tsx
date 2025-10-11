"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  LOOKING_FOR_GRANT_ABI,
  BASE_SEPOLIA_CHAIN_ID,
  ZK_VERIFICATION_ABI,
} from "../utils/contracts";
import { parseETH, formatETH, wagmiConfig } from "../utils/web3";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Rocket,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Edit,
  MessageSquare,
} from "lucide-react";

// Enums matching contract
enum RequestStatus {
  ACTIVE = 0,
  FUNDED = 1,
  CANCELLED = 2,
}

interface FundingRequest {
  id: number;
  requester: string;
  title: string;
  projectDetails: string;
  progress: string;
  socialAccounts: string;
  offering: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  createdAt: bigint;
  deadline: bigint;
  status: RequestStatus;
  supporterCount: number;
  userContribution: bigint;
}

interface Supporter {
  addr: string;
  amount: bigint;
  timestamp: bigint;
}

interface Update {
  author: string;
  content: string;
  timestamp: bigint;
}

const statusLabels = ["Active", "Funded", "Cancelled"];

export default function LookingForGrantManager() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "browse" | "my-requests">("browse");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundingRequest | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);

  // Form state
  const [newRequest, setNewRequest] = useState({
    title: "",
    projectDetails: "",
    progress: "",
    socialAccounts: "",
    offering: "",
    fundingGoal: "",
    deadline: "",
    projectLinks: "", // NEW: website, docs, demo links
  });

  // Support form state
  const [supportAmount, setSupportAmount] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateImage, setUpdateImage] = useState("");

  // Contract address
  const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant;
  const zkVerificationAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].ZKVerification;

  // Check if user is ZK verified
  useEffect(() => {
    async function checkVerification() {
      if (!address) return;
      try {
        const result = await readContract(wagmiConfig, {
          address: zkVerificationAddress as `0x${string}`,
          abi: ZK_VERIFICATION_ABI,
          functionName: "getVerification",
          args: [address],
        });
        const [verified] = result as [boolean, bigint, string, string];
        setIsVerified(verified);
      } catch (error) {
        console.error("Error checking verification:", error);
      }
    }
    checkVerification();
  }, [address, zkVerificationAddress]);

  // Watch for events
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: LOOKING_FOR_GRANT_ABI,
    eventName: "FundingRequestCreated",
    onLogs() {
      loadRequests();
    },
  });

  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: LOOKING_FOR_GRANT_ABI,
    eventName: "SupportReceived",
    onLogs() {
      loadRequests();
    },
  });

  // Load funding requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      const counter = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: LOOKING_FOR_GRANT_ABI,
        functionName: "requestCounter",
      });

      const requestsData: FundingRequest[] = [];
      for (let i = 1; i <= Number(counter); i++) {
        const info = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: LOOKING_FOR_GRANT_ABI,
          functionName: "getRequestInfo",
          args: [BigInt(i)],
        });

        const [
          requester,
          title,
          projectDetails,
          progress,
          socialAccounts,
          offering,
          fundingGoal,
          totalRaised,
          createdAt,
          deadline,
          status,
        ] = info as [string, string, string, string, string, string, bigint, bigint, bigint, bigint, number];

        const supporterCount = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: LOOKING_FOR_GRANT_ABI,
          functionName: "getSupporterCount",
          args: [BigInt(i)],
        });

        let userContribution = BigInt(0);
        if (address) {
          userContribution = await readContract(wagmiConfig, {
            address: contractAddress as `0x${string}`,
            abi: LOOKING_FOR_GRANT_ABI,
            functionName: "getSupporterContribution",
            args: [BigInt(i), address],
          }) as bigint;
        }

        requestsData.push({
          id: i,
          requester,
          title,
          projectDetails,
          progress,
          socialAccounts,
          offering,
          fundingGoal,
          totalRaised,
          createdAt,
          deadline,
          status,
          supporterCount: Number(supporterCount),
          userContribution,
        });
      }

      setRequests(requestsData);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadRequests();
    }
  }, [isConnected]);

  // Load supporters for selected request
  const loadSupporters = async (requestId: number) => {
    try {
      const count = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: LOOKING_FOR_GRANT_ABI,
        functionName: "getSupporterCount",
        args: [BigInt(requestId)],
      });

      const supportersData: Supporter[] = [];
      for (let i = 0; i < Number(count); i++) {
        const supporter = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: LOOKING_FOR_GRANT_ABI,
          functionName: "getSupporter",
          args: [BigInt(requestId), BigInt(i)],
        });
        const [addr, amount, timestamp] = supporter as [string, bigint, bigint];
        supportersData.push({ addr, amount, timestamp });
      }

      setSupporters(supportersData);
    } catch (error) {
      console.error("Error loading supporters:", error);
    }
  };

  // Load updates for selected request
  const loadUpdates = async (requestId: number) => {
    try {
      const count = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: LOOKING_FOR_GRANT_ABI,
        functionName: "getUpdateCount",
        args: [BigInt(requestId)],
      });

      const updatesData: Update[] = [];
      for (let i = 0; i < Number(count); i++) {
        const update = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: LOOKING_FOR_GRANT_ABI,
          functionName: "getUpdate",
          args: [BigInt(requestId), BigInt(i)],
        });
        const [author, content, timestamp] = update as [string, string, bigint];
        updatesData.push({ author, content, timestamp });
      }

      setUpdates(updatesData);
    } catch (error) {
      console.error("Error loading updates:", error);
    }
  };

  // Handle view request details
  const handleViewRequest = async (request: FundingRequest) => {
    setSelectedRequest(request);
    await loadSupporters(request.id);
    await loadUpdates(request.id);
  };

  // Handle create request
  const handleCreateRequest = async () => {
    if (!isVerified) {
      alert("You must be ZK verified to create a funding request");
      return;
    }

    if (!newRequest.title || !newRequest.projectDetails || !newRequest.fundingGoal) {
      alert("Please fill in all required fields");
      return;
    }

    const deadlineTimestamp = newRequest.deadline
      ? Math.floor(new Date(newRequest.deadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days default

    try {
      // Combine project details with links
      const fullProjectDetails = newRequest.projectLinks
        ? `${newRequest.projectDetails}\n\nLinks: ${newRequest.projectLinks}`
        : newRequest.projectDetails;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: LOOKING_FOR_GRANT_ABI,
        functionName: "createFundingRequest",
        args: [
          newRequest.title,
          fullProjectDetails,
          newRequest.progress,
          newRequest.socialAccounts,
          newRequest.offering,
          parseETH(newRequest.fundingGoal),
          BigInt(deadlineTimestamp),
        ],
      });

      // Reset form
      setNewRequest({
        title: "",
        projectDetails: "",
        progress: "",
        socialAccounts: "",
        offering: "",
        fundingGoal: "",
        deadline: "",
        projectLinks: "",
      });
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Failed to create funding request");
    }
  };

  // Handle support request
  const handleSupportRequest = async (requestId: number) => {
    if (!supportAmount || parseFloat(supportAmount) <= 0) {
      alert("Please enter a valid support amount");
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
      setSupportAmount("");
    } catch (error) {
      console.error("Error supporting request:", error);
      alert("Failed to support request");
    }
  };

  // Handle post update
  const handlePostUpdate = async (requestId: number) => {
    if (!updateContent) {
      alert("Please enter update content");
      return;
    }

    try {
      // Combine content with image URL if provided
      const fullContent = updateImage
        ? `${updateContent}\n\nImage: ${updateImage}`
        : updateContent;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: LOOKING_FOR_GRANT_ABI,
        functionName: "postUpdate",
        args: [BigInt(requestId), fullContent],
      });
      setUpdateContent("");
      setUpdateImage("");
    } catch (error) {
      console.error("Error posting update:", error);
      alert("Failed to post update");
    }
  };

  // Handle withdraw funds
  const handleWithdrawFunds = async (requestId: number, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid withdrawal amount");
      return;
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: LOOKING_FOR_GRANT_ABI,
        functionName: "withdrawFunds",
        args: [BigInt(requestId), parseETH(amount)],
      });
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      alert("Failed to withdraw funds");
    }
  };

  // Render verification warning
  const renderVerificationWarning = () => {
    if (isVerified) {
      return (
        <Alert className="mb-4 border-green-500 bg-green-50">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Verified Account</AlertTitle>
          <AlertDescription className="text-green-600">
            Your identity is verified. You can create funding requests.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="mb-4 border-amber-500 bg-amber-50">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700">Verification Required</AlertTitle>
        <AlertDescription className="text-amber-600">
          You must verify your identity to create funding requests. Click "Verify Identity" in the header.
        </AlertDescription>
      </Alert>
    );
  };

  // Render create form
  const renderCreateForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Create Funding Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderVerificationWarning()}

        <div className="space-y-2">
          <Label>Project Title *</Label>
          <Input
            placeholder="Enter project title"
            value={newRequest.title}
            onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Project Details (IPFS CID) *</Label>
          <Textarea
            placeholder="Enter IPFS CID for project details"
            value={newRequest.projectDetails}
            onChange={(e) => setNewRequest({ ...newRequest, projectDetails: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Current Progress</Label>
          <Textarea
            placeholder="Describe current progress (optional)"
            value={newRequest.progress}
            onChange={(e) => setNewRequest({ ...newRequest, progress: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Social Accounts</Label>
          <Input
            placeholder="Twitter, GitHub, etc."
            value={newRequest.socialAccounts}
            onChange={(e) => setNewRequest({ ...newRequest, socialAccounts: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Project Links</Label>
          <Textarea
            placeholder="Website, Demo, Documentation links (one per line)"
            value={newRequest.projectLinks}
            onChange={(e) => setNewRequest({ ...newRequest, projectLinks: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Add links to your website, demo, documentation, pitch deck, etc.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Offering to Investors</Label>
          <Textarea
            placeholder="What do you offer to supporters? (equity, tokens, rewards, etc.)"
            value={newRequest.offering}
            onChange={(e) => setNewRequest({ ...newRequest, offering: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Funding Goal (ETH) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.0"
              value={newRequest.fundingGoal}
              onChange={(e) => setNewRequest({ ...newRequest, fundingGoal: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Deadline (Optional)</Label>
            <Input
              type="datetime-local"
              value={newRequest.deadline}
              onChange={(e) => setNewRequest({ ...newRequest, deadline: e.target.value })}
            />
          </div>
        </div>

        <Button
          onClick={handleCreateRequest}
          disabled={isPending || !isVerified}
          className="w-full"
        >
          {isPending ? "Creating..." : "Create Funding Request"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Render request card
  const renderRequestCard = (request: FundingRequest) => {
    const progress = Number((request.totalRaised * BigInt(100)) / request.fundingGoal);
    const isExpired = Number(request.deadline) * 1000 < Date.now();

    return (
      <Card key={request.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{request.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">By {request.requester.slice(0, 6)}...{request.requester.slice(-4)}</span>
                <Badge variant={request.status === RequestStatus.ACTIVE ? "default" : "secondary"}>
                  {statusLabels[request.status]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-semibold">
                {formatETH(request.totalRaised)} / {formatETH(request.fundingGoal)} ETH
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} />
            <p className="text-xs text-muted-foreground">{progress}% funded</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{request.supporterCount} supporters</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {isExpired ? "Expired" : new Date(Number(request.deadline) * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          {request.userContribution > 0 && (
            <div className="bg-blue-50 p-2 rounded text-sm">
              Your contribution: {formatETH(request.userContribution)} ETH
            </div>
          )}

          <Button
            onClick={() => handleViewRequest(request)}
            variant="outline"
            className="w-full"
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Render request details dialog
  const renderRequestDetails = () => {
    if (!selectedRequest) return null;

    const isOwner = address?.toLowerCase() === selectedRequest.requester.toLowerCase();

    return (
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest.title}</DialogTitle>
            <DialogDescription>
              Requested by {selectedRequest.requester.slice(0, 10)}...{selectedRequest.requester.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Funding Progress</span>
                <span>{formatETH(selectedRequest.totalRaised)} / {formatETH(selectedRequest.fundingGoal)} ETH</span>
              </div>
              <Progress value={Math.min(Number((selectedRequest.totalRaised * BigInt(100)) / selectedRequest.fundingGoal), 100)} />
            </div>

            {/* Project Details */}
            <div>
              <h4 className="font-semibold mb-2">Project Details</h4>
              <p className="text-sm text-muted-foreground">{selectedRequest.projectDetails}</p>
            </div>

            {/* Progress */}
            {selectedRequest.progress && (
              <div>
                <h4 className="font-semibold mb-2">Current Progress</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.progress}</p>
              </div>
            )}

            {/* Social Accounts */}
            {selectedRequest.socialAccounts && (
              <div>
                <h4 className="font-semibold mb-2">Social Accounts</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.socialAccounts}</p>
              </div>
            )}

            {/* Offering */}
            {selectedRequest.offering && (
              <div>
                <h4 className="font-semibold mb-2">Offering</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.offering}</p>
              </div>
            )}

            <Separator />

            {/* Support Form */}
            {selectedRequest.status === RequestStatus.ACTIVE && (
              <div className="space-y-2">
                <h4 className="font-semibold">Support This Project</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount (ETH)"
                    value={supportAmount}
                    onChange={(e) => setSupportAmount(e.target.value)}
                  />
                  <Button onClick={() => handleSupportRequest(selectedRequest.id)} disabled={isPending}>
                    {isPending ? "Supporting..." : "Support"}
                  </Button>
                </div>
              </div>
            )}

            {/* Supporters List */}
            {supporters.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Supporters ({supporters.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {supporters.map((supporter, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-muted rounded">
                      <span>{supporter.addr.slice(0, 10)}...{supporter.addr.slice(-8)}</span>
                      <span className="font-semibold">{formatETH(supporter.amount)} ETH</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updates */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Project Updates ({updates.length})
              </h4>

              {isOwner && (
                <div className="space-y-2 mb-4">
                  <Textarea
                    placeholder="Post an update..."
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    rows={3}
                  />
                  <Input
                    placeholder="Image URL (optional - e.g., https://imgur.com/abc.png or ipfs://Qm...)"
                    value={updateImage}
                    onChange={(e) => setUpdateImage(e.target.value)}
                  />
                  <Button onClick={() => handlePostUpdate(selectedRequest.id)} disabled={isPending} size="sm">
                    Post Update
                  </Button>
                </div>
              )}

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No updates yet</p>
                ) : (
                  updates.map((update, idx) => {
                    // Extract image URL if present
                    const contentParts = update.content.split('\n\nImage: ');
                    const textContent = contentParts[0];
                    const imageUrl = contentParts[1];

                    return (
                      <div key={idx} className="p-3 bg-muted rounded">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{update.author.slice(0, 10)}...{update.author.slice(-8)}</span>
                          <span>{new Date(Number(update.timestamp) * 1000).toLocaleString()}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                        {imageUrl && (
                          <div className="mt-2">
                            <img
                              src={imageUrl.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}` : imageUrl}
                              alt="Update image"
                              className="max-w-full h-auto rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Withdraw for owner */}
            {isOwner && selectedRequest.totalRaised > 0 && (
              <div className="space-y-2 p-4 border rounded">
                <h4 className="font-semibold text-green-700">Withdraw Funds</h4>
                <p className="text-sm text-muted-foreground">Available: {formatETH(selectedRequest.totalRaised)} ETH</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount to withdraw"
                  />
                  <Button onClick={() => {
                    const input = document.querySelector('input[placeholder="Amount to withdraw"]') as HTMLInputElement;
                    if (input) handleWithdrawFunds(selectedRequest.id, input.value);
                  }}>
                    Withdraw
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Render main content
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Looking For Grant (VC Funding)</h1>
        <p className="text-muted-foreground">
          Flexible funding for startups - No all-or-nothing, withdraw anytime
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <Button
          variant={activeTab === "browse" ? "default" : "ghost"}
          onClick={() => setActiveTab("browse")}
        >
          Browse Requests
        </Button>
        <Button
          variant={activeTab === "create" ? "default" : "ghost"}
          onClick={() => setActiveTab("create")}
        >
          Create Request
        </Button>
        <Button
          variant={activeTab === "my-requests" ? "default" : "ghost"}
          onClick={() => setActiveTab("my-requests")}
        >
          My Requests
        </Button>
      </div>

      {/* Content */}
      {activeTab === "create" && renderCreateForm()}

      {activeTab === "browse" && (
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No funding requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => renderRequestCard(request))}
            </div>
          )}
        </div>
      )}

      {activeTab === "my-requests" && (
        <div>
          {requests.filter((r) => r.requester.toLowerCase() === address?.toLowerCase()).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't created any funding requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests
                .filter((r) => r.requester.toLowerCase() === address?.toLowerCase())
                .map((request) => renderRequestCard(request))}
            </div>
          )}
        </div>
      )}

      {renderRequestDetails()}

      {/* Transaction status */}
      {isConfirming && (
        <Alert className="mt-4">
          <AlertDescription>Waiting for confirmation...</AlertDescription>
        </Alert>
      )}
      {isConfirmed && (
        <Alert className="mt-4">
          <AlertDescription>Transaction confirmed!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
