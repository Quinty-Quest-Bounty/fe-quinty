"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatETH, formatTimeLeft, formatAddress } from "../utils/web3";
import { IpfsImage } from "../utils/ipfs";
import {
  Card,
  CardContent,
  CardHeader,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Users,
  Clock,
  Coins,
  Eye,
  Share2,
} from "lucide-react";
import { useShare } from "@/hooks/useShare";

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
  resolved: boolean;
  cancelled: boolean;
  requirements: string;
  imageUrl?: string;
}

interface AirdropCardProps {
  airdrop: Airdrop;
  entryCount?: number;
  onShowSubmitModal?: () => void;
  viewMode?: "grid" | "list";
}

export default function AirdropCard({
  airdrop,
  entryCount = 0,
  onShowSubmitModal,
  viewMode = "grid",
}: AirdropCardProps) {
  const router = useRouter();
  const [quickView, setQuickView] = useState(false);
  const { shareLink } = useShare();
  const progress = Math.min(
    (airdrop.qualifiersCount / airdrop.maxQualifiers) * 100,
    100
  );
  const isExpired = Date.now() / 1000 > airdrop.deadline;

  const getStatusColor = () => {
    if (airdrop.resolved) return "default";
    if (isExpired) return "destructive";
    if (airdrop.qualifiersCount >= airdrop.maxQualifiers) return "secondary";
    return "default";
  };

  const getStatusText = () => {
    if (airdrop.resolved) return "Completed";
    if (isExpired) return "Expired";
    if (airdrop.qualifiersCount >= airdrop.maxQualifiers) return "Full";
    return "Active";
  };

  if (viewMode === "list") {
    return (
      <>
      <Card
        className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
        onClick={() => router.push(`/airdrops/${airdrop.id}`)}
      >
        <div className="flex flex-row">
          {/* Image Section */}
          {airdrop.imageUrl && (
            <div className="relative w-64 h-40 overflow-hidden bg-muted flex-shrink-0">
              <IpfsImage
                cid={airdrop.imageUrl.replace("ipfs://", "")}
                alt={airdrop.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Quick View and Share buttons overlay */}
              <div className="absolute top-2 left-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickView(true);
                  }}
                  className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    shareLink(`/airdrops/${airdrop.id}`, "Share this airdrop");
                  }}
                  className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold leading-tight line-clamp-1">
                    {airdrop.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {airdrop.description?.replace(/\n\nImage:.*$/, "") || "Social media promotion task"}
                  </p>
                </div>
                <Badge variant={getStatusColor()} className="text-xs flex-shrink-0">
                  {getStatusText()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      {formatETH(airdrop.perQualifier)}
                    </span>
                    <span className="text-xs font-medium text-green-600">STT</span>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">
                      {entryCount > 0 ? `${entryCount} entries` : `${airdrop.qualifiersCount}/${airdrop.maxQualifiers}`}
                    </span>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{formatTimeLeft(BigInt(airdrop.deadline))}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {airdrop.creator.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {formatAddress(airdrop.creator)}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Quick View Dialog */}
      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{airdrop.title}</DialogTitle>
            <DialogDescription>
              Airdrop #{airdrop.id} • {formatETH(airdrop.perQualifier)} STT per user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image */}
            {airdrop.imageUrl && (
              <div className="relative w-full flex justify-center">
                <IpfsImage
                  cid={airdrop.imageUrl.replace("ipfs://", "")}
                  alt={airdrop.title}
                  className="max-w-full h-auto max-h-[500px] object-contain rounded-xl shadow-sm"
                />
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">Per Qualifier</p>
                <p className="font-bold">{formatETH(airdrop.perQualifier)} STT</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">Participants</p>
                <p className="font-bold">{airdrop.qualifiersCount}/{airdrop.maxQualifiers}</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-bold">{getStatusText()}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-sm mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">
                {airdrop.description?.replace(/\n\nImage:.*$/, "") || "Social media promotion task"}
              </p>
            </div>

            {/* Requirements */}
            {airdrop.requirements && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Requirements</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {airdrop.requirements}
                </p>
              </div>
            )}

            {/* Time Left */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatTimeLeft(BigInt(airdrop.deadline))}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setQuickView(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setQuickView(false);
                  router.push(`/airdrops/${airdrop.id}`);
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
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
      onClick={() => router.push(`/airdrops/${airdrop.id}`)}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant={getStatusColor()} className="text-xs">
          {getStatusText()}
        </Badge>
      </div>

      {/* Image Section */}
      {airdrop.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          <IpfsImage
            cid={airdrop.imageUrl.replace("ipfs://", "")}
            alt={airdrop.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Quick View and Share buttons overlay */}
          <div className="absolute top-2 left-2 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setQuickView(true);
              }}
              className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                shareLink(`/airdrops/${airdrop.id}`, "Share this airdrop");
              }}
              className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <CardHeader className="p-3 space-y-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm leading-tight line-clamp-2 font-semibold">
            {airdrop.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {airdrop.description?.replace(/\n\nImage:.*$/, "") || "Social media promotion task"}
          </p>
        </div>

        <Separator />

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>
              {entryCount > 0 ? `${entryCount} entries` : `${airdrop.qualifiersCount}/${airdrop.maxQualifiers}`}
            </span>
          </div>
          <Progress value={progress} className="h-1 w-16" />
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTimeLeft(BigInt(airdrop.deadline))}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* Reward Section */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-green-600" />
            <span className="text-base font-bold text-green-600">
              {formatETH(airdrop.perQualifier)}
            </span>
            <span className="text-xs font-medium text-green-600">STT</span>
          </div>
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {airdrop.creator.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>

    {/* Quick View Dialog */}
    <Dialog open={quickView} onOpenChange={setQuickView}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{airdrop.title}</DialogTitle>
          <DialogDescription>
            Airdrop #{airdrop.id} • {formatETH(airdrop.perQualifier)} STT per user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          {airdrop.imageUrl && (
            <div className="relative w-full flex justify-center">
              <IpfsImage
                cid={airdrop.imageUrl.replace("ipfs://", "")}
                alt={airdrop.title}
                className="max-w-full h-auto max-h-[500px] object-contain rounded-xl shadow-sm"
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded p-2">
              <p className="text-xs text-muted-foreground">Per Qualifier</p>
              <p className="font-bold">{formatETH(airdrop.perQualifier)} STT</p>
            </div>
            <div className="bg-muted rounded p-2">
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="font-bold">{airdrop.qualifiersCount}/{airdrop.maxQualifiers}</p>
            </div>
            <div className="bg-muted rounded p-2">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-bold">{getStatusText()}</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-sm mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">
              {airdrop.description?.replace(/\n\nImage:.*$/, "") || "Social media promotion task"}
            </p>
          </div>

          {/* Requirements */}
          {airdrop.requirements && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Requirements</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {airdrop.requirements}
              </p>
            </div>
          )}

          {/* Time Left */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatTimeLeft(BigInt(airdrop.deadline))}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setQuickView(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setQuickView(false);
                router.push(`/airdrops/${airdrop.id}`);
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
