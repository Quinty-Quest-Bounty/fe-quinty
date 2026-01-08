"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWatchContractEvent, useChainId } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  REPUTATION_ABI,
  QUINTY_ABI,
  MANTLE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
} from "../utils/contracts";
import { readContract } from "@wagmi/core";
import { formatAddress, wagmiConfig, formatETH } from "../utils/web3";
import { isAddress } from "viem";
import { Input } from "./ui/input";
import {
  Trophy,
  Target,
  User,
  Search,
  TrendingUp,
  Medal,
} from "lucide-react";

interface UserStatsData {
  bountiesCreated: number;
  submissions: number;
  wins: number;
}

interface UserAchievements {
  achievements: number[];
  tokenIds: number[];
}

interface UserProfile {
  address: string;
  stats: UserStatsData;
  achievements: UserAchievements;
}

const ACHIEVEMENT_MILESTONES = [1, 10, 25, 50, 100];

export default function ReputationDisplay() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [topSolvers, setTopSolvers] = useState<any[]>([]);

  // Load top users by volume
  useEffect(() => {
    const loadTopUsers = async () => {
      try {
        const bountyCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "bountyCounter",
        });

        const count = Number(bountyCounter);
        const creatorVolume: Record<string, bigint> = {};
        const solverVolume: Record<string, bigint> = {};

        for (let i = 1; i <= count; i++) {
          try {
            const data = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getBountyData",
              args: [BigInt(i)],
            });
            if (data) {
              const b = data as any[];
              const creator = b[0];
              const amount = b[2] as bigint;
              const status = b[6];
              const winners = b[8] as string[];

              // Aggregate Creator Volume
              creatorVolume[creator] = (creatorVolume[creator] || 0n) + amount;

              // Aggregate Solver Volume (only for resolved bounties)
              if (status === 3 && winners && winners.length > 0) {
                // For simplicity, we attribute the full amount to the first winner 
                // (or you could split by winnerShares if needed)
                const primaryWinner = winners[0];
                solverVolume[primaryWinner] = (solverVolume[primaryWinner] || 0n) + amount;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Sort and get Top 3 Creators
        const sortedCreators = Object.entries(creatorVolume)
          .map(([address, totalValue]) => ({ address, totalValue }))
          .sort((a, b) => (b.totalValue > a.totalValue ? 1 : -1))
          .slice(0, 3);
        setTopCreators(sortedCreators);

        // Sort and get Top 3 Solvers
        const sortedSolvers = Object.entries(solverVolume)
          .map(([address, totalValue]) => ({ address, totalValue }))
          .sort((a, b) => (b.totalValue > a.totalValue ? 1 : -1))
          .slice(0, 3);
        setTopSolvers(sortedSolvers);

      } catch (error) {
        console.error("Error loading top users:", error);
      }
    };

    loadTopUsers();
  }, [chainId]);

  // Read user stats
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESSES[chainId]
      .QuintyReputation as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  // Read user achievements
  const { data: userAchievements, refetch: refetchAchievements } =
    useReadContract({
      address: CONTRACT_ADDRESSES[chainId]
        .QuintyReputation as `0x${string}`,
      abi: REPUTATION_ABI,
      functionName: "getUserAchievements",
      args: address ? [address] : undefined,
      query: { enabled: isConnected && !!address },
    });

  // Watch for achievement updates
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[chainId]
      .QuintyReputation as `0x${string}`,
    abi: REPUTATION_ABI,
    eventName: "AchievementUnlocked",
    onLogs() {
      refetchStats();
      refetchAchievements();
    },
  });

  // Load user profile data
  useEffect(() => {
    if (address && userStats && userAchievements) {
      const achievementsArray = userAchievements as any[];

      const stats = {
        bountiesCreated: Number((userStats as any)?.totalBountiesCreated || 0),
        submissions: Number((userStats as any)?.totalSubmissions || 0),
        wins: Number((userStats as any)?.totalWins || 0),
      };

      const achievements = {
        achievements: achievementsArray[0]
          ? achievementsArray[0].map((a: any) => Number(a))
          : [],
        tokenIds: achievementsArray[1]
          ? achievementsArray[1].map((t: any) => Number(t))
          : [],
      };

      setUserProfile({
        address,
        stats,
        achievements,
      });
      setLoading(false);
    }
  }, [address, userStats, userAchievements]);

  // Search for another user
  const searchUserProfile = async () => {
    if (!searchAddress.trim() || !isAddress(searchAddress)) {
      alert("Please enter a valid Ethereum address.");
      return;
    }

    try {
      const [statsData, achievementsData] = await Promise.all([
        readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId]
            .QuintyReputation as `0x${string}`,
          abi: REPUTATION_ABI,
          functionName: "getUserStats",
          args: [searchAddress as `0x${string}`],
        }),
        readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[chainId]
            .QuintyReputation as `0x${string}`,
          abi: REPUTATION_ABI,
          functionName: "getUserAchievements",
          args: [searchAddress as `0x${string}`],
        }),
      ]);

      const stats = {
        bountiesCreated: Number((statsData as any)?.totalBountiesCreated || 0),
        submissions: Number((statsData as any)?.totalSubmissions || 0),
        wins: Number((statsData as any)?.totalWins || 0),
      };

      const achievementsArray = achievementsData as any[];
      const achievements = {
        achievements: achievementsArray[0]
          ? achievementsArray[0].map((a: any) => Number(a))
          : [],
        tokenIds: achievementsArray[1]
          ? achievementsArray[1].map((t: any) => Number(t))
          : [],
      };

      const searchedProfile: UserProfile = {
        address: searchAddress,
        stats,
        achievements,
      };

      setLeaderboard((prev) => {
        const filtered = prev.filter(
          (u) => u.address.toLowerCase() !== searchAddress.toLowerCase()
        );
        return [...filtered, searchedProfile].sort(
          (a, b) =>
            b.stats.wins +
            b.stats.bountiesCreated -
            (a.stats.wins + a.stats.bountiesCreated)
        );
      });
      setSearchAddress("");
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Could not find data for the given address.");
    }
  };

  const getProgressToNext = (current: number) => {
    const nextMilestone = ACHIEVEMENT_MILESTONES.find((m) => m > current);
    return nextMilestone ? nextMilestone - current : 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-2 border-gray-900 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Reputation System</h1>
            <p className="text-sm font-mono text-gray-600 uppercase">
              Soulbound NFT achievements for contributors
            </p>
          </div>
        </div>
      </div>

      {/* Quick Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-gray-900 bg-blue-50 p-6">
          <div className="w-10 h-10 bg-blue-500 border-2 border-gray-900 flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-white">1</span>
          </div>
          <h3 className="font-black text-gray-900 uppercase mb-2">Participate</h3>
          <p className="text-sm text-gray-600 font-mono">Create bounties, submit solutions, win competitions</p>
        </div>
        <div className="border-2 border-gray-900 bg-blue-50 p-6">
          <div className="w-10 h-10 bg-blue-500 border-2 border-gray-900 flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-white">2</span>
          </div>
          <h3 className="font-black text-gray-900 uppercase mb-2">Hit Milestones</h3>
          <p className="text-sm text-gray-600 font-mono">Reach 1, 10, 25, 50, and 100 contributions</p>
        </div>
        <div className="border-2 border-gray-900 bg-blue-50 p-6">
          <div className="w-10 h-10 bg-blue-500 border-2 border-gray-900 flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-white">3</span>
          </div>
          <h3 className="font-black text-gray-900 uppercase mb-2">Earn NFTs</h3>
          <p className="text-sm text-gray-600 font-mono">Get permanent soulbound achievement badges</p>
        </div>
      </div>

      {/* Profile Stats (if connected) */}
      {isConnected && (
        <div className="space-y-6">
          {loading ? (
            <div className="border-2 border-gray-900 bg-white p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-gray-900 border-t-blue-500 mb-4" />
                <p className="text-sm text-gray-600 font-mono uppercase">Loading...</p>
              </div>
            </div>
          ) : userProfile ? (
            <>
              {/* Profile Header */}
              <div className="border-2 border-gray-900 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
                      <span className="text-2xl font-black text-white">
                        {userProfile.address.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight">
                        Your Profile
                      </h2>
                      <p className="text-sm text-gray-600 font-mono">
                        {formatAddress(userProfile.address)}
                      </p>
                    </div>
                  </div>
                  <div className="border-2 border-blue-500 bg-blue-50 px-4 py-2">
                    <span className="font-mono text-xs text-blue-900 uppercase tracking-wider font-bold">
                      {userProfile.achievements.achievements.length} Badges
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border-2 border-gray-900 bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-mono uppercase text-gray-600">Solutions</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-1">
                      {userProfile.stats.submissions}
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 border border-gray-900 mb-1">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(userProfile.stats.submissions % 10) * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 font-mono">
                      {getProgressToNext(userProfile.stats.submissions)} to next
                    </p>
                  </div>

                  <div className="border-2 border-gray-900 bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-mono uppercase text-gray-600">Wins</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-1">
                      {userProfile.stats.wins}
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 border border-gray-900 mb-1">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(userProfile.stats.wins % 10) * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 font-mono">
                      {getProgressToNext(userProfile.stats.wins)} to next
                    </p>
                  </div>

                  <div className="border-2 border-gray-900 bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-mono uppercase text-gray-600">Created</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mb-1">
                      {userProfile.stats.bountiesCreated}
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 border border-gray-900 mb-1">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(userProfile.stats.bountiesCreated % 10) * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 font-mono">
                      {getProgressToNext(userProfile.stats.bountiesCreated)} to next
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border-2 border-gray-900 bg-white p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-500 border-2 border-gray-900 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-black text-xl uppercase mb-2">Start Your Journey</h3>
                <p className="text-sm text-gray-600 font-mono max-w-md">
                  Create bounties or submit solutions to earn achievements
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard & Search */}
      <div className="border-2 border-gray-900 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Leaderboard</h2>
              <p className="text-xs font-mono text-gray-600">Search & compare contributors</p>
            </div>
          </div>
        </div>
        {/* Search Bar */}
        <div className="flex gap-3 mb-8">
          <Input
            placeholder="Search address (0x...)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUserProfile()}
            className="flex-1 border-2 border-gray-900 font-mono text-sm"
          />
          <button
            onClick={searchUserProfile}
            disabled={!searchAddress.trim()}
            className="px-6 py-2 border-2 border-gray-900 bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Top Transactions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Creators by Volume */}
          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Medal className="h-4 w-4 text-blue-500" />
              Top Creators (Total Volume)
            </h3>
            <div className="space-y-2">
              {topCreators.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-gray-200 text-center text-xs font-mono text-gray-400">
                  No data found
                </div>
              ) : (
                topCreators.map((creator, i) => (
                  <div key={creator.address} className="border-2 border-gray-900 p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase truncate">
                          {formatAddress(creator.address)}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase">
                          Total Value Created
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-black text-blue-600 whitespace-nowrap">
                        {formatETH(creator.totalValue)} {chainId === BASE_SEPOLIA_CHAIN_ID ? "ETH" : "MNT"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Solvers by Volume */}
          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-500" />
              Top Solvers (Total Earnings)
            </h3>
            <div className="space-y-2">
              {topSolvers.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-gray-200 text-center text-xs font-mono text-gray-400">
                  No data found
                </div>
              ) : (
                topSolvers.map((solver, i) => (
                  <div key={solver.address} className="border-2 border-gray-900 p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase truncate">
                          {formatAddress(solver.address)}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase">
                          Total Value Won
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-black text-green-600 whitespace-nowrap">
                        {formatETH(solver.totalValue)} {chainId === BASE_SEPOLIA_CHAIN_ID ? "ETH" : "MNT"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Recent Searches
          </h3>
          {leaderboard.length === 0 ? (
            <div className="border-2 border-gray-900 bg-gray-50 p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-mono text-gray-600 uppercase">
                Search users to build leaderboard
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div
                  key={user.address}
                  className="border-2 border-gray-900 bg-white p-4 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-gray-900">
                          {formatAddress(user.address)}
                        </p>
                        <p className="text-xs text-gray-600 font-mono">
                          {user.achievements.achievements.length} badges
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-black text-gray-900">{user.stats.submissions}</div>
                        <div className="text-xs text-gray-600 font-mono uppercase">Solutions</div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-gray-900">{user.stats.wins}</div>
                        <div className="text-xs text-gray-600 font-mono uppercase">Wins</div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-gray-900">{user.stats.bountiesCreated}</div>
                        <div className="text-xs text-gray-600 font-mono uppercase">Created</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simple Achievements Table */}
      <div className="border-2 border-gray-900 bg-white overflow-hidden">
        <div className="bg-gray-900 p-4 border-b-2 border-gray-900">
          <h3 className="font-black text-white uppercase">Achievement Milestones</h3>
        </div>
        <div className="grid grid-cols-6 border-b-2 border-gray-900 bg-gray-50">
          <div className="p-3 border-r-2 border-gray-900">
            <span className="text-xs font-black text-gray-900 uppercase">Type</span>
          </div>
          {ACHIEVEMENT_MILESTONES.map((m) => (
            <div key={m} className="p-3 text-center border-r-2 border-gray-900 last:border-r-0">
              <span className="text-xs font-black text-gray-900">{m}</span>
            </div>
          ))}
        </div>
        {["Solver", "Winner", "Creator"].map((type, idx) => (
          <div key={type} className="grid grid-cols-6 border-b-2 border-gray-900 last:border-b-0 hover:bg-blue-50 transition-colors">
            <div className="p-3 border-r-2 border-gray-900 flex items-center gap-2">
              {idx === 0 && <Target className="h-4 w-4 text-blue-600" />}
              {idx === 1 && <Trophy className="h-4 w-4 text-blue-600" />}
              {idx === 2 && <Medal className="h-4 w-4 text-blue-600" />}
              <span className="text-sm font-black text-gray-900 uppercase">{type}</span>
            </div>
            {ACHIEVEMENT_MILESTONES.map((m, i) => (
              <div key={m} className="p-3 text-center border-r-2 border-gray-900 last:border-r-0">
                <div className="inline-flex w-8 h-8 bg-blue-500 border-2 border-gray-900 items-center justify-center">
                  <span className="text-xs font-bold text-white">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
