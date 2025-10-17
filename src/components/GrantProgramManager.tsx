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
  GRANT_PROGRAM_ABI,
  BASE_SEPOLIA_CHAIN_ID,
  ZK_VERIFICATION_ABI,
  GrantStatus,
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
  Gift,
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Share2,
  Upload,
  X,
} from "lucide-react";

enum ApplicationStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

interface Application {
  applicant: string;
  projectDetails: string;
  socialAccounts: string;
  requestedAmount: bigint;
  appliedAt: bigint;
  status: ApplicationStatus;
  rejectionReason: string;
}

interface Grant {
  id: number;
  giver: string;
  title: string;
  description: string;
  totalFunds: bigint;
  maxApplicants: number;
  applicationDeadline: bigint;
  distributionDeadline: bigint;
  status: GrantStatus;
  fundsDistributed: bigint;
  createdAt: bigint;
  applicationCount: number;
  selectedRecipientsCount: number;
}

const statusLabels = ["Open", "Selection", "Active", "Completed", "Cancelled"];

export default function GrantProgramManager() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const { showAlert, showConfirm } = useAlertDialog();
  const { shareLink } = useShare();

  const [grants, setGrants] = useState<Grant[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "browse" | "my-grants">("browse");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Form states
  const [newGrant, setNewGrant] = useState({
    title: "",
    description: "",
    maxApplicants: "",
    applicationDeadline: "",
    distributionDeadline: "",
    amount: "",
    imageUrl: "",
  });

  const [applyForm, setApplyForm] = useState({
    projectDetails: "",
    socialAccounts: "",
    requestedAmount: "",
  });

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [approvalForm, setApprovalForm] = useState<{
    applicationIds: number[];
    amounts: string[];
  }>({
    applicationIds: [],
    amounts: [],
  });

  const [rejectionReason, setRejectionReason] = useState("");

  const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram;
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
    abi: GRANT_PROGRAM_ABI,
    eventName: "GrantCreated",
    onLogs() {
      loadGrants();
    },
  });

  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: GRANT_PROGRAM_ABI,
    eventName: "ApplicationSubmitted",
    onLogs() {
      if (selectedGrant) loadApplications(selectedGrant.id);
    },
  });

  // Load grants
  const loadGrants = async () => {
    try {
      setLoading(true);
      const counter = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "grantCounter",
      });

      const grantsData: Grant[] = [];
      for (let i = 1; i <= Number(counter); i++) {
        const info = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "getGrantInfo",
          args: [BigInt(i)],
        });

        const [
          giver,
          title,
          description,
          totalFunds,
          maxApplicants,
          applicationDeadline,
          distributionDeadline,
          status,
          fundsDistributed,
          createdAt,
        ] = info as [string, string, string, bigint, bigint, bigint, bigint, number, bigint, bigint];

        const applicationCount = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "getApplicationCount",
          args: [BigInt(i)],
        });

        const selectedRecipients = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "getSelectedRecipients",
          args: [BigInt(i)],
        });

        grantsData.push({
          id: i,
          giver,
          title,
          description,
          totalFunds,
          maxApplicants: Number(maxApplicants),
          applicationDeadline,
          distributionDeadline,
          status,
          fundsDistributed,
          createdAt,
          applicationCount: Number(applicationCount),
          selectedRecipientsCount: (selectedRecipients as string[]).length,
        });
      }

      setGrants(grantsData);
    } catch (error) {
      console.error("Error loading grants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadGrants();
    }
  }, [isConnected]);

  // Load applications for a grant
  const loadApplications = async (grantId: number) => {
    try {
      const count = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "getApplicationCount",
        args: [BigInt(grantId)],
      });

      const appsData: Application[] = [];
      for (let i = 0; i < Number(count); i++) {
        const app = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "getApplication",
          args: [BigInt(grantId), BigInt(i)],
        });

        const [
          applicant,
          projectDetails,
          socialAccounts,
          requestedAmount,
          appliedAt,
          status,
          rejectionReason,
        ] = app as [string, string, string, bigint, bigint, number, string];

        appsData.push({
          applicant,
          projectDetails,
          socialAccounts,
          requestedAmount,
          appliedAt,
          status,
          rejectionReason,
        });
      }

      setApplications(appsData);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
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
    setNewGrant({ ...newGrant, imageUrl: "" });
  };

  // Handle create grant
  const handleCreateGrant = async () => {
    if (!isVerified) {
      showAlert({
        title: "Verification Required",
        description: "You must be ZK verified to create a grant",
        variant: "warning"
      });
      return;
    }

    if (!newGrant.title || !newGrant.amount || !newGrant.maxApplicants) {
      showAlert({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "warning"
      });
      return;
    }

    const appDeadline = newGrant.applicationDeadline
      ? Math.floor(new Date(newGrant.applicationDeadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const distDeadline = newGrant.distributionDeadline
      ? Math.floor(new Date(newGrant.distributionDeadline).getTime() / 1000)
      : appDeadline + 30 * 24 * 60 * 60;

    // Validate: application deadline < distribution deadline
    if (appDeadline >= distDeadline) {
      showAlert({
        title: "Invalid Deadline",
        description: "Distribution deadline must be after application deadline",
        variant: "warning"
      });
      return;
    }

    try {
      let finalImageUrl = newGrant.imageUrl;

      // Upload image first if selected but not yet uploaded
      if (selectedImage && !finalImageUrl) {
        setIsUploading(true);
        try {
          const cid = await uploadToIpfs(selectedImage, {
            name: `grant-image-${Date.now()}`,
            type: "grant-banner",
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

      // Include image URL in description if available
      const descriptionWithImage = finalImageUrl
        ? `${newGrant.description}\n\nImage: ${finalImageUrl}`
        : newGrant.description;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "createGrant",
        args: [
          newGrant.title,
          descriptionWithImage,
          BigInt(newGrant.maxApplicants),
          BigInt(appDeadline),
          BigInt(distDeadline),
        ],
        value: parseETH(newGrant.amount),
      });

      setNewGrant({
        title: "",
        description: "",
        maxApplicants: "",
        applicationDeadline: "",
        distributionDeadline: "",
        amount: "",
        imageUrl: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating grant:", error);
    }
  };

  // Handle apply for grant
  const handleApplyForGrant = async () => {
    if (!selectedGrant) return;

    if (!applyForm.projectDetails || !applyForm.requestedAmount) {
      showAlert({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "warning"
      });
      return;
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "applyForGrant",
        args: [
          BigInt(selectedGrant.id),
          applyForm.projectDetails,
          applyForm.socialAccounts,
          parseETH(applyForm.requestedAmount),
        ],
      });

      setApplyForm({
        projectDetails: "",
        socialAccounts: "",
        requestedAmount: "",
      });
      setShowApplyModal(false);
    } catch (error) {
      console.error("Error applying for grant:", error);
    }
  };

  // Handle approve application
  const handleApproveApplication = async (applicationId: number, requestedAmount: bigint) => {
    if (!selectedGrant) return;

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "approveApplications",
        args: [
          BigInt(selectedGrant.id),
          [BigInt(applicationId)],
          [requestedAmount],
        ],
      });

      // Reload applications after approval
      setTimeout(() => loadApplications(selectedGrant.id), 2000);
    } catch (error) {
      console.error("Error approving application:", error);
      showAlert({
        title: "Approval Failed",
        description: "Failed to approve application",
        variant: "destructive"
      });
    }
  };

  // Handle reject application
  const handleRejectApplication = async (applicationId: number) => {
    if (!selectedGrant) return;

    const confirmed = await showConfirm({
      title: "Confirm Rejection",
      description: "Are you sure you want to reject this application?",
      confirmText: "Yes, Reject",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    const reason = rejectionReason || "Application does not meet requirements";

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "rejectApplications",
        args: [
          BigInt(selectedGrant.id),
          [BigInt(applicationId)],
          [reason],
        ],
      });

      setRejectionReason("");
      // Reload applications after rejection
      setTimeout(() => loadApplications(selectedGrant.id), 2000);
    } catch (error) {
      console.error("Error rejecting application:", error);
      showAlert({
        title: "Rejection Failed",
        description: "Failed to reject application",
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
            Your identity is verified. You can create grant programs.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="mb-4 border-amber-500 bg-amber-50">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700">Verification Required</AlertTitle>
        <AlertDescription className="text-amber-600">
          You must verify your identity to create grant programs.
        </AlertDescription>
      </Alert>
    );
  };

  // Render create form
  const renderCreateForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Create Grant Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderVerificationWarning()}

        <div className="space-y-2">
          <Label>Grant Title *</Label>
          <Input
            placeholder="e.g., DeFi Innovation Grant 2025"
            value={newGrant.title}
            onChange={(e) => setNewGrant({ ...newGrant, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Description (IPFS CID or text)</Label>
          <Textarea
            placeholder="Describe your grant program..."
            value={newGrant.description}
            onChange={(e) => setNewGrant({ ...newGrant, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Grant Program Image (Optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Grant preview"
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
                    htmlFor="grant-image-upload"
                    className="cursor-pointer font-medium text-sm text-gray-900"
                  >
                    {isDragOver ? "Drop image here" : "Upload an image"}
                    <span className="text-gray-500 ml-1">or drag and drop</span>
                  </Label>
                  <Input
                    id="grant-image-upload"
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
            <Label>Total Funds (ETH) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.0"
              value={newGrant.amount}
              onChange={(e) => setNewGrant({ ...newGrant, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Recipients *</Label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={newGrant.maxApplicants}
              onChange={(e) => setNewGrant({ ...newGrant, maxApplicants: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Application Deadline</Label>
            <Input
              type="datetime-local"
              value={newGrant.applicationDeadline}
              onChange={(e) =>
                setNewGrant({ ...newGrant, applicationDeadline: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Distribution Deadline</Label>
            <Input
              type="datetime-local"
              value={newGrant.distributionDeadline}
              onChange={(e) =>
                setNewGrant({ ...newGrant, distributionDeadline: e.target.value })
              }
            />
          </div>
        </div>

        <Button onClick={handleCreateGrant} disabled={isPending || !isVerified || isUploading} className="w-full">
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Uploading Image...
            </>
          ) : isPending ? (
            "Creating..."
          ) : (
            "Create Grant Program"
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

  // Convert Grant to FundingItem
  const convertGrantToFundingItem = (grant: Grant): FundingItem => {
    return {
      id: grant.id,
      creator: grant.giver,
      title: grant.title,
      description: grant.description,
      deadline: grant.applicationDeadline,
      createdAt: grant.createdAt,
      type: "grant",
      totalFunds: grant.totalFunds,
      maxApplicants: grant.maxApplicants,
      applicationCount: grant.applicationCount,
      selectedRecipientsCount: grant.selectedRecipientsCount,
      status: grant.status,
    };
  };

  // Render apply modal
  const renderApplyModal = () => {
    if (!selectedGrant) return null;

    return (
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedGrant.title}</DialogTitle>
            <DialogDescription>
              Submit your project details to apply for this grant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Details (IPFS CID or description) *</Label>
              <Textarea
                placeholder="Describe your project..."
                value={applyForm.projectDetails}
                onChange={(e) => setApplyForm({ ...applyForm, projectDetails: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Social Accounts</Label>
              <Input
                placeholder="X, GitHub, website..."
                value={applyForm.socialAccounts}
                onChange={(e) => setApplyForm({ ...applyForm, socialAccounts: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Requested Amount (ETH) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.0"
                value={applyForm.requestedAmount}
                onChange={(e) => setApplyForm({ ...applyForm, requestedAmount: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyForGrant} disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render manage modal
  const renderManageModal = () => {
    if (!selectedGrant) return null;

    return (
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Grant: {selectedGrant.title}</DialogTitle>
            <DialogDescription>
              Review applications and manage your grant program
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-muted rounded">
                <div className="text-muted-foreground mb-1">Total Funds</div>
                <div className="font-bold">{formatETH(selectedGrant.totalFunds)} ETH</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-muted-foreground mb-1">Applications</div>
                <div className="font-bold">{applications.length}</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-muted-foreground mb-1">Selected</div>
                <div className="font-bold">{selectedGrant.selectedRecipientsCount}/{selectedGrant.maxApplicants}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Applications</h4>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold">{formatAddress(app.applicant)}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Requested: {formatETH(app.requestedAmount)} ETH
                            </div>
                          </div>
                          <Badge
                            variant={
                              app.status === ApplicationStatus.APPROVED
                                ? "default"
                                : app.status === ApplicationStatus.REJECTED
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {app.status === ApplicationStatus.PENDING
                              ? "Pending"
                              : app.status === ApplicationStatus.APPROVED
                              ? "Approved"
                              : "Rejected"}
                          </Badge>
                        </div>

                        <div className="text-sm mb-3">
                          <strong>Project:</strong> {app.projectDetails}
                        </div>

                        {app.socialAccounts && (
                          <div className="text-sm mb-3">
                            <strong>Social:</strong> {app.socialAccounts}
                          </div>
                        )}

                        {app.status === ApplicationStatus.PENDING && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveApplication(idx, app.requestedAmount)}
                              disabled={isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectApplication(idx)}
                              disabled={isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Grant Programs</h2>
        <p className="text-muted-foreground">
          VCs and organizations offer grants to promising projects
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "browse" ? "default" : "ghost"}
          onClick={() => setActiveTab("browse")}
        >
          Browse Grants
        </Button>
        <Button
          variant={activeTab === "create" ? "default" : "ghost"}
          onClick={() => setActiveTab("create")}
        >
          Create Grant
        </Button>
        <Button
          variant={activeTab === "my-grants" ? "default" : "ghost"}
          onClick={() => setActiveTab("my-grants")}
        >
          My Grants
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
          ) : grants.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No grant programs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grants.map((grant) => (
                <FundingCard key={grant.id} funding={convertGrantToFundingItem(grant)} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "my-grants" && (
        <div>
          {grants.filter((g) => g.giver.toLowerCase() === address?.toLowerCase()).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't created any grant programs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grants
                .filter((g) => g.giver.toLowerCase() === address?.toLowerCase())
                .map((grant) => (
                  <FundingCard key={grant.id} funding={convertGrantToFundingItem(grant)} />
                ))}
            </div>
          )}
        </div>
      )}

      {renderApplyModal()}
      {renderManageModal()}

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
