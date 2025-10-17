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
  CROWDFUNDING_ABI,
  BASE_SEPOLIA_CHAIN_ID,
  ZK_VERIFICATION_ABI,
  CampaignStatus,
} from "../utils/contracts";
import { parseETH, formatETH, wagmiConfig, formatAddress } from "../utils/web3";
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
} from "./ui/dialog";
import {
  Heart,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Target,
  MessageSquare,
  CheckCircle2,
  Share2,
  Upload,
  X,
} from "lucide-react";

enum MilestoneStatus {
  PENDING = 0,
  RELEASED = 1,
  WITHDRAWN = 2,
}

interface Milestone {
  description: string;
  amount: bigint;
  status: MilestoneStatus;
  releasedAt: bigint;
}

interface Campaign {
  id: number;
  creator: string;
  title: string;
  projectDetails: string;
  socialAccounts: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  deadline: bigint;
  createdAt: bigint;
  status: CampaignStatus;
  totalWithdrawn: bigint;
  milestoneCount: number;
  contributionCount: number;
}

const statusLabels = ["Active", "Successful", "Failed", "Completed"];
const milestoneStatusLabels = ["Pending", "Released", "Withdrawn"];

export default function CrowdfundingManager() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const { showAlert } = useAlertDialog();
  const { shareLink } = useShare();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "browse" | "my-campaigns">("browse");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form states
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    projectDetails: "",
    socialAccounts: "",
    fundingGoal: "",
    deadline: "",
    imageUrl: "",
  });

  const [milestoneInputs, setMilestoneInputs] = useState<{ description: string; amount: string }[]>([
    { description: "", amount: "" },
  ]);

  const [contributeAmount, setContributeAmount] = useState("");
  const [updateContent, setUpdateContent] = useState("");

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding;
  const zkVerificationAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].ZKVerification;

  // Check ZK verification
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
    abi: CROWDFUNDING_ABI,
    eventName: "CampaignCreated",
    onLogs() {
      loadCampaigns();
    },
  });

  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: CROWDFUNDING_ABI,
    eventName: "ContributionReceived",
    onLogs() {
      loadCampaigns();
    },
  });

  // Load campaigns
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const counter = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: CROWDFUNDING_ABI,
        functionName: "campaignCounter",
      });

      const campaignsData: Campaign[] = [];
      for (let i = 1; i <= Number(counter); i++) {
        const info = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: CROWDFUNDING_ABI,
          functionName: "getCampaignInfo",
          args: [BigInt(i)],
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
        ] = info as [string, string, string, string, bigint, bigint, bigint, bigint, number, bigint];

        const milestoneCount = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: CROWDFUNDING_ABI,
          functionName: "getMilestoneCount",
          args: [BigInt(i)],
        });

        const contributionCount = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: CROWDFUNDING_ABI,
          functionName: "getContributionCount",
          args: [BigInt(i)],
        });

        campaignsData.push({
          id: i,
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
          milestoneCount: Number(milestoneCount),
          contributionCount: Number(contributionCount),
        });
      }

      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadCampaigns();
    }
  }, [isConnected]);

  // Load milestones for a campaign
  const loadMilestones = async (campaignId: number) => {
    try {
      const count = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: CROWDFUNDING_ABI,
        functionName: "getMilestoneCount",
        args: [BigInt(campaignId)],
      });

      const milestonesData: Milestone[] = [];
      for (let i = 0; i < Number(count); i++) {
        const milestone = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: CROWDFUNDING_ABI,
          functionName: "getMilestone",
          args: [BigInt(campaignId), BigInt(i)],
        });

        const [description, amount, status, releasedAt] = milestone as [string, bigint, number, bigint];
        milestonesData.push({ description, amount, status, releasedAt });
      }

      setMilestones(milestonesData);
    } catch (error) {
      console.error("Error loading milestones:", error);
    }
  };

  // Add milestone input field
  const addMilestoneField = () => {
    setMilestoneInputs([...milestoneInputs, { description: "", amount: "" }]);
  };

  // Remove milestone input field
  const removeMilestoneField = (index: number) => {
    setMilestoneInputs(milestoneInputs.filter((_, i) => i !== index));
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
    setNewCampaign({ ...newCampaign, imageUrl: "" });
  };

  // Handle create campaign
  const handleCreateCampaign = async () => {
    if (!isVerified) {
      showAlert({
        title: "Verification Required",
        description: "You must be ZK verified to create a crowdfunding campaign",
        variant: "warning"
      });
      return;
    }

    if (!newCampaign.title || !newCampaign.fundingGoal || milestoneInputs.length === 0) {
      showAlert({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one milestone",
        variant: "warning"
      });
      return;
    }

    // Validate milestones
    const validMilestones = milestoneInputs.filter(
      (m) => m.description && m.amount && parseFloat(m.amount) > 0
    );

    if (validMilestones.length === 0) {
      showAlert({
        title: "Invalid Milestones",
        description: "Please add at least one valid milestone",
        variant: "warning"
      });
      return;
    }

    // Check if milestones sum to funding goal
    const totalMilestoneAmount = validMilestones.reduce(
      (sum, m) => sum + parseFloat(m.amount),
      0
    );
    if (Math.abs(totalMilestoneAmount - parseFloat(newCampaign.fundingGoal)) > 0.0001) {
      showAlert({
        title: "Milestone Mismatch",
        description: `Milestones must sum to funding goal. Current sum: ${totalMilestoneAmount} ETH`,
        variant: "warning"
      });
      return;
    }

    const deadlineTimestamp = newCampaign.deadline
      ? Math.floor(new Date(newCampaign.deadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60; // 60 days default

    try {
      let finalImageUrl = newCampaign.imageUrl;

      // Upload image first if selected but not yet uploaded
      if (selectedImage && !finalImageUrl) {
        setIsUploading(true);
        try {
          const cid = await uploadToIpfs(selectedImage, {
            name: `campaign-image-${Date.now()}`,
            type: "campaign-banner",
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

      // Include image URL in project details if available
      const projectDetailsWithImage = finalImageUrl
        ? `${newCampaign.projectDetails}\n\nImage: ${finalImageUrl}`
        : newCampaign.projectDetails;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWDFUNDING_ABI,
        functionName: "createCampaign",
        args: [
          newCampaign.title,
          projectDetailsWithImage,
          newCampaign.socialAccounts,
          parseETH(newCampaign.fundingGoal),
          BigInt(deadlineTimestamp),
          validMilestones.map((m) => m.description),
          validMilestones.map((m) => parseETH(m.amount)),
        ],
      });

      setNewCampaign({
        title: "",
        projectDetails: "",
        socialAccounts: "",
        fundingGoal: "",
        deadline: "",
        imageUrl: "",
      });
      setMilestoneInputs([{ description: "", amount: "" }]);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  // Handle contribute
  const handleContribute = async (campaignId: number) => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      showAlert({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount",
        variant: "warning"
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
    }
  };

  // Handle release milestone
  const handleReleaseMilestone = async (campaignId: number, milestoneId: number) => {
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWDFUNDING_ABI,
        functionName: "releaseMilestone",
        args: [BigInt(campaignId), BigInt(milestoneId)],
      });

      // Reload milestones after release
      setTimeout(() => loadMilestones(campaignId), 2000);
    } catch (error) {
      console.error("Error releasing milestone:", error);
      showAlert({
        title: "Release Failed",
        description: "Failed to release milestone",
        variant: "destructive"
      });
    }
  };

  // Handle withdraw milestone
  const handleWithdrawMilestone = async (campaignId: number, milestoneId: number) => {
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWDFUNDING_ABI,
        functionName: "withdrawMilestone",
        args: [BigInt(campaignId), BigInt(milestoneId)],
      });

      // Reload milestones and campaign after withdrawal
      setTimeout(() => {
        loadMilestones(campaignId);
        loadCampaigns();
      }, 2000);
    } catch (error) {
      console.error("Error withdrawing milestone:", error);
      showAlert({
        title: "Withdrawal Failed",
        description: "Failed to withdraw milestone",
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
            Your identity is verified. You can create crowdfunding campaigns.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="mb-4 border-amber-500 bg-amber-50">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700">Verification Required</AlertTitle>
        <AlertDescription className="text-amber-600">
          You must verify your identity to create crowdfunding campaigns.
        </AlertDescription>
      </Alert>
    );
  };

  // Render create form
  const renderCreateForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Create Crowdfunding Campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderVerificationWarning()}

        <div className="space-y-2">
          <Label>Campaign Title *</Label>
          <Input
            placeholder="e.g., Build Community Center in Rural Area"
            value={newCampaign.title}
            onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Project Details (IPFS CID or description) *</Label>
          <Textarea
            placeholder="Describe your project and how funds will be used..."
            value={newCampaign.projectDetails}
            onChange={(e) => setNewCampaign({ ...newCampaign, projectDetails: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Social Accounts</Label>
          <Input
            placeholder="X, website, etc."
            value={newCampaign.socialAccounts}
            onChange={(e) => setNewCampaign({ ...newCampaign, socialAccounts: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Campaign Image (Optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Campaign preview"
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
                    htmlFor="campaign-image-upload"
                    className="cursor-pointer font-medium text-sm text-gray-900"
                  >
                    {isDragOver ? "Drop image here" : "Upload an image"}
                    <span className="text-gray-500 ml-1">or drag and drop</span>
                  </Label>
                  <Input
                    id="campaign-image-upload"
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Funding Goal (ETH) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.0"
              value={newCampaign.fundingGoal}
              onChange={(e) => setNewCampaign({ ...newCampaign, fundingGoal: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Deadline *</Label>
            <Input
              type="datetime-local"
              value={newCampaign.deadline}
              onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base">Milestones *</Label>
            <Button size="sm" variant="outline" onClick={addMilestoneField}>
              + Add Milestone
            </Button>
          </div>

          <div className="space-y-3">
            {milestoneInputs.map((milestone, index) => (
              <div key={index} className="flex gap-2 items-start p-3 border rounded">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Milestone description"
                    value={milestone.description}
                    onChange={(e) => {
                      const newMilestones = [...milestoneInputs];
                      newMilestones[index].description = e.target.value;
                      setMilestoneInputs(newMilestones);
                    }}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount (ETH)"
                    value={milestone.amount}
                    onChange={(e) => {
                      const newMilestones = [...milestoneInputs];
                      newMilestones[index].amount = e.target.value;
                      setMilestoneInputs(newMilestones);
                    }}
                  />
                </div>
                {milestoneInputs.length > 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeMilestoneField(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Note: Milestone amounts must sum to the funding goal
          </p>
        </div>

        <Button onClick={handleCreateCampaign} disabled={isPending || !isVerified || isUploading} className="w-full">
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Uploading Image...
            </>
          ) : isPending ? (
            "Creating..."
          ) : (
            "Create Campaign"
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

  // Convert Campaign to FundingItem
  const convertCampaignToFundingItem = (campaign: Campaign): FundingItem => {
    return {
      id: campaign.id,
      creator: campaign.creator,
      title: campaign.title,
      description: campaign.projectDetails,
      deadline: campaign.deadline,
      createdAt: campaign.createdAt,
      type: "crowdfunding",
      goal: campaign.fundingGoal,
      raisedAmount: campaign.totalRaised,
      contributorCount: campaign.contributionCount,
      milestoneCount: campaign.milestoneCount,
      status: campaign.status,
    };
  };

  // Render details modal
  const renderDetailsModal = () => {
    if (!selectedCampaign) return null;

    const isOwner = address?.toLowerCase() === selectedCampaign.creator.toLowerCase();
    const progress = Number((selectedCampaign.totalRaised * BigInt(100)) / selectedCampaign.fundingGoal);

    return (
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign.title}</DialogTitle>
            <DialogDescription>
              Created by {formatAddress(selectedCampaign.creator)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Funding Progress</span>
                <span>
                  {formatETH(selectedCampaign.totalRaised)} / {formatETH(selectedCampaign.fundingGoal)} ETH
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% funded</span>
                <span>{selectedCampaign.contributionCount} backers</span>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h4 className="font-semibold mb-2">About This Campaign</h4>
              <p className="text-sm text-muted-foreground">{selectedCampaign.projectDetails}</p>
            </div>

            {/* Milestones */}
            <div>
              <h4 className="font-semibold mb-3">Milestones</h4>
              <div className="space-y-2">
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded">
                    <div className="mt-1">
                      {milestone.status === MilestoneStatus.WITHDRAWN ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : milestone.status === MilestoneStatus.RELEASED ? (
                        <Target className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{milestone.description}</span>
                        <Badge variant="outline" className="ml-2">
                          {formatETH(milestone.amount)} ETH
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Status: {milestoneStatusLabels[milestone.status]}
                      </div>

                      {/* Creator actions */}
                      {isOwner && (
                        <div className="flex gap-2 mt-2">
                          {milestone.status === MilestoneStatus.PENDING &&
                            selectedCampaign.status === CampaignStatus.Successful &&
                            (idx === 0 || milestones[idx - 1].status !== MilestoneStatus.PENDING) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReleaseMilestone(selectedCampaign.id, idx)}
                              disabled={isPending}
                            >
                              Release Milestone
                            </Button>
                          )}

                          {milestone.status === MilestoneStatus.RELEASED && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleWithdrawMilestone(selectedCampaign.id, idx)}
                              disabled={isPending}
                            >
                              Withdraw {formatETH(milestone.amount)} ETH
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Contribute Section */}
            {selectedCampaign.status === CampaignStatus.Active && (
              <div className="space-y-2">
                <h4 className="font-semibold">Support This Campaign</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount (ETH)"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                  />
                  <Button onClick={() => handleContribute(selectedCampaign.id)} disabled={isPending}>
                    {isPending ? "Contributing..." : "Contribute"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Crowdfunding</h2>
        <p className="text-muted-foreground">
          All-or-nothing funding for social movements and community projects
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "browse" ? "default" : "ghost"}
          onClick={() => setActiveTab("browse")}
        >
          Browse Campaigns
        </Button>
        <Button
          variant={activeTab === "create" ? "default" : "ghost"}
          onClick={() => setActiveTab("create")}
        >
          Create Campaign
        </Button>
        <Button
          variant={activeTab === "my-campaigns" ? "default" : "ghost"}
          onClick={() => setActiveTab("my-campaigns")}
        >
          My Campaigns
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
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No crowdfunding campaigns yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <FundingCard key={campaign.id} funding={convertCampaignToFundingItem(campaign)} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "my-campaigns" && (
        <div>
          {campaigns.filter((c) => c.creator.toLowerCase() === address?.toLowerCase()).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't created any campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns
                .filter((c) => c.creator.toLowerCase() === address?.toLowerCase())
                .map((campaign) => (
                  <FundingCard key={campaign.id} funding={convertCampaignToFundingItem(campaign)} />
                ))}
            </div>
          )}
        </div>
      )}

      {renderDetailsModal()}

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
