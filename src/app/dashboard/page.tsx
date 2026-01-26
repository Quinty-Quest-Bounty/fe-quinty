"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  AIRDROP_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "../../utils/web3";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Target,
  Zap,
  LayoutGrid,
  Clock,
  Users,
  ChevronRight,
  TrendingUp,
  Wallet
} from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
} from "../../utils/ipfs";
import {
  getEthPriceInUSD,
  convertEthToUSD,
  formatUSD,
} from "../../utils/prices";

type DashboardSection = "all" | "bounties" | "quests";

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  status: number;
  metadataCid?: string;
}

interface Quest {
  id: number;
  creator: string;
  title: string;
  amount: bigint;
  totalRecipients: bigint;
  deadline: bigint;
  resolved: boolean;
  cancelled: boolean;
}

// Enhanced Stat Card Component
const StatCard = ({ title, value, trend, label, icon: Icon, color }: { title: string, value: string, trend?: string, label?: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-xl ${color.split(' ')[0]} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
      </div>
      {trend && (
        <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-0 font-bold text-[10px] px-2">
          <TrendingUp className="w-3 h-3 mr-1" /> {trend}
        </Badge>
      )}
    </div>
    <div className="space-y-0.5">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
    </div>
    {label && (
      <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-medium text-slate-400 flex items-center">
        {label}
      </div>
    )}
  </div>
);

const ITEMS_PER_PAGE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>("all");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bountyMetadata, setBountyMetadata] = useState<Map<number, BountyMetadata>>(new Map());

  // Pagination state
  const [bountyPage, setBountyPage] = useState(1);
  const [questPage, setQuestPage] = useState(1);
  const [loadingBounties, setLoadingBounties] = useState(false);
  const [loadingQuests, setLoadingQuests] = useState(false);

  // ETH price state
  const [ethPrice, setEthPrice] = useState<number>(0);

  // Fetch ETH price on mount and refresh every minute
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Read bounty counter
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
  });

  // Read quest counter
  const { data: questCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.AirdropBounty as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: "airdropCounter",
  });

  // Load bounties with pagination
  useEffect(() => {
    let isMounted = true;
    const loadBounties = async () => {
      if (!bountyCounter || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      setLoadingBounties(true);
      const count = Number(bountyCounter);

      // Calculate range for current page (load from newest to oldest)
      const startIndex = Math.max(1, count - (bountyPage * ITEMS_PER_PAGE) + 1);
      const endIndex = Math.min(count, count - ((bountyPage - 1) * ITEMS_PER_PAGE));

      const loadedBounties: Bounty[] = [];

      // Load bounties in reverse order (newest first)
      for (let i = endIndex; i >= startIndex; i--) {
        try {
          const bountyData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(i)],
          });

          if (bountyData && Array.isArray(bountyData)) {
            const [
              creator,
              description,
              amount,
              deadline,
              allowMultipleWinners,
              winnerShares,
              status,
              slashPercent,
              selectedWinners,
              selectedSubmissionIds,
              hasOprec,
              oprecDeadline,
            ] = bountyData as any[];

            let metadataCid;
            if (description && typeof description === 'string') {
              const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
              metadataCid = metadataMatch ? metadataMatch[1] : undefined;
            }

            loadedBounties.push({
              id: i,
              creator,
              description: description || "",
              amount,
              deadline,
              status,
              metadataCid,
            });
          }
        } catch (err) {
          console.error(`Error loading bounty ${i}:`, err);
        }
      }

      if (isMounted) {
        setBounties(loadedBounties);
        setLoadingBounties(false);
        setLoading(false);
      }
    };
    loadBounties();
    return () => { isMounted = false; };
  }, [bountyCounter, bountyPage]);

  // Load metadata for bounties
  useEffect(() => {
    const loadMetadata = async () => {
      const newMetadata = new Map<number, BountyMetadata>();

      for (const bounty of bounties) {
        if (bounty.metadataCid && !bountyMetadata.has(bounty.id)) {
          try {
            const meta = await fetchMetadataFromIpfs(bounty.metadataCid);
            newMetadata.set(bounty.id, meta);
          } catch (error) {
            console.error(`Failed to load metadata for bounty ${bounty.id}:`, error);
          }
        }
      }

      if (newMetadata.size > 0) {
        setBountyMetadata(prev => new Map([...prev, ...newMetadata]));
      }
    };

    if (bounties.length > 0) {
      loadMetadata();
    }
  }, [bounties]);

  // Load quests with pagination
  useEffect(() => {
    let isMounted = true;
    const loadQuests = async () => {
      if (!questCounter || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      setLoadingQuests(true);
      const count = Number(questCounter);

      // Calculate range for current page (load from newest to oldest)
      const startIndex = Math.max(1, count - (questPage * ITEMS_PER_PAGE) + 1);
      const endIndex = Math.min(count, count - ((questPage - 1) * ITEMS_PER_PAGE));

      const loadedQuests: Quest[] = [];

      // Load quests in reverse order (newest first)
      for (let i = endIndex; i >= startIndex; i--) {
        try {
          const questData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
            abi: AIRDROP_ABI,
            functionName: "getAirdrop",
            args: [BigInt(i)],
          });

          if (questData && Array.isArray(questData)) {
            const [creator, title, description, totalAmount, perQualifier, maxQualifiers, qualifiersCount, deadline, createdAt, resolved, cancelled] = questData as any[];
            loadedQuests.push({
              id: i,
              creator,
              title,
              amount: totalAmount,
              totalRecipients: qualifiersCount,
              deadline: BigInt(deadline),
              resolved,
              cancelled,
            });
          }
        } catch (err) {
          console.error(`Error loading quest ${i}:`, err);
        }
      }

      if (isMounted) {
        setQuests(loadedQuests);
        setLoadingQuests(false);
      }
    };
    loadQuests();
    return () => { isMounted = false; };
  }, [questCounter, questPage]);

  const sections = [
    { id: "all" as const, label: "Overview", icon: LayoutGrid },
    { id: "bounties" as const, label: "Bounties", icon: Target },
    { id: "quests" as const, label: "Quests", icon: Zap },
  ];

  const getStatusBadge = (status: number) => {
    const statuses = ["OPREC", "OPEN", "REVEAL", "RESOLVED", "DISPUTED", "EXPIRED"];
    const styles = [
      "bg-blue-50 text-blue-600 border-blue-100", // OPREC
      "bg-emerald-50 text-emerald-600 border-emerald-100", // OPEN
      "bg-amber-50 text-amber-600 border-amber-100", // REVEAL
      "bg-slate-50 text-slate-600 border-slate-100", // RESOLVED
      "bg-rose-50 text-rose-600 border-rose-100", // DISPUTED
      "bg-slate-50 text-slate-400 border-slate-100" // EXPIRED
    ];
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${styles[status] || styles[5]}`}>
        {statuses[status] || "UNKNOWN"}
      </span>
    );
  };

  const formatDeadline = (deadline: bigint | number) => {
    try {
      const date = new Date(Number(deadline) * 1000);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (diff < 0) return "Ended";
      if (days > 0) return `${days}d left`;
      return `${hours}h left`;
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">

        {/* Header Area */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Welcome back. Here's what's happening on Quinty.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Active Bounties"
            value={bountyCounter ? bountyCounter.toString() : "0"}
            trend="+12%"
            label="Volume: 2.4 ETH"
            icon={Target}
            color="bg-blue-500 text-blue-600"
          />
          <StatCard
            title="Quest Campaigns"
            value={questCounter ? questCounter.toString() : "0"}
            trend="+8%"
            label="Claimed: 450"
            icon={Zap}
            color="bg-amber-500 text-amber-600"
          />
          <StatCard
            title="Reputation NFTs"
            value="1,240"
            trend="+15%"
            label="Verified Solvers"
            icon={Users}
            color="bg-purple-500 text-purple-600"
          />
          <StatCard
            title="Total Volume"
            value="45.8 ETH"
            trend="+20%"
            label="Across all features"
            icon={Wallet}
            color="bg-[#0EA885] text-[#0EA885]"
          />
        </div>

        {/* Navigation Tabs - Pill Style */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className={`rounded-lg transition-all px-6 ${isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-16">

          {/* Bounties Section */}
          {(activeSection === "all" || activeSection === "bounties") && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Latest Bounties</h2>
                </div>
                {activeSection === "all" && (
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400 hover:text-[#0EA885]" onClick={() => setActiveSection("bounties")}>
                    VIEW ALL <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {loadingBounties ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#0EA885]"></div>
                </div>
              ) : bounties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {bounties.slice(0, activeSection === "all" ? 4 : undefined).map((bounty) => {
                    const metadata = bountyMetadata.get(bounty.id);
                    const title = metadata?.title || bounty.description.split("\n")[0] || "Untitled Bounty Task";

                    return (
                      <div
                        key={bounty.id}
                        onClick={() => router.push(`/bounties/${bounty.id}`)}
                        className="group cursor-pointer rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        <div className="relative w-full h-32 overflow-hidden bg-slate-50">
                          {metadata?.images && metadata.images.length > 0 ? (
                            <img
                              src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
                              alt={title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Target className="h-8 w-8 text-slate-200" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            {getStatusBadge(bounty.status)}
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2 leading-snug group-hover:text-[#0EA885] transition-colors">
                            {title}
                          </h3>
                          <p className="text-[10px] font-medium text-slate-400 mb-4">
                            by {bounty.creator.substring(0, 6)}...{bounty.creator.substring(38)}
                          </p>

                          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Clock className="h-3 w-3" />
                              {formatDeadline(bounty.deadline)}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-slate-900">
                                {(Number(bounty.amount) / 1e18).toFixed(3)} <span className="text-[10px] font-bold text-slate-400">ETH</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Target className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No active bounties found.</p>
                </div>
              )}
            </div>
          )}

          {/* Quests Section */}
          {(activeSection === "all" || activeSection === "quests") && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Quests</h2>
                </div>
                {activeSection === "all" && (
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400 hover:text-[#0EA885]" onClick={() => setActiveSection("quests")}>
                    VIEW ALL <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {loadingQuests ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-amber-500"></div>
                </div>
              ) : quests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {quests
                    .filter((q) => !q.resolved && !q.cancelled)
                    .slice(0, activeSection === "all" ? 4 : undefined)
                    .map((quest) => (
                      <div
                        key={quest.id}
                        onClick={() => router.push(`/quests/${quest.id}`)}
                        className="group cursor-pointer rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        <div className="relative w-full h-32 overflow-hidden bg-slate-50 flex items-center justify-center">
                          <Zap className="h-8 w-8 text-slate-200" />
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-600 border-slate-100 font-bold text-[9px]">
                              {Number(quest.totalRecipients)} SPOTS
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-sm font-bold text-slate-900 mb-1 truncate group-hover:text-amber-600 transition-colors">
                            {quest.title || `Quest #${quest.id}`}
                          </h3>
                          <p className="text-[10px] font-medium text-slate-400 mb-4">
                            by {quest.creator.substring(0, 6)}...{quest.creator.substring(38)}
                          </p>

                          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Clock className="h-3 w-3" />
                              {formatDeadline(quest.deadline)}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-slate-900">
                                {(Number(quest.amount) / 1e18).toFixed(2)} <span className="text-[10px] font-bold text-slate-400">ETH</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Zap className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No active quests found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}