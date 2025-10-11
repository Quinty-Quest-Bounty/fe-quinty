"use client";

import React from "react";
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
import {
  Users,
  Clock,
  Coins,
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
      <Card
        className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
        onClick={() => router.push(`/airdrops/${airdrop.id}`)}
      >
        <div className="flex flex-row">
          {/* Image Section */}
          {airdrop.imageUrl && (
            <div className="relative w-48 h-32 overflow-hidden bg-muted flex-shrink-0">
              <IpfsImage
                cid={airdrop.imageUrl.replace("ipfs://", "")}
                alt={airdrop.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
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

            <CardContent className="pt-0 pb-3 flex items-center justify-between">
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
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  return (
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
        <div className="relative w-full h-32 overflow-hidden bg-muted">
          <IpfsImage
            cid={airdrop.imageUrl.replace("ipfs://", "")}
            alt={airdrop.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
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
  );
}
