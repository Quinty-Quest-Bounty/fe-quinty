"use client";

import React from "react";
import { useAccount } from "wagmi";
import { formatAddress } from "../utils/web3";
import { useReputation } from "../hooks/useReputation";
import { ReputationSkeleton } from "./reputation/ReputationSkeleton";
import { Award, Target, Trophy, Medal, User, Wallet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "../utils/format";

const ACHIEVEMENT_NAMES = {
  0: "First Solver", 1: "Active Solver", 2: "Skilled Solver", 3: "Expert Solver", 4: "Legend Solver",
  5: "First Win", 6: "Skilled Winner", 7: "Expert Winner", 8: "Champion Winner", 9: "Legend Winner",
  10: "First Creator", 11: "Active Creator", 12: "Skilled Creator", 13: "Expert Creator", 14: "Legend Creator",
  15: "Monthly Champion", 16: "Monthly Builder",
};

export default function ReputationDisplay() {
  const { isConnected, address: walletAddress } = useAccount();
  const { profile } = useAuth();

  // Determine display address: profile wallet > connected wallet
  const displayAddress = profile?.wallet_address || walletAddress;
  const hasAuth = profile || isConnected;

  // Pass display address to reputation hook
  const { userProfile, isLoading } = useReputation(displayAddress as string | undefined);

  if (!hasAuth) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">
          Please sign in or connect your wallet to view reputation.
        </p>
      </div>
    );
  }

  if (isLoading) return <ReputationSkeleton />;

  // Display name and metadata
  const displayName = profile?.username || profile?.email?.split('@')[0] || (displayAddress ? formatAddress(displayAddress) : 'User');
  const initials = profile ? getInitials(displayName) : '??';

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Enhanced Profile Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profile?.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-slate-100 text-slate-700 text-lg font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">
            {displayName}
          </h1>
          {profile?.twitter_username && (
            <p className="text-sm text-slate-500">@{profile.twitter_username}</p>
          )}
          {displayAddress && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Wallet className="w-3 h-3" />
              {formatAddress(displayAddress)}
            </div>
          )}
          {!displayAddress && profile && (
            <p className="text-xs text-amber-600 mt-1">
              Link your wallet to view on-chain reputation
            </p>
          )}
        </div>
      </div>

      {/* Simple Stats List */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submissions</p>
          <p className="text-2xl font-bold text-slate-900">{userProfile?.stats.submissions || 0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wins</p>
          <p className="text-2xl font-bold text-slate-900">{userProfile?.stats.wins || 0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created</p>
          <p className="text-2xl font-bold text-slate-900">{userProfile?.stats.bountiesCreated || 0}</p>
        </div>
      </div>

      {/* Simple Achievements List */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Achievements</h3>
        {userProfile && userProfile.achievements.achievements.length > 0 ? (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {userProfile.achievements.achievements.map((achievement, i) => (
              <div key={i} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {ACHIEVEMENT_NAMES[achievement as keyof typeof ACHIEVEMENT_NAMES] || "Achievement"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  NFT #{userProfile.achievements.tokenIds[i]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No achievements earned yet.</p>
        )}
      </div>
    </div>
  );
}
