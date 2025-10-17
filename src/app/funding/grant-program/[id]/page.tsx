"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  GRANT_PROGRAM_ABI,
  BASE_SEPOLIA_CHAIN_ID,
  GrantStatus,
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
  Gift,
  Calendar,
  CheckCircle,
  XCircle,
  Share2,
  Loader2,
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

export default function GrantProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const { showAlert, showConfirm } = useAlertDialog();
  const grantId = params.id as string;

  const [grant, setGrant] = useState<Grant | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applyForm, setApplyForm] = useState({
    projectDetails: "",
    socialAccounts: "",
    requestedAmount: "",
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram;

  // Load grant data
  const loadGrant = async () => {
    try {
      setIsLoading(true);
      const grantData = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "getGrantInfo",
        args: [BigInt(grantId)],
      });

      if (grantData) {
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
        ] = grantData as any;

        const applicationCount = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "getApplicationCount",
          args: [BigInt(grantId)],
        });

        const selectedRecipients = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "getSelectedRecipients",
          args: [BigInt(grantId)],
        });

        setGrant({
          id: parseInt(grantId),
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

        // Load applications
        const appsData: Application[] = [];
        for (let i = 0; i < Number(applicationCount); i++) {
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
          ] = app as any;

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
      }
    } catch (error) {
      console.error("Error loading grant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (grantId) {
      loadGrant();
    }
  }, [grantId]);

  useEffect(() => {
    if (isConfirmed) {
      loadGrant();
      setApplyForm({
        projectDetails: "",
        socialAccounts: "",
        requestedAmount: "",
      });
    }
  }, [isConfirmed]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    if (!applyForm.projectDetails || !applyForm.requestedAmount) {
      showAlert({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "warning",
      });
      return;
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "applyForGrant",
        args: [
          BigInt(grantId),
          applyForm.projectDetails,
          applyForm.socialAccounts,
          parseETH(applyForm.requestedAmount),
        ],
      });
    } catch (error) {
      console.error("Error applying:", error);
    }
  };

  const handleApprove = async (applicationId: number, requestedAmount: bigint) => {
    const confirmed = await showConfirm({
      title: "Approve Application",
      description: "Are you sure you want to approve this application?",
      confirmText: "Approve",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "approveApplications",
        args: [
          BigInt(grantId),
          [BigInt(applicationId)],
          [requestedAmount],
        ],
      });
    } catch (error) {
      console.error("Error approving:", error);
    }
  };

  const handleReject = async (applicationId: number) => {
    const confirmed = await showConfirm({
      title: "Reject Application",
      description: "Are you sure you want to reject this application?",
      confirmText: "Reject",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    const reason = "Application does not meet requirements";

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: GRANT_PROGRAM_ABI,
        functionName: "rejectApplications",
        args: [
          BigInt(grantId),
          [BigInt(applicationId)],
          [reason],
        ],
      });
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-6">Loading grant program...</p>
        </div>
      </div>
    );
  }

  if (!grant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Grant not found</h2>
          <p className="text-muted-foreground mb-4">The grant program you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/funding")}>
            Back to Funding
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = address?.toLowerCase() === grant.giver.toLowerCase();
  const isExpired = Date.now() / 1000 > Number(grant.applicationDeadline);
  const progress = Math.min((grant.selectedRecipientsCount / grant.maxApplicants) * 100, 100);
  const userApplication = applications.find((app) => app.applicant.toLowerCase() === address?.toLowerCase());

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
              <BreadcrumbPage>Grant #{grantId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                      <Gift className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{grant.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">By</span>
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {formatAddress(grant.giver)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={grant.status === GrantStatus.Open ? "default" : "secondary"} className="text-xs">
                    {statusLabels[grant.status]}
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
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[1.25rem] p-3 border border-green-200 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-muted-foreground">Total Funds</span>
                  </div>
                  <p className="text-base font-bold text-green-600">
                    {formatETH(grant.totalFunds)} ETH
                  </p>
                </div>

                <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Recipients</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {grant.selectedRecipientsCount} / {grant.maxApplicants}
                  </p>
                  <Progress value={progress} className="h-1 mt-1.5" />
                </div>

                <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Applications</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {isExpired ? "Closed" : new Date(Number(grant.applicationDeadline) * 1000).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-[1.25rem] p-3 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Applications</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {grant.applicationCount}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-3">
              {/* Description */}
              {grant.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Program Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {grant.description}
                  </p>
                </div>
              )}

              <Separator className="my-4" />

              {/* Apply Section */}
              {!isCreator && !userApplication && grant.status === GrantStatus.Open && !isExpired && (
                <Card className="rounded-[1.5rem] border-primary/20 bg-primary/5 mb-4 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Apply for This Grant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="projectDetails" className="text-xs">Project Details *</Label>
                        <Textarea
                          id="projectDetails"
                          placeholder="Describe your project..."
                          value={applyForm.projectDetails}
                          onChange={(e) => setApplyForm({ ...applyForm, projectDetails: e.target.value })}
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="socialAccounts" className="text-xs">Social Accounts</Label>
                        <Input
                          id="socialAccounts"
                          placeholder="Twitter, GitHub, etc."
                          value={applyForm.socialAccounts}
                          onChange={(e) => setApplyForm({ ...applyForm, socialAccounts: e.target.value })}
                          className="text-sm h-8"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="requestedAmount" className="text-xs">Requested Amount (ETH) *</Label>
                        <Input
                          id="requestedAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.0"
                          value={applyForm.requestedAmount}
                          onChange={(e) => setApplyForm({ ...applyForm, requestedAmount: e.target.value })}
                          className="text-sm h-8"
                        />
                      </div>

                      <Button
                        onClick={handleApply}
                        disabled={!applyForm.projectDetails || !applyForm.requestedAmount || isPending || isConfirming}
                        className="w-full"
                        size="sm"
                      >
                        {isPending || isConfirming ? "Processing..." : "Submit Application"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* User Application Status */}
              {userApplication && (
                <Card className="rounded-[1.5rem] bg-blue-50 border-blue-200 mb-4 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Your Application
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div>
                        <Badge
                          variant={
                            userApplication.status === ApplicationStatus.APPROVED
                              ? "default"
                              : userApplication.status === ApplicationStatus.REJECTED
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {userApplication.status === ApplicationStatus.PENDING
                            ? "Pending Review"
                            : userApplication.status === ApplicationStatus.APPROVED
                            ? "Approved"
                            : "Rejected"}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <strong>Requested:</strong> {formatETH(userApplication.requestedAmount)} ETH
                      </p>
                      {userApplication.rejectionReason && (
                        <div className="bg-white rounded p-2">
                          <p className="text-xs"><strong>Reason:</strong> {userApplication.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Applications List (for creator or public view) */}
              {applications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Applications ({applications.length})
                  </h3>
                  <div className="space-y-2">
                    {applications.map((app, idx) => (
                      <Card key={idx} className="rounded-[1.25rem] transition-all duration-300 hover:shadow-md">
                        <CardContent className="py-3 px-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">
                                  {formatAddress(app.applicant)}
                                </span>
                                <Badge
                                  variant={
                                    app.status === ApplicationStatus.APPROVED
                                      ? "default"
                                      : app.status === ApplicationStatus.REJECTED
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {app.status === ApplicationStatus.PENDING
                                    ? "Pending"
                                    : app.status === ApplicationStatus.APPROVED
                                    ? "Approved"
                                    : "Rejected"}
                                </Badge>
                              </div>

                              <div className="text-sm space-y-1">
                                <p><strong>Requested:</strong> {formatETH(app.requestedAmount)} ETH</p>
                                <p className="text-muted-foreground line-clamp-2">{app.projectDetails}</p>
                                {app.socialAccounts && (
                                  <p className="text-xs text-muted-foreground">{app.socialAccounts}</p>
                                )}
                              </div>

                              {isCreator && app.status === ApplicationStatus.PENDING && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(idx, app.requestedAmount)}
                                    disabled={isPending || isConfirming}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(idx)}
                                    disabled={isPending || isConfirming}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
