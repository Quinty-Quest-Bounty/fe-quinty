"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  REPUTATION_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../utils/contracts";
import { readContract } from "@wagmi/core";
import { formatAddress, wagmiConfig } from "../utils/web3";
import { isAddress } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Trophy,
  Target,
  User,
  Search,
  Award,
  TrendingUp,
  Medal,
  Star,
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

// Achievement Type Enum (matching contract)
const ACHIEVEMENT_TYPES = [
  "FIRST_SOLVER",
  "ACTIVE_SOLVER",
  "SKILLED_SOLVER",
  "EXPERT_SOLVER",
  "LEGEND_SOLVER",
  "FIRST_WIN",
  "SKILLED_WINNER",
  "EXPERT_WINNER",
  "CHAMPION_WINNER",
  "LEGEND_WINNER",
  "FIRST_CREATOR",
  "ACTIVE_CREATOR",
  "SKILLED_CREATOR",
  "EXPERT_CREATOR",
  "LEGEND_CREATOR",
  "MONTHLY_CHAMPION",
  "MONTHLY_BUILDER",
];

const ACHIEVEMENT_NAMES = {
  0: "First Solver",
  1: "Active Solver",
  2: "Skilled Solver",
  3: "Expert Solver",
  4: "Legend Solver",
  5: "First Win",
  6: "Skilled Winner",
  7: "Expert Winner",
  8: "Champion Winner",
  9: "Legend Winner",
  10: "First Creator",
  11: "Active Creator",
  12: "Skilled Creator",
  13: "Expert Creator",
  14: "Legend Creator",
  15: "Monthly Champion",
  16: "Monthly Builder",
};

const ACHIEVEMENT_MILESTONES = [1, 10, 25, 50, 100];

export default function ReputationDisplay() {
  const { address, isConnected } = useAccount();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    "profile" | "leaderboard" | "achievements"
  >("profile");
  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(true);

  // Read user stats
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
      .QuintyReputation as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  // Read user achievements
  const { data: userAchievements, refetch: refetchAchievements } =
    useReadContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
        .QuintyReputation as `0x${string}`,
      abi: REPUTATION_ABI,
      functionName: "getUserAchievements",
      args: address ? [address] : undefined,
      query: { enabled: isConnected && !!address },
    });

  // Read user's NFT balance
  const { data: nftBalance } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
      .QuintyReputation as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  // Watch for achievement updates
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
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
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
            .QuintyReputation as `0x${string}`,
          abi: REPUTATION_ABI,
          functionName: "getUserStats",
          args: [searchAddress as `0x${string}`],
        }),
        readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
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
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Could not find data for the given address.");
    }
  };

  // Helper functions
  const getAchievementBadge = (achievementType: number) => {
    const name =
      ACHIEVEMENT_NAMES[achievementType as keyof typeof ACHIEVEMENT_NAMES] ||
      "Unknown";
    const category =
      achievementType < 5
        ? "Solver"
        : achievementType < 10
        ? "Winner"
        : achievementType < 15
        ? "Creator"
        : "Season";

    const tier =
      achievementType < 15
        ? ACHIEVEMENT_MILESTONES[achievementType % 5]
        : "Monthly";

    return { name, category, tier };
  };

  const getProgressToNext = (
    current: number,
    type: "solver" | "winner" | "creator"
  ) => {
    const nextMilestone = ACHIEVEMENT_MILESTONES.find((m) => m > current);
    return nextMilestone ? nextMilestone - current : 0;
  };

  if (!isConnected) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-center mb-2">
              Connect Your Wallet
            </CardTitle>
            <CardDescription className="text-center">
              Please connect your wallet to view reputation data.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Quinty Reputation</h1>
        <p className="text-muted-foreground">
          Earn milestone-based NFT achievements for your contributions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "leaderboard", label: "Leaderboard", icon: TrendingUp },
            { id: "achievements", label: "Guide", icon: Award },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTab(tab.id as any)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all"
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {selectedTab === "profile" && (
        <div className="space-y-6">
          {loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                <CardTitle className="mb-2">Loading Profile</CardTitle>
                <CardDescription>
                  Fetching your achievement data from the blockchain
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {!loading && !userProfile && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">Welcome to Quinty!</CardTitle>
                <CardDescription className="text-center max-w-md">
                  You haven't started your journey yet. Create bounties or
                  submit solutions to earn your first achievements!
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {userProfile && (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg font-semibold">
                        {userProfile.address.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">
                        {formatAddress(userProfile.address)}
                      </CardTitle>
                      <CardDescription>
                        {userProfile.achievements.achievements.length}{" "}
                        achievements earned
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Solutions Submitted
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userProfile.stats.submissions}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        Next milestone:{" "}
                        {getProgressToNext(
                          userProfile.stats.submissions,
                          "solver"
                        )}{" "}
                        more
                      </p>
                    </div>
                    <Progress
                      value={(userProfile.stats.submissions % 10) * 10}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Bounties Won
                    </CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userProfile.stats.wins}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        Next milestone:{" "}
                        {getProgressToNext(userProfile.stats.wins, "winner")}{" "}
                        more
                      </p>
                    </div>
                    <Progress
                      value={(userProfile.stats.wins % 10) * 10}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Bounties Created
                    </CardTitle>
                    <Medal className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userProfile.stats.bountiesCreated}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        Next milestone:{" "}
                        {getProgressToNext(
                          userProfile.stats.bountiesCreated,
                          "creator"
                        )}{" "}
                        more
                      </p>
                    </div>
                    <Progress
                      value={(userProfile.stats.bountiesCreated % 10) * 10}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements ({userProfile.achievements.achievements.length}
                    )
                  </CardTitle>
                  <CardDescription>
                    Milestone-based NFT badges for your contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile.achievements.achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProfile.achievements.achievements.map(
                        (achievement, index) => {
                          const badge = getAchievementBadge(achievement);
                          const tokenId =
                            userProfile.achievements.tokenIds[index];
                          return (
                            <Card
                              key={achievement}
                              className="relative overflow-hidden"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/60 rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                                    {badge.category[0]}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">
                                      {badge.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {badge.category} • Level {badge.tier}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="text-xs mt-1"
                                    >
                                      NFT #{tokenId}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No achievements yet
                      </h3>
                      <p className="text-muted-foreground">
                        Start participating to earn your first badge!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* NFT Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>NFT Wallet Integration</CardTitle>
                  <CardDescription>
                    View your achievements in compatible wallets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <span className="font-medium">NFT Balance</span>
                    <Badge variant="secondary" className="text-sm">
                      {Number(nftBalance || 0)} NFTs
                    </Badge>
                  </div>

                  <div className="space-y-3 text-sm">
                    <h4 className="font-medium">To view in MetaMask:</h4>
                    <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Go to NFTs tab → Import NFT</li>
                      <li>
                        Contract:{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                          {
                            CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
                              .QuintyReputation
                          }
                        </code>
                      </li>
                      <li>
                        Token IDs:{" "}
                        {userProfile.achievements.tokenIds.join(", ") ||
                          "None yet"}
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {selectedTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Search User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search User Achievements
              </CardTitle>
              <CardDescription>
                Enter a wallet address to view achievements and add to
                leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={searchUserProfile}
                  disabled={!searchAddress.trim()}
                  className="px-6"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Contributors
              </CardTitle>
              <CardDescription>
                Community leaderboard based on achievements and contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No users in leaderboard
                  </h3>
                  <p className="text-muted-foreground">
                    Search for users to build the leaderboard
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.address}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarFallback>
                            {user.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{user.address}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {user.achievements.achievements.length}{" "}
                              achievements
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {user.stats.wins + user.stats.bountiesCreated}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.stats.bountiesCreated} Created •{" "}
                          {user.stats.wins} Won
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievement Guide Tab - Table Layout */}
      {selectedTab === "achievements" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Award className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Achievement System
              </h1>
              <p className="text-sm text-gray-600">
                Milestone-based NFT achievements for reputation building
              </p>
            </div>
          </div>

          {/* How it works - Horizontal */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      Participate
                    </h3>
                    <p className="text-xs text-gray-600">Submit & create</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      Hit Milestones
                    </h3>
                    <p className="text-xs text-gray-600">Reach targets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      Earn NFTs
                    </h3>
                    <p className="text-xs text-gray-600">Get badges</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Categories - Table Layout */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Level 1
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Level 2
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Level 3
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Level 4
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Level 5
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Solver Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          Solver
                        </div>
                        <div className="text-xs text-gray-500">
                          Submit solutions
                        </div>
                      </div>
                    </div>
                  </td>
                  {ACHIEVEMENT_MILESTONES.map((milestone, index) => (
                    <td key={milestone} className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {index + 1}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {
                            ACHIEVEMENT_NAMES[
                              index as keyof typeof ACHIEVEMENT_NAMES
                            ].split(" ")[1]
                          }
                        </div>
                        <div className="text-xs text-gray-600">
                          {milestone}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Winner Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          Winner
                        </div>
                        <div className="text-xs text-gray-500">
                          Win competitions
                        </div>
                      </div>
                    </div>
                  </td>
                  {ACHIEVEMENT_MILESTONES.map((milestone, index) => (
                    <td key={milestone} className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {index + 1}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {
                            ACHIEVEMENT_NAMES[
                              (index + 5) as keyof typeof ACHIEVEMENT_NAMES
                            ].split(" ")[1]
                          }
                        </div>
                        <div className="text-xs text-gray-600">
                          {milestone}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Creator Row */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Medal className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          Creator
                        </div>
                        <div className="text-xs text-gray-500">
                          Create bounties
                        </div>
                      </div>
                    </div>
                  </td>
                  {ACHIEVEMENT_MILESTONES.map((milestone, index) => (
                    <td key={milestone} className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {index + 1}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {
                            ACHIEVEMENT_NAMES[
                              (index + 10) as keyof typeof ACHIEVEMENT_NAMES
                            ].split(" ")[1]
                          }
                        </div>
                        <div className="text-xs text-gray-600">
                          {milestone}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Benefits - Row Layout */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">
              NFT Achievement Benefits
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  icon: Trophy,
                  title: "Permanent Reputation",
                  desc: "Soulbound NFTs for long-term credibility",
                },
                {
                  icon: Star,
                  title: "Custom Artwork",
                  desc: "Unique IPFS-hosted designs",
                },
                {
                  icon: Target,
                  title: "Clear Progression",
                  desc: "Transparent milestone system",
                },
                {
                  icon: User,
                  title: "Wallet Compatible",
                  desc: "Visible in MetaMask & others",
                },
                {
                  icon: TrendingUp,
                  title: "Community Status",
                  desc: "Showcase contributions",
                },
                {
                  icon: Medal,
                  title: "Recognition",
                  desc: "Build trust & credibility",
                },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center border border-gray-200 flex-shrink-0">
                    <benefit.icon className="h-3 w-3 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-xs">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-gray-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
