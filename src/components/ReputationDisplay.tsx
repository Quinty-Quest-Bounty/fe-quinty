"use client";

import React from "react";
import { useAccount } from "wagmi";
import { formatAddress } from "../utils/web3";
import { useReputation } from "../hooks/useReputation";
import { useHistory } from "../hooks/useHistory";
import { ReputationSkeleton } from "./reputation/ReputationSkeleton";
import { Award, Target, Trophy, Medal, User, Wallet, Zap } from "lucide-react";
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
  const { stats: historyStats, isLoading: isHistoryLoading } = useHistory();

  if (!hasAuth) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">
          Please sign in or connect your wallet to view reputation.
        </p>
      </div>
    );
  }

  if (isLoading || isHistoryLoading) return <ReputationSkeleton />;

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

      {/* Total Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-bold text-slate-900">{historyStats.totalSubmissions}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Wins</p>
          <p className="text-2xl font-bold text-[#0EA885]">{historyStats.totalWins}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Created</p>
          <p className="text-2xl font-bold text-slate-900">{historyStats.totalCreated}</p>
        </div>
      </div>

      {/* Detailed Stats Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Bounty Stats */}
        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#0EA885] flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Bounties</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Submitted</span>
              <span className="text-sm font-bold text-slate-900">{historyStats.bountySubmissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Won</span>
              <span className="text-sm font-bold text-[#0EA885]">{historyStats.bountyWins}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Created</span>
              <span className="text-sm font-bold text-slate-900">{historyStats.bountiesCreated}</span>
            </div>
          </div>
        </div>

        {/* Quest Stats */}
        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Quests</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Submitted</span>
              <span className="text-sm font-bold text-slate-900">{historyStats.questSubmissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Approved</span>
              <span className="text-sm font-bold text-amber-500">{historyStats.questApproved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Created</span>
              <span className="text-sm font-bold text-slate-900">{historyStats.questsCreated}</span>
            </div>
          </div>
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
