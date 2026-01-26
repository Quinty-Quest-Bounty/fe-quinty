"use client";

import React from "react";
import { useAccount } from "wagmi";
import { formatAddress } from "../utils/web3";
import { useReputation } from "../hooks/useReputation";
import { ReputationSkeleton } from "./reputation/ReputationSkeleton";
import { Award, Target, Trophy, Medal, User } from "lucide-react";

const ACHIEVEMENT_NAMES = {
  0: "First Solver", 1: "Active Solver", 2: "Skilled Solver", 3: "Expert Solver", 4: "Legend Solver",
  5: "First Win", 6: "Skilled Winner", 7: "Expert Winner", 8: "Champion Winner", 9: "Legend Winner",
  10: "First Creator", 11: "Active Creator", 12: "Skilled Creator", 13: "Expert Creator", 14: "Legend Creator",
  15: "Monthly Champion", 16: "Monthly Builder",
};

export default function ReputationDisplay() {
  const { isConnected } = useAccount();
  const { userProfile, isLoading } = useReputation();

  if (!isConnected) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Please connect your wallet to view reputation.</p>
      </div>
    );
  }

  if (isLoading) return <ReputationSkeleton />;

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Simple Profile Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{userProfile ? formatAddress(userProfile.address) : "..."}</h1>
          <p className="text-sm text-slate-500">On-chain reputation profile</p>
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
