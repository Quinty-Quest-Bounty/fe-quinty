"use client";

import { useZKVerification } from "../hooks/useZKVerification";
import { Badge } from "./ui/badge";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";

interface ZKVerificationBadgeProps {
  address?: string;
  showHandle?: boolean;
}

export default function ZKVerificationBadge({
  address,
  showHandle = false,
}: ZKVerificationBadgeProps) {
  const { verificationData, loading, isVerified } = useZKVerification();

  if (loading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (isVerified && verificationData) {
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-700 border-green-300 text-xs"
      >
        <ShieldCheck className="h-3 w-3 mr-1" />
        {showHandle && verificationData.socialHandle
          ? verificationData.socialHandle
          : "Verified"}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-gray-100 text-gray-600 border-gray-300 text-xs"
    >
      <ShieldX className="h-3 w-3 mr-1" />
      Unverified
    </Badge>
  );
}
