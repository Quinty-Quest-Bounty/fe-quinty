"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatETH, formatAddress } from "../utils/web3";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Users,
  Eye,
  Share2,
  Coins,
  Target,
  TrendingUp,
  Gift,
} from "lucide-react";
import { useShare } from "@/hooks/useShare";

// Funding Types
export type FundingType = "grant" | "crowdfunding" | "looking-for-grant";

interface BaseFunding {
  id: number;
  creator: string;
  title: string;
  description: string;
  deadline: bigint;
  createdAt: bigint;
  type: FundingType;
}

interface GrantProgram extends BaseFunding {
  type: "grant";
  totalFunds: bigint;
  maxApplicants: number;
  applicationCount: number;
  selectedRecipientsCount: number;
  status: number; // 0: Open, 1: Selection, 2: Active, 3: Completed, 4: Cancelled
}

interface Crowdfunding extends BaseFunding {
  type: "crowdfunding";
  goal: bigint;
  raisedAmount: bigint;
  contributorCount: number;
  milestoneCount: number;
  status: number; // 0: Active, 1: Successful, 2: Failed, 3: Completed
}

interface LookingForGrant extends BaseFunding {
  type: "looking-for-grant";
  fundingGoal: bigint;
  raisedAmount: bigint;
  supporterCount: number;
  status: number; // 0: Active, 1: Funded, 2: Cancelled
}

export type FundingItem = GrantProgram | Crowdfunding | LookingForGrant;

interface FundingCardProps {
  funding: FundingItem;
  viewMode?: "grid" | "list";
}

const GrantStatusLabels = ["Open", "Selection", "Active", "Completed", "Cancelled"];
const CrowdfundingStatusLabels = ["Active", "Successful", "Failed", "Completed"];
const LFGStatusLabels = ["Active", "Funded", "Cancelled"];

export default function FundingCard({ funding, viewMode = "grid" }: FundingCardProps) {
  const router = useRouter();
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();

  const isExpired = BigInt(Math.floor(Date.now() / 1000)) > funding.deadline;

  const getStatusLabel = () => {
    if (funding.type === "grant") {
      return GrantStatusLabels[funding.status] || "Unknown";
    } else if (funding.type === "crowdfunding") {
      return CrowdfundingStatusLabels[funding.status] || "Unknown";
    } else {
      return LFGStatusLabels[funding.status] || "Unknown";
    }
  };

  const getStatusVariant = () => {
    if (funding.status === 0) return "default"; // Active/Open
    if (funding.status === 1) return "default"; // Success states
    if (funding.status === 2) return "destructive"; // Failed/Cancelled
    if (funding.status === 3) return "outline"; // Completed
    if (funding.status === 4) return "destructive"; // Cancelled
    return "outline";
  };

  const getTypeIcon = () => {
    if (funding.type === "grant") return Gift;
    if (funding.type === "crowdfunding") return Target;
    return TrendingUp;
  };

  const getTypeLabel = () => {
    if (funding.type === "grant") return "Grant Program";
    if (funding.type === "crowdfunding") return "Crowdfunding";
    return "Looking for Grant";
  };

  const getTypeBadgeColor = () => {
    if (funding.type === "grant") return "bg-green-100/80 backdrop-blur-sm text-green-700 border-green-200/60";
    if (funding.type === "crowdfunding") return "bg-blue-100/80 backdrop-blur-sm text-blue-700 border-blue-200/60";
    return "bg-purple-100/80 backdrop-blur-sm text-purple-700 border-purple-200/60";
  };

  const getRoutePrefix = () => {
    if (funding.type === "grant") return "/funding/grant-program";
    if (funding.type === "crowdfunding") return "/funding/crowdfunding";
    return "/funding/looking-for-grant";
  };

  const getProgress = () => {
    if (funding.type === "grant") {
      return funding.maxApplicants > 0
        ? (funding.selectedRecipientsCount / funding.maxApplicants) * 100
        : 0;
    } else if (funding.type === "crowdfunding") {
      return funding.goal > BigInt(0)
        ? Math.min((Number(funding.raisedAmount) / Number(funding.goal)) * 100, 100)
        : 0;
    } else {
      return funding.fundingGoal > BigInt(0)
        ? Math.min((Number(funding.raisedAmount) / Number(funding.fundingGoal)) * 100, 100)
        : 0;
    }
  };

  const getFundingAmount = () => {
    if (funding.type === "grant") {
      return formatETH(funding.totalFunds);
    } else if (funding.type === "crowdfunding") {
      return formatETH(funding.raisedAmount);
    } else {
      return formatETH(funding.raisedAmount);
    }
  };

  const getFundingGoal = () => {
    if (funding.type === "grant") {
      return `${funding.selectedRecipientsCount}/${funding.maxApplicants}`;
    } else if (funding.type === "crowdfunding") {
      return formatETH(funding.goal);
    } else {
      return formatETH(funding.fundingGoal);
    }
  };

  const getParticipantCount = () => {
    if (funding.type === "grant") return funding.applicationCount;
    if (funding.type === "crowdfunding") return funding.contributorCount;
    return funding.supporterCount;
  };

  const TypeIcon = getTypeIcon();
  const progress = getProgress();

  if (viewMode === "list") {
    return (
      <>
        <Card className="group relative overflow-hidden transition-all duration-200 hover:bg-white/80">
          <div className="flex flex-row">
            <div className="flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeBadgeColor()}>
                        {getTypeLabel()}
                      </Badge>
                      <Badge variant={getStatusVariant()} className="text-xs">
                        {getStatusLabel()}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold leading-tight line-clamp-1">
                      {funding.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {funding.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-primary" />
                      <span className="text-lg font-bold text-primary">
                        {getFundingAmount()}
                      </span>
                      <span className="text-xs font-medium text-primary">ETH</span>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">{getParticipantCount()}</span>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">
                        {isExpired
                          ? "Expired"
                          : new Date(Number(funding.deadline) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {funding.creator.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {formatAddress(funding.creator)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickView(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Quick View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareLink(`${getRoutePrefix()}/${funding.id}`, `Share this ${getTypeLabel()}`);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`${getRoutePrefix()}/${funding.id}`)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Quick View Dialog */}
        <Dialog open={quickView} onOpenChange={setQuickView}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{funding.title}</DialogTitle>
              <DialogDescription>
                {getTypeLabel()} #{funding.id} " {getFundingAmount()} ETH
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm p-2">
                  <p className="text-xs text-muted-foreground">
                    {funding.type === "grant" ? "Total Budget" : "Raised"}
                  </p>
                  <p className="font-bold">{getFundingAmount()} ETH</p>
                </div>
                <div className="rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm p-2">
                  <p className="text-xs text-muted-foreground">
                    {funding.type === "grant" ? "Recipients" : "Goal"}
                  </p>
                  <p className="font-bold">{getFundingGoal()}</p>
                </div>
                <div className="rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm p-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-bold">{getStatusLabel()}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-sm font-semibold">{progress.toFixed(0)}%</p>
                </div>
                <Progress value={progress} />
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm mb-1">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {funding.description}
                </p>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {getParticipantCount()}{" "}
                  {funding.type === "grant"
                    ? "applications"
                    : funding.type === "crowdfunding"
                    ? "contributors"
                    : "supporters"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setQuickView(false)}>
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setQuickView(false);
                    router.push(`${getRoutePrefix()}/${funding.id}`);
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-200 hover:bg-white/80">
        {/* Status Badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge variant={getStatusVariant()} className="text-xs">
            {getStatusLabel()}
          </Badge>
        </div>

        <CardHeader className="p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-[0.75rem] ${getTypeBadgeColor()} shadow-sm`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <Badge className={getTypeBadgeColor()} variant="outline">
              {getTypeLabel()}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm leading-tight line-clamp-2 font-semibold">
              {funding.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {funding.description}
            </p>
          </div>

          <Separator />

          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{getParticipantCount()}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {isExpired
                  ? "Expired"
                  : new Date(Number(funding.deadline) * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-3">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Amount Section */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-base font-bold text-primary">{getFundingAmount()}</span>
              <span className="text-xs font-medium text-primary">ETH</span>
            </div>
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {funding.creator.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setQuickView(true);
              }}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Quick View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                shareLink(`${getRoutePrefix()}/${funding.id}`, `Share this ${getTypeLabel()}`);
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`${getRoutePrefix()}/${funding.id}`)}
              className="flex-1"
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick View Dialog */}
      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{funding.title}</DialogTitle>
            <DialogDescription>
              {getTypeLabel()} #{funding.id} " {getFundingAmount()} ETH
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm p-2">
                <p className="text-xs text-muted-foreground">
                  {funding.type === "grant" ? "Total Budget" : "Raised"}
                </p>
                <p className="font-bold">{getFundingAmount()} ETH</p>
              </div>
              <div className="rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm p-2">
                <p className="text-xs text-muted-foreground">
                  {funding.type === "grant" ? "Recipients" : "Goal"}
                </p>
                <p className="font-bold">{getFundingGoal()}</p>
              </div>
              <div className="rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm p-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-bold">{getStatusLabel()}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold">{progress.toFixed(0)}%</p>
              </div>
              <Progress value={progress} />
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-sm mb-1">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                {funding.description}
              </p>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {getParticipantCount()}{" "}
                {funding.type === "grant"
                  ? "applications"
                  : funding.type === "crowdfunding"
                  ? "contributors"
                  : "supporters"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setQuickView(false)}>
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setQuickView(false);
                  router.push(`${getRoutePrefix()}/${funding.id}`);
                }}
              >
                View Full Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
