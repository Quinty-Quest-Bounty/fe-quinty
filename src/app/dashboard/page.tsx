"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Target,
  Zap,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  LayoutGrid,
  List,
  Check,
  BarChart3,
  X,
} from "lucide-react";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
} from "../../utils/ipfs";
import {
  getEthPriceInUSD,
  convertEthToUSD,
  formatUSD,
} from "../../utils/prices";

type FilterType = "all" | "live" | "in-review" | "completed" | "development" | "ended";
type ItemType = "bounty" | "quest";
type TypeFilter = "all" | "bounties" | "quests";
type CategoryFilter = "all" | "development" | "design" | "marketing" | "research" | "other";
type ViewMode = "card" | "list";

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  status: number;
  metadataCid?: string;
  type: "bounty";
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
  type: "quest";
}

type UnifiedItem = Bounty | Quest;

const ITEMS_PER_PAGE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [showStats, setShowStats] = useState(false);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bountyMetadata, setBountyMetadata] = useState<Map<number, BountyMetadata>>(new Map());
  const [ethPrice, setEthPrice] = useState<number>(0);

  // Fetch ETH price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Read counters
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
  });

  const { data: questCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.AirdropBounty as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: "airdropCounter",
  });

  // Load bounties
  useEffect(() => {
    let isMounted = true;
    const loadBounties = async () => {
      if (!bountyCounter || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      const count = Number(bountyCounter);
      const loadedBounties: Bounty[] = [];

      for (let i = count; i >= Math.max(1, count - ITEMS_PER_PAGE + 1); i--) {
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
              type: "bounty",
            });
          }
        } catch (err) {
          console.error(`Error loading bounty ${i}:`, err);
        }
      }

      if (isMounted) {
        setBounties(loadedBounties);
        setLoading(false);
      }
    };
    loadBounties();
    return () => { isMounted = false; };
  }, [bountyCounter]);

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

  // Load quests
  useEffect(() => {
    let isMounted = true;
    const loadQuests = async () => {
      if (!questCounter || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      const count = Number(questCounter);
      const loadedQuests: Quest[] = [];

      for (let i = count; i >= Math.max(1, count - ITEMS_PER_PAGE + 1); i--) {
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
              type: "quest",
            });
          }
        } catch (err) {
          console.error(`Error loading quest ${i}:`, err);
        }
      }

      if (isMounted) {
        setQuests(loadedQuests);
      }
    };
    loadQuests();
    return () => { isMounted = false; };
  }, [questCounter]);

  // Unified filtering
  const unifiedItems: UnifiedItem[] = useMemo(() => {
    let combined = [...bounties, ...quests];

    // Type filter (Bounties/Quests)
    if (typeFilter === "bounties") {
      combined = combined.filter(item => item.type === "bounty");
    } else if (typeFilter === "quests") {
      combined = combined.filter(item => item.type === "quest");
    }

    // Category filter (for bounties only)
    if (categoryFilter !== "all") {
      combined = combined.filter(item => {
        if (item.type === "bounty") {
          const bounty = item as Bounty;
          const metadata = bountyMetadata.get(bounty.id);
          return metadata?.bountyType === categoryFilter;
        }
        return true; // Don't filter quests by category
      });
    }

    // Status filter
    return combined.filter(item => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const isEnded = item.deadline < now;

      if (item.type === "bounty") {
        const bounty = item as Bounty;
        if (activeFilter === "all") return true;
        if (activeFilter === "live") return bounty.status === 1 && !isEnded; // OPEN
        if (activeFilter === "in-review") return bounty.status === 2; // REVEAL
        if (activeFilter === "completed") return bounty.status === 3; // RESOLVED
        if (activeFilter === "development") return bounty.status === 0; // OPREC
        if (activeFilter === "ended") return isEnded;
      } else {
        const quest = item as Quest;
        if (activeFilter === "all") return true;
        if (activeFilter === "live") return !quest.resolved && !quest.cancelled && !isEnded;
        if (activeFilter === "completed") return quest.resolved;
        if (activeFilter === "ended") return isEnded || quest.cancelled;
      }
      return false;
    });
  }, [bounties, quests, activeFilter, typeFilter, categoryFilter, bountyMetadata]);

  const getStatusInfo = (item: UnifiedItem) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const isEnded = item.deadline < now;

    if (isEnded) {
      return { label: "ENDED", color: "bg-slate-100 text-slate-600 border-slate-200" };
    }

    if (item.type === "bounty") {
      const bounty = item as Bounty;
      const statusMap = [
        { label: "DEVELOPMENT", color: "bg-blue-50 text-blue-600 border-blue-200" }, // OPREC
        { label: "LIVE", color: "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20" }, // OPEN
        { label: "IN REVIEW", color: "bg-amber-50 text-amber-600 border-amber-200" }, // REVEAL
        { label: "COMPLETED", color: "bg-slate-100 text-slate-600 border-slate-200" }, // RESOLVED
        { label: "DISPUTED", color: "bg-rose-50 text-rose-600 border-rose-200" }, // DISPUTED
        { label: "EXPIRED", color: "bg-slate-100 text-slate-400 border-slate-200" }, // EXPIRED
      ];
      return statusMap[bounty.status] || statusMap[5];
    } else {
      const quest = item as Quest;
      if (quest.resolved) {
        return { label: "COMPLETED", color: "bg-slate-100 text-slate-600 border-slate-200" };
      }
      if (quest.cancelled) {
        return { label: "ENDED", color: "bg-slate-100 text-slate-400 border-slate-200" };
      }
      return { label: "LIVE", color: "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20" };
    }
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

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "live", label: "Live" },
    { id: "in-review", label: "In Review" },
    { id: "completed", label: "Completed" },
    { id: "development", label: "Development" },
    { id: "ended", label: "Ended" },
  ];

  const typeFilters: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "bounties", label: "Bounties" },
    { id: "quests", label: "Quests" },
  ];

  const categoryFilters: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "All Categories" },
    { id: "development", label: "Development" },
    { id: "design", label: "Design" },
    { id: "marketing", label: "Marketing" },
    { id: "research", label: "Research" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0EA885] to-[#0c8a6f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-2">
                Trust shouldn't be optional.
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium">
                Discover bounties and quests, contribute to projects, and earn rewards
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-48 h-28 bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <TrendingUp className="w-16 h-16 text-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Stats Toggle Button - Mobile Only */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0EA885] text-white flex items-center justify-center shadow-lg hover:bg-[#0c8a6f] transition-colors border-2 border-white"
        >
          {showStats ? <X className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
        </button>

        {/* Two Column Layout - Stack on mobile */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            {/* Explore Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Explore</h2>

                {/* View Toggle */}
                <div className="flex items-center gap-0 bg-white border border-slate-200">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-colors ${viewMode === "card" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-colors border-l border-slate-200 ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Bars */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {/* Type Filters - Top Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
                    {typeFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setTypeFilter(filter.id)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap ${typeFilter === filter.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Category Dropdown */}
                  {(typeFilter === "all" || typeFilter === "bounties") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 sm:h-9 px-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap">
                          <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">{categoryFilters.find(f => f.id === categoryFilter)?.label || "Category"}</span>
                          <span className="sm:hidden">All Categories</span>
                          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {categoryFilters.map((filter) => (
                          <DropdownMenuItem
                            key={filter.id}
                            onClick={() => setCategoryFilter(filter.id)}
                            className="text-xs uppercase tracking-wider cursor-pointer"
                          >
                            <Check className={`w-4 h-4 mr-2 ${categoryFilter === filter.id ? "opacity-100" : "opacity-0"}`} />
                            {filter.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Status Filters - Bottom Row - Scrollable on mobile */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap ${activeFilter === filter.id
                        ? "bg-[#0EA885] text-white border-[#0EA885]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid/List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin border-4 border-slate-200 border-t-[#0EA885] w-12 h-12"></div>
                </div>
              ) : unifiedItems.length > 0 ? (
                <div className={viewMode === "card" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" : "flex flex-col gap-3 sm:gap-4"}>
                  {unifiedItems.map((item) => {
                    const statusInfo = getStatusInfo(item);
                    let title = "";
                    let icon = null;
                    let image = null;
                    let category = "";

                    if (item.type === "bounty") {
                      const bounty = item as Bounty;
                      const metadata = bountyMetadata.get(bounty.id);
                      title = metadata?.title || bounty.description.split("\n")[0] || "Untitled Bounty";
                      category = metadata?.bountyType || "";
                      icon = <Target className="h-10 w-10 text-slate-300" />;

                      if (metadata?.images && metadata.images.length > 0) {
                        image = `https://ipfs.io/ipfs/${metadata.images[0]}`;
                      }
                    } else {
                      const quest = item as Quest;
                      title = quest.title || `Quest #${quest.id}`;
                      icon = <Zap className="h-10 w-10 text-slate-300" />;
                    }

                    // Card View
                    if (viewMode === "card") {
                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                          className="group cursor-pointer bg-white border border-slate-200 hover:border-[#0EA885] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                        >
                          <div className="relative w-full h-36 overflow-hidden bg-slate-50 flex items-center justify-center">
                            {image ? (
                              <img
                                src={image}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              icon
                            )}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200">
                                {item.type === "bounty" ? "BOUNTY" : "QUEST"}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-[#0EA885] transition-colors">
                              {title}
                            </h3>
                            <p className="text-[10px] font-medium text-slate-400 mb-4">
                              by {item.creator.substring(0, 6)}...{item.creator.substring(38)}
                            </p>
                            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Clock className="h-3 w-3" />
                                {formatDeadline(item.deadline)}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                  <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-[8px] font-black">
                                    Ξ
                                  </div>
                                  <span className="text-sm font-black text-slate-900">
                                    {(Number(item.amount) / 1e18).toFixed(3)}
                                  </span>
                                </div>
                                {ethPrice > 0 && (
                                  <div className="text-[10px] font-medium text-slate-400">
                                    {formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // List View
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                        className="group cursor-pointer bg-white border border-slate-200 hover:border-[#0EA885] hover:shadow-md transition-all duration-200 p-4 flex items-center gap-4"
                      >
                        {/* Icon/Image */}
                        <div className="flex-shrink-0 w-14 h-14 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {image ? (
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                          ) : item.type === "bounty" ? (
                            <Target className="w-6 h-6 text-slate-400" />
                          ) : (
                            <Zap className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 mb-1 truncate group-hover:text-[#0EA885] transition-colors">
                            {title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600">
                              {item.type === "bounty" ? "BOUNTY" : "QUEST"}
                            </span>
                            {category && (
                              <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
                                {category}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDeadline(item.deadline)}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                              Ξ
                            </div>
                            <span className="text-lg font-black text-slate-900">
                              {(Number(item.amount) / 1e18).toFixed(3)}
                            </span>
                          </div>
                          {ethPrice > 0 && (
                            <div className="text-[11px] font-medium text-slate-400">
                              {formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-300">
                  <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400">No items found for this filter.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats Sidebar - Hidden by default on mobile */}
          <div className={`${showStats ? 'fixed inset-0 z-40 bg-black/50 lg:relative lg:bg-transparent' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0 order-1 lg:order-2`}>
            <div className={`${showStats ? 'fixed right-0 top-0 bottom-0 w-80 transform transition-transform duration-300 ease-in-out' : ''} lg:relative bg-white border border-slate-200 overflow-hidden h-full lg:h-auto overflow-y-auto`}>
              {/* Total Value in Escrow - Header Section */}
              <div className="bg-gradient-to-br from-[#0EA885] to-[#0c8a6f] p-5 sm:p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 transform rotate-45 translate-x-16 -translate-y-16"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs sm:text-sm font-black">
                      Ξ
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">Total in Escrow</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-black">
                      {(() => {
                        const totalEth = [...bounties, ...quests].reduce((sum, item) => {
                          return sum + (Number(item.amount) / 1e18);
                        }, 0);
                        return totalEth.toFixed(3);
                      })()}
                    </div>
                    {ethPrice > 0 && (
                      <div className="text-sm font-medium text-white/80">
                        {formatUSD(convertEthToUSD(
                          [...bounties, ...quests].reduce((sum, item) => sum + (Number(item.amount) / 1e18), 0),
                          ethPrice
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Sections */}
              <div className="divide-y divide-slate-200">
                {/* Active Bounties */}
                <div className="p-4 sm:p-5 hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Bounties</h3>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900">
                        {bounties.filter(b => b.status === 1).length}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        of {bounties.length} total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-blue-600 font-bold">
                        {bounties.length > 0 ? Math.round((bounties.filter(b => b.status === 1).length / bounties.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Quests */}
                <div className="p-4 sm:p-5 hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Quests</h3>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900">
                        {quests.filter(q => !q.resolved && !q.cancelled).length}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        of {quests.length} total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-amber-600 font-bold">
                        {quests.length > 0 ? Math.round((quests.filter(q => !q.resolved && !q.cancelled).length / quests.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Items */}
                <div className="p-4 sm:p-5 hover:bg-emerald-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Completed</h3>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Bounties</span>
                      <span className="text-xl font-black text-slate-900">
                        {bounties.filter(b => b.status === 3).length}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Quests</span>
                      <span className="text-xl font-black text-slate-900">
                        {quests.filter(q => q.resolved).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ETH Price */}
                {ethPrice > 0 && (
                  <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                          Ξ
                        </div>
                        <span className="text-xs font-bold text-slate-700">ETH Price</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{formatUSD(ethPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
