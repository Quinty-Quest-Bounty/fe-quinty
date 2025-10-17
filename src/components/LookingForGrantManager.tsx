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
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useShare } from "@/hooks/useShare";
import { uploadToIpfs } from "../utils/ipfs";
import FundingCard, { type FundingItem } from "./FundingCard";
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
  Share2,
  Upload,
  X,
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
  const { showAlert } = useAlertDialog();
  const { shareLink } = useShare();

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
    imageUrl: "",
  });

  // Support form state
  const [supportAmount, setSupportAmount] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateImage, setUpdateImage] = useState("");

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // Image handling functions
  const validateAndSetImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showAlert({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "warning"
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: "File Too Large",
        description: "Image size must be less than 5MB",
        variant: "warning"
      });
      return false;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      validateAndSetImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setIsDragOver(false);
    setNewRequest({ ...newRequest, imageUrl: "" });
  };

  // Handle create request
  const handleCreateRequest = async () => {
    if (!isVerified) {
      showAlert({
        title: "Verification Required",
        description: "You must be ZK verified to create a funding request",
        variant: "warning"
      });
      return;
    }

    if (!newRequest.title || !newRequest.projectDetails || !newRequest.fundingGoal) {
      showAlert({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "warning"
      });
      return;
    }

    const deadlineTimestamp = newRequest.deadline
      ? Math.floor(new Date(newRequest.deadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days default

    try {
      let finalImageUrl = newRequest.imageUrl;

      // Upload image first if selected but not yet uploaded
      if (selectedImage && !finalImageUrl) {
        setIsUploading(true);
        try {
          const cid = await uploadToIpfs(selectedImage, {
            name: `request-image-${Date.now()}`,
            type: "request-banner",
          });
          finalImageUrl = `ipfs://${cid}`;
        } catch (error) {
          console.error("Error uploading image:", error);
          showAlert({
            title: "Upload Failed",
            description: "Error uploading image. Please try again.",
            variant: "destructive"
          });
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Combine project details with links and image
      let fullProjectDetails = newRequest.projectDetails;

      if (newRequest.projectLinks) {
        fullProjectDetails += `\n\nLinks: ${newRequest.projectLinks}`;
      }

      if (finalImageUrl) {
        fullProjectDetails += `\n\nImage: ${finalImageUrl}`;
      }

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
        imageUrl: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating request:", error);
      showAlert({
        title: "Creation Failed",
        description: "Failed to create funding request",
        variant: "destructive"
      });
    }
  };

  // Handle support request
  const handleSupportRequest = async (requestId: number) => {
    if (!supportAmount || parseFloat(supportAmount) <= 0) {
      showAlert({
        title: "Invalid Amount",
        description: "Please enter a valid support amount",
        variant: "warning"
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
      setSupportAmount("");
    } catch (error) {
      console.error("Error supporting request:", error);
      showAlert({
        title: "Support Failed",
        description: "Failed to support request",
        variant: "destructive"
      });
    }
  };

  // Handle post update
  const handlePostUpdate = async (requestId: number) => {
    if (!updateContent) {
      showAlert({
        title: "Missing Content",
        description: "Please enter update content",
        variant: "warning"
      });
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
      showAlert({
        title: "Update Failed",
        description: "Failed to post update",
        variant: "destructive"
      });
    }
  };

  // Handle withdraw funds
  const handleWithdrawFunds = async (requestId: number, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      showAlert({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "warning"
      });
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
      showAlert({
        title: "Withdrawal Failed",
        description: "Failed to withdraw funds",
        variant: "destructive"
      });
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
          <Label>Project Image (Optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Project preview"
                className="w-full h-40 object-cover rounded-lg border border-gray-200"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="request-image-upload"
                    className="cursor-pointer font-medium text-sm text-gray-900"
                  >
                    {isDragOver ? "Drop image here" : "Upload an image"}
                    <span className="text-gray-500 ml-1">or drag and drop</span>
                  </Label>
                  <Input
                    id="request-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          )}
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
            placeholder="X, GitHub, etc."
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
          disabled={isPending || !isVerified || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Uploading Image...
            </>
          ) : isPending ? (
            "Creating..."
          ) : (
            "Create Funding Request"
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Convert FundingRequest to FundingItem
  const convertRequestToFundingItem = (request: FundingRequest): FundingItem => {
    return {
      id: request.id,
      creator: request.requester,
      title: request.title,
      description: request.projectDetails,
      deadline: request.deadline,
      createdAt: request.createdAt,
      type: "looking-for-grant",
      fundingGoal: request.fundingGoal,
      raisedAmount: request.totalRaised,
      supporterCount: request.supporterCount,
      status: request.status,
    };
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
              {requests.map((request) => (
                <FundingCard key={request.id} funding={convertRequestToFundingItem(request)} />
              ))}
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
                .map((request) => (
                  <FundingCard key={request.id} funding={convertRequestToFundingItem(request)} />
                ))}
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
