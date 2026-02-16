"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import Image from "next/image";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  QUEST_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { readContract } from "@wagmi/core";
import { wagmiConfig, formatAddress } from "../../utils/web3";
import { WalletName } from "../../components/WalletName";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Target,
  Clock,
  Filter,
  ChevronDown,
  LayoutGrid,
  List,
  Check,
  BarChart3,
  X,
  Search,
  Users,
  ArrowUpDown,
  Plus,
  ArrowRight,
  Star,
  Activity,
} from "lucide-react";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
  QuestMetadata,
  formatIpfsUrl,
} from "../../utils/ipfs";
import {
  getEthPriceInUSD,
  convertEthToUSD,
  formatUSD,
} from "../../utils/prices";
import ethIcon from "../../assets/crypto/eth.svg";

// === TYPES ===
type FilterType = "all" | "live" | "in-review" | "completed" | "ended";
type TypeFilter = "all" | "bounties" | "quests";
type CategoryFilter = "all" | "development" | "design" | "marketing" | "research" | "other";
type ViewMode = "card" | "list";
type SortBy = "newest" | "highest_reward" | "ending_soon";

interface Bounty {
  id: number;
  creator: string;
  title?: string;
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
  description: string;
  amount: bigint;
  totalRecipients: bigint;
  deadline: bigint;
  resolved: boolean;
  cancelled: boolean;
  type: "quest";
  metadataCid?: string;
}

type UnifiedItem = Bounty | Quest;

// === CONSTANTS ===
const ITEMS_PER_PAGE = 20;
const DISPLAY_PER_PAGE = 12;
const LOAD_MORE_COUNT = 12;

// === HELPERS ===
const getAvatarUrl = (address: string, size: number = 40) => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&size=${size}`;
};

// === SKELETON COMPONENTS ===
const SkeletonCard = () => (
  <div className="bg-white border border-zinc-200 overflow-hidden animate-pulse">
    <div className="h-40 bg-zinc-100" />
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-100" />
        <div className="h-3 w-24 bg-zinc-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-4/5 bg-zinc-100" />
        <div className="h-3 w-1/2 bg-zinc-50" />
      </div>
      <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
        <div className="h-3 w-16 bg-zinc-100" />
        <div className="h-5 w-24 bg-zinc-100" />
      </div>
    </div>
  </div>
);

const SkeletonListItem = () => (
  <div className="bg-white border border-zinc-200 px-5 py-4 flex items-center gap-5 animate-pulse">
    <div className="w-14 h-14 bg-zinc-100 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-zinc-100" />
      <div className="h-3 w-1/2 bg-zinc-50" />
    </div>
    <div className="h-6 w-24 bg-zinc-100" />
  </div>
);

const SidebarSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="bg-zinc-100 h-28" />
    <div className="bg-white border border-zinc-200 overflow-hidden">
      <div className="h-10 bg-zinc-50" />
      <div className="p-5 space-y-4">
        <div className="h-24 bg-zinc-100" />
        <div className="h-4 w-3/4 bg-zinc-100" />
        <div className="h-3 w-1/2 bg-zinc-50" />
      </div>
    </div>
  </div>
);

// === MAIN COMPONENT ===
export default function DashboardPage() {
  const router = useRouter();

  // UI State
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [showStats, setShowStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [displayCount, setDisplayCount] = useState(DISPLAY_PER_PAGE);

  // Data State
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bountyMetadata, setBountyMetadata] = useState<Map<number, BountyMetadata>>(new Map());
  const [questMetadata, setQuestMetadata] = useState<Map<number, QuestMetadata>>(new Map());
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [submissionCounts, setSubmissionCounts] = useState<Map<string, number>>(new Map());

  const searchRef = useRef<HTMLInputElement>(null);

  // === EFFECTS ===

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setDisplayCount(DISPLAY_PER_PAGE);
  }, [activeFilter, typeFilter, categoryFilter, debouncedSearch, sortBy]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName || "";
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !["INPUT", "TEXTAREA"].includes(tag)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
  });

  const { data: questCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.Quest as `0x${string}`,
    abi: QUEST_ABI,
    functionName: "questCounter",
  });

  useEffect(() => {
    let isMounted = true;
    const loadBounties = async () => {
      if (bountyCounter === undefined || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;
      const count = Number(bountyCounter);
      if (count === 0) { if (isMounted) setLoading(false); return; }
      const loadedBounties: Bounty[] = [];
      for (let i = count; i >= Math.max(1, count - ITEMS_PER_PAGE + 1); i--) {
        try {
          const bountyData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI, functionName: "getBounty", args: [BigInt(i)],
          });
          if (bountyData && Array.isArray(bountyData)) {
            const [creator, title, description, amount, openDeadline, judgingDeadline, slashPercent, status] = bountyData as any[];
            let metadataCid;
            if (description && typeof description === "string") {
              const match = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
              metadataCid = match ? match[1] : undefined;
            }
            loadedBounties.push({ id: i, creator, title, description: description || "", amount, deadline: judgingDeadline, status, metadataCid, type: "bounty" });
          }
        } catch (err) { console.error(`Error loading bounty ${i}:`, err); }
      }
      if (isMounted) { setBounties(loadedBounties); setLoading(false); }
    };
    loadBounties();
    return () => { isMounted = false; };
  }, [bountyCounter]);

  useEffect(() => {
    const loadMetadata = async () => {
      const newMeta = new Map<number, BountyMetadata>();
      for (const b of bounties) {
        if (b.metadataCid && !bountyMetadata.has(b.id)) {
          try { const meta = await fetchMetadataFromIpfs(b.metadataCid); newMeta.set(b.id, meta); } catch { }
        }
      }
      if (newMeta.size > 0) setBountyMetadata(prev => new Map([...prev, ...newMeta]));
    };
    if (bounties.length > 0) loadMetadata();
  }, [bounties]);

  useEffect(() => {
    const loadQuestMetadata = async () => {
      const newMeta = new Map<number, QuestMetadata>();
      for (const q of quests) {
        if (q.metadataCid && !questMetadata.has(q.id)) {
          try { const meta = await fetchMetadataFromIpfs(q.metadataCid); newMeta.set(q.id, meta); } catch { }
        }
      }
      if (newMeta.size > 0) setQuestMetadata(prev => new Map([...prev, ...newMeta]));
    };
    if (quests.length > 0) loadQuestMetadata();
  }, [quests]);

  useEffect(() => {
    let isMounted = true;
    const loadQuests = async () => {
      if (questCounter === undefined || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;
      const count = Number(questCounter);
      if (count === 0) return;
      const loadedQuests: Quest[] = [];
      for (let i = count; i >= Math.max(1, count - ITEMS_PER_PAGE + 1); i--) {
        try {
          const questData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
            abi: QUEST_ABI, functionName: "getQuest", args: [BigInt(i)],
          });
          if (questData && Array.isArray(questData)) {
            const [creator, title, description, totalAmount, , , qualifiersCount, deadline, , resolved, cancelled] = questData as any[];
            let metadataCid;
            if (description && typeof description === "string") {
              const match = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
              metadataCid = match ? match[1] : undefined;
            }
            loadedQuests.push({ id: i, creator, title, description: description || "", amount: totalAmount, totalRecipients: qualifiersCount, deadline: BigInt(deadline), resolved, cancelled, type: "quest", metadataCid });
          }
        } catch (err) { console.error(`Error loading quest ${i}:`, err); }
      }
      if (isMounted) setQuests(loadedQuests);
    };
    loadQuests();
    return () => { isMounted = false; };
  }, [questCounter]);

  useEffect(() => {
    const fetchCounts = async () => {
      const counts = new Map<string, number>();
      for (const b of bounties) {
        try {
          const c = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI, functionName: "getSubmissionCount", args: [BigInt(b.id)],
          });
          counts.set(`bounty-${b.id}`, Number(c));
        } catch { }
      }
      for (const q of quests) {
        try {
          const c = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
            abi: QUEST_ABI, functionName: "getEntryCount", args: [BigInt(q.id)],
          });
          counts.set(`quest-${q.id}`, Number(c));
        } catch { }
      }
      if (counts.size > 0) setSubmissionCounts(prev => new Map([...prev, ...counts]));
    };
    if (bounties.length > 0 || quests.length > 0) fetchCounts();
  }, [bounties, quests]);

  // === COMPUTED ===

  const unifiedItems: UnifiedItem[] = useMemo(() => {
    let combined = [...bounties, ...quests];
    if (typeFilter === "bounties") combined = combined.filter(i => i.type === "bounty");
    else if (typeFilter === "quests") combined = combined.filter(i => i.type === "quest");

    if (categoryFilter !== "all") {
      combined = combined.filter(item => {
        if (item.type === "bounty") { const meta = bountyMetadata.get((item as Bounty).id); return meta?.bountyType === categoryFilter; }
        if (item.type === "quest") { const meta = questMetadata.get((item as Quest).id); return meta?.questType === categoryFilter; }
        return true;
      });
    }

    combined = combined.filter(item => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const isEnded = item.deadline < now;
      if (item.type === "bounty") {
        const b = item as Bounty;
        if (activeFilter === "all") return true;
        if (activeFilter === "live") return (b.status === 0 || b.status === 1);
        if (activeFilter === "in-review") return b.status === 1;
        if (activeFilter === "completed") return b.status === 2;
        if (activeFilter === "ended") return b.status === 2 || b.status === 3;
      } else {
        const q = item as Quest;
        if (activeFilter === "all") return true;
        if (activeFilter === "live") return !q.resolved && !q.cancelled && !isEnded;
        if (activeFilter === "completed") return q.resolved;
        if (activeFilter === "ended") return isEnded || q.cancelled;
      }
      return false;
    });

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      combined = combined.filter(item => {
        if (item.type === "bounty") {
          const b = item as Bounty; const meta = bountyMetadata.get(b.id);
          return (meta?.title || "").toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.creator.toLowerCase().includes(q);
        }
        const quest = item as Quest;
        return quest.title.toLowerCase().includes(q) || quest.creator.toLowerCase().includes(q);
      });
    }

    combined.sort((a, b) => {
      if (sortBy === "highest_reward") return Number(b.amount) - Number(a.amount);
      if (sortBy === "ending_soon") return Number(a.deadline) - Number(b.deadline);
      return b.id - a.id;
    });
    return combined;
  }, [bounties, quests, activeFilter, typeFilter, categoryFilter, bountyMetadata, questMetadata, debouncedSearch, sortBy]);

  const displayedItems = useMemo(() => unifiedItems.slice(0, displayCount), [unifiedItems, displayCount]);

  const featuredBounty = useMemo(() => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const live = bounties.filter(b => b.status === 1 && b.deadline >= now);
    if (live.length === 0) return null;
    return live.sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }, [bounties]);

  const recentActivity = useMemo(() => {
    const items: { type: "bounty" | "quest"; id: number; title: string; action: string; creator: string }[] = [];
    bounties.slice(0, 3).forEach(b => {
      const meta = bountyMetadata.get(b.id);
      const action = b.status === 3 ? "Resolved" : b.status === 2 ? "In review" : "Now live";
      items.push({ type: "bounty", id: b.id, title: meta?.title || `Bounty #${b.id}`, action, creator: b.creator });
    });
    quests.slice(0, 2).forEach(q => {
      items.push({ type: "quest", id: q.id, title: q.title || `Quest #${q.id}`, action: q.resolved ? "Completed" : "Now live", creator: q.creator });
    });
    return items.slice(0, 5);
  }, [bounties, quests, bountyMetadata]);

  const stats = useMemo(() => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return {
      activeBounties: bounties.filter(b => (b.status === 0 || b.status === 1)).length,
      activeQuests: quests.filter(q => !q.resolved && !q.cancelled && q.deadline >= now).length,
      completed: bounties.filter(b => b.status === 2).length + quests.filter(q => q.resolved).length,
      totalEth: [...bounties, ...quests].reduce((sum, item) => sum + Number(item.amount) / 1e18, 0),
    };
  }, [bounties, quests]);

  // === HELPERS ===

  const getStatusInfo = (item: UnifiedItem) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const isEnded = item.deadline < now;
    if (isEnded) return { label: "Ended", color: "bg-zinc-100 text-zinc-500 border-zinc-200" };
    if (item.type === "bounty") {
      const map = [
        { label: "Open", color: "bg-[#E6FAF5] text-[#0EA885] border-[#0EA885]/20" },
        { label: "Judging", color: "bg-amber-50 text-amber-600 border-amber-200/60" },
        { label: "Resolved", color: "bg-zinc-100 text-zinc-600 border-zinc-200" },
        { label: "Slashed", color: "bg-rose-50 text-rose-600 border-rose-200/60" },
      ];
      return map[(item as Bounty).status] || map[0];
    }
    const q = item as Quest;
    if (q.resolved) return { label: "Completed", color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
    if (q.cancelled) return { label: "Cancelled", color: "bg-zinc-100 text-zinc-400 border-zinc-200" };
    return { label: "Live", color: "bg-[#E6FAF5] text-[#0EA885] border-[#0EA885]/20" };
  };

  const formatDeadline = (deadline: bigint | number) => {
    try {
      const diff = new Date(Number(deadline) * 1000).getTime() - Date.now();
      if (diff < 0) return "Ended";
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      return days > 0 ? `${days}d left` : `${hours}h left`;
    } catch { return "N/A"; }
  };

  const getItemData = (item: UnifiedItem) => {
    const subCount = submissionCounts.get(`${item.type}-${item.id}`) || 0;
    if (item.type === "bounty") {
      const b = item as Bounty; const meta = bountyMetadata.get(b.id);
      return { title: meta?.title || b.description.split("\n")[0] || "Untitled Bounty", image: meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null, category: meta?.bountyType || "", subCount };
    }
    const q = item as Quest; const meta = questMetadata.get(q.id);
    return { title: q.title || `Quest #${q.id}`, image: meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null, category: meta?.questType || "", subCount };
  };

  // === FILTER CONFIG ===
  const statusFilters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" }, { id: "live", label: "Live" }, { id: "in-review", label: "In Review" }, { id: "completed", label: "Completed" }, { id: "ended", label: "Ended" },
  ];
  const typeFilters: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "All" }, { id: "bounties", label: "Bounties" }, { id: "quests", label: "Quests" },
  ];
  const categoryFilters: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "All Categories" }, { id: "development", label: "Development" }, { id: "design", label: "Design" }, { id: "marketing", label: "Marketing" }, { id: "research", label: "Research" }, { id: "other", label: "Other" },
  ];
  const sortOptions: { id: SortBy; label: string }[] = [
    { id: "newest", label: "Newest" }, { id: "highest_reward", label: "Highest Reward" }, { id: "ending_soon", label: "Ending Soon" },
  ];

  // === RENDER ===
  return (
    <div className="min-h-screen bg-white pb-24 pt-20 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
        {/* Mobile stats toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0EA885] text-white flex items-center justify-center shadow-lg hover:bg-[#0c9478] active:bg-[#0a8266] transition-colors duration-200"
        >
          {showStats ? <X className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ===== MAIN CONTENT ===== */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            {/* Section header */}
            <div className="border-b border-zinc-200 pb-3 mb-8 flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-7 bg-[#0EA885]" />
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">Explore</h2>
              </div>
              <div className="flex items-center bg-zinc-50 border border-zinc-200 p-1">
                <button onClick={() => setViewMode("card")} className={`h-9 w-9 flex items-center justify-center transition-all duration-200 ${viewMode === "card" ? "bg-[#0EA885] text-white shadow-sm" : "text-zinc-400 hover:text-[#0EA885] hover:bg-zinc-100"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`h-9 w-9 flex items-center justify-center transition-all duration-200 ${viewMode === "list" ? "bg-[#0EA885] text-white shadow-sm" : "text-zinc-400 hover:text-[#0EA885] hover:bg-zinc-100"}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-zinc-200 p-4 mb-6 space-y-4">
              {/* Row 1: Type tabs + Search + Sort */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-50 p-1 flex-shrink-0">
                  {typeFilters.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTypeFilter(f.id)}
                      className={`px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${typeFilter === f.id
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
                  <Input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search bounties & quests..."
                    className="pl-11 pr-10 h-11 text-sm bg-white border-zinc-200 focus:bg-white focus:border-[#0EA885] focus:ring-[#0EA885]/20 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-11 px-4 flex items-center gap-2 text-sm font-medium bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-800 transition-all whitespace-nowrap flex-shrink-0">
                      <ArrowUpDown className="w-4 h-4 text-zinc-400" />
                      <span className="hidden sm:inline">{sortOptions.find(s => s.id === sortBy)?.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 border-zinc-200">
                    {sortOptions.map(opt => (
                      <DropdownMenuItem key={opt.id} onClick={() => setSortBy(opt.id)} className="text-sm cursor-pointer">
                        <Check className={`w-4 h-4 mr-2 text-[#0EA885] ${sortBy === opt.id ? "opacity-100" : "opacity-0"}`} />
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Row 2: Status pills + Category dropdown */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                  {statusFilters.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${activeFilter === f.id
                        ? "bg-[#0EA885] text-white"
                        : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-9 px-4 flex items-center gap-2 text-xs font-semibold bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 transition-all whitespace-nowrap ml-3 flex-shrink-0">
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{categoryFilters.find(f => f.id === categoryFilter)?.label}</span>
                      <span className="sm:hidden">Category</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 border-zinc-200">
                    {categoryFilters.map(f => (
                      <DropdownMenuItem key={f.id} onClick={() => setCategoryFilter(f.id)} className="text-sm cursor-pointer">
                        <Check className={`w-4 h-4 mr-2 text-[#0EA885] ${categoryFilter === f.id ? "opacity-100" : "opacity-0"}`} />
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Legend + Results */}
            {!loading && (
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#0EA885]" />
                    <span>Bounty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-amber-400" />
                    <span>Quest</span>
                  </div>
                </div>
                <p className="text-[11px] font-mono text-zinc-400">
                  <span className="font-medium text-[#0EA885]">{unifiedItems.length}</span> results
                  {debouncedSearch && <span className="ml-1">for &ldquo;{debouncedSearch}&rdquo;</span>}
                </p>
              </div>
            )}

            {/* ===== CONTENT ===== */}
            {loading ? (
              viewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonListItem key={i} />)}
                </div>
              )
            ) : displayedItems.length > 0 ? (
              viewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayedItems.map(item => {
                    const statusInfo = getStatusInfo(item);
                    const { title, image, category, subCount } = getItemData(item);

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                        className="group cursor-pointer bg-white hover:shadow-md hover:shadow-[#0EA885]/5 border border-zinc-200 hover:border-[#0EA885]/30 transition-all duration-200 overflow-hidden flex flex-col"
                      >
                        {/* Image — clean, nothing overlaid */}
                        {image ? (
                          <div className="h-44 w-full overflow-hidden">
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`h-20 w-full ${item.type === "bounty" ? "bg-gradient-to-r from-[#0EA885]/5 to-transparent" : "bg-gradient-to-r from-amber-400/5 to-transparent"}`} />
                        )}

                        <div className="p-4 flex flex-col flex-1">
                          {/* Status + type */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                              statusInfo.label === "Open" || statusInfo.label === "Live" ? "bg-[#0EA885]/10 text-[#0EA885]" :
                              statusInfo.label === "Judging" ? "bg-amber-500/10 text-amber-600" :
                              "bg-zinc-100 text-zinc-500"
                            }`}>{statusInfo.label}</span>
                            <span className="text-[10px] font-mono text-zinc-300">#{item.id}</span>
                          </div>

                          {/* Title */}
                          <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 mb-2 group-hover:text-[#0EA885] transition-colors">
                            {title}
                          </h3>

                          {/* Creator */}
                          <div className="flex items-center gap-1.5 mb-3">
                            <img src={getAvatarUrl(item.creator, 16)} alt="" className="w-4 h-4 flex-shrink-0" />
                            <WalletName address={item.creator} className="text-[11px] text-zinc-400 truncate font-mono" />
                          </div>

                          {/* Data strip */}
                          <div className="mt-auto pt-3 border-t border-zinc-100 flex items-end justify-between">
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-zinc-900 tabular-nums tracking-tight">{(Number(item.amount) / 1e18).toFixed(3)}</span>
                                <span className="text-[10px] font-mono font-semibold text-zinc-400">ETH</span>
                              </div>
                              {ethPrice > 0 && (
                                <span className="text-[10px] font-mono text-zinc-300 tabular-nums">{formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {subCount > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                  <Users className="w-3 h-3" />
                                  <span className="tabular-nums">{subCount}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatDeadline(item.deadline)}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#0EA885] transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {displayedItems.map(item => {
                    const statusInfo = getStatusInfo(item);
                    const { title, image, subCount } = getItemData(item);

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                        className="group cursor-pointer bg-white hover:shadow-sm hover:shadow-[#0EA885]/5 border border-zinc-200 hover:border-[#0EA885]/30 transition-all duration-200 flex items-center overflow-hidden"
                      >
                        {/* Type indicator */}
                        <div className={`w-[3px] self-stretch flex-shrink-0 ${item.type === "bounty" ? "bg-[#0EA885]" : "bg-amber-400"}`} />

                        <div className="flex items-center gap-4 px-4 py-3 flex-1 min-w-0">
                          {/* Thumbnail */}
                          {image ? (
                            <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-zinc-100">
                              <img src={image} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-20 h-20 flex-shrink-0 ${item.type === "bounty" ? "bg-[#0EA885]/5" : "bg-amber-400/5"}`} />
                          )}

                          {/* Status dot + title */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-zinc-300 tabular-nums flex-shrink-0">#{item.id}</span>
                              <h3 className="text-sm font-semibold text-zinc-800 truncate group-hover:text-[#0EA885] transition-colors">{title}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-400">
                              <span className={`font-bold uppercase tracking-wider ${statusInfo.color.includes("[#0EA885]") ? "text-[#0EA885]" : statusInfo.color.includes("amber") ? "text-amber-500" : "text-zinc-400"}`}>{statusInfo.label}</span>
                              <span className="text-zinc-200">|</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDeadline(item.deadline)}
                              </span>
                              {subCount > 0 && (
                                <>
                                  <span className="text-zinc-200">|</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {subCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Reward */}
                          <div className="flex-shrink-0 text-right">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className="text-base font-bold text-zinc-900 tabular-nums">{(Number(item.amount) / 1e18).toFixed(3)}</span>
                              <span className="text-[10px] font-mono font-semibold text-zinc-400">ETH</span>
                            </div>
                            {ethPrice > 0 && <div className="text-[10px] font-mono text-zinc-300 mt-0.5 tabular-nums">{formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}</div>}
                          </div>

                          <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#0EA885] transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-20 bg-white border border-zinc-200">
                <div className="w-16 h-16 bg-zinc-50 flex items-center justify-center mx-auto mb-5">
                  <Search className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-base font-semibold text-zinc-600 mb-2">No results found</p>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">Try adjusting your filters or search query to find what you&apos;re looking for</p>
              </div>
            )}

            {/* ===== LOAD MORE ===== */}
            {!loading && displayedItems.length < unifiedItems.length && (
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
                  className="px-8 py-3 h-auto text-sm font-semibold border-zinc-200 hover:bg-[#0EA885]/5 hover:border-[#0EA885]/30 hover:text-[#0EA885] transition-all"
                >
                  Load more ({unifiedItems.length - displayedItems.length} remaining)
                </Button>
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <div
            className={`${showStats ? "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:relative lg:bg-transparent lg:backdrop-blur-none" : "hidden"} lg:block w-full lg:w-80 flex-shrink-0 order-1 lg:order-2`}
            onClick={() => setShowStats(false)}
          >
            <div
              className={`${showStats ? "fixed right-0 top-0 bottom-0 w-80 overflow-y-auto p-4" : ""} lg:relative lg:sticky lg:top-24 space-y-5 bg-white lg:bg-transparent`}
              onClick={e => e.stopPropagation()}
            >
              {loading ? <SidebarSkeleton /> : (
                <>
                  {/* Total in Escrow */}
                  <div className="bg-white p-5 border border-zinc-200 border-l-2 border-l-[#0EA885]">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-10 h-10 bg-[#0EA885]/5 flex items-center justify-center">
                        <Image src={ethIcon} alt="ETH" width={24} height={24} className="flex-shrink-0" />
                      </div>
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0EA885]">Total in Escrow</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">{stats.totalEth.toFixed(3)}</span>
                      <span className="text-sm font-mono font-medium text-zinc-400">ETH</span>
                    </div>
                    {ethPrice > 0 && <div className="text-sm font-mono font-medium text-zinc-400 mt-2">{formatUSD(convertEthToUSD(stats.totalEth, ethPrice))}</div>}
                  </div>

                  {/* Featured Bounty */}
                  {featuredBounty && (() => {
                    const meta = bountyMetadata.get(featuredBounty.id);
                    const fImage = meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null;
                    const fTitle = meta?.title || `Bounty #${featuredBounty.id}`;
                    return (
                      <div className="bg-white border border-zinc-200 overflow-hidden">
                        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                          <div className="w-6 h-6 bg-amber-100 flex items-center justify-center">
                            <Star className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <span className="text-xs font-mono font-semibold text-zinc-600">Featured Bounty</span>
                        </div>
                        <div
                          className="p-4 cursor-pointer hover:bg-[#0EA885]/5 transition-colors"
                          onClick={() => router.push(`/bounties/${featuredBounty.id}`)}
                        >
                          <div className="w-full h-28 mb-4 overflow-hidden">
                            {fImage ? (
                              <img src={fImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
                                <Target className="w-10 h-10 text-zinc-200" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-800 mb-3 line-clamp-2 leading-snug">{fTitle}</h4>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Image src={ethIcon} alt="ETH" width={18} height={18} className="flex-shrink-0" />
                              <span className="text-base font-bold text-zinc-800">{(Number(featuredBounty.amount) / 1e18).toFixed(3)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-medium">{formatDeadline(featuredBounty.deadline)}</span>
                            </div>
                          </div>
                          <Button className="w-full bg-[#0EA885] hover:bg-[#0c9478] text-white h-10 text-sm font-medium gap-2">
                            View Bounty <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Stats */}
                  <div className="bg-white border border-zinc-200 overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-100 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <span className="text-xs font-mono font-semibold text-zinc-600">Quick Stats</span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      <div className="px-4 py-3.5 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Active Bounties</span>
                        <span className="text-base font-bold text-[#0EA885] font-mono tabular-nums">{stats.activeBounties}</span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Active Quests</span>
                        <span className="text-base font-bold text-amber-600 font-mono tabular-nums">{stats.activeQuests}</span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Completed</span>
                        <span className="text-base font-bold text-zinc-600 font-mono tabular-nums">{stats.completed}</span>
                      </div>
                      {ethPrice > 0 && (
                        <div className="px-4 py-3.5 flex items-center justify-between">
                          <span className="text-sm text-zinc-500 flex items-center gap-2">
                            <Image src={ethIcon} alt="ETH" width={18} height={18} className="flex-shrink-0" />
                            ETH Price
                          </span>
                          <span className="text-base font-bold text-zinc-800 font-mono">{formatUSD(ethPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {recentActivity.length > 0 && (
                    <div className="bg-white border border-zinc-200 overflow-hidden">
                      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                        <div className="w-6 h-6 bg-zinc-100 flex items-center justify-center">
                          <Activity className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                        <span className="text-xs font-mono font-semibold text-zinc-600">Recent Activity</span>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {recentActivity.map((act, i) => {
                          return (
                            <div
                              key={i}
                              className="group relative px-4 py-3.5 flex items-start gap-3 cursor-pointer transition-colors"
                              onClick={() => router.push(`/${act.type === "bounty" ? "bounties" : "quests"}/${act.id}`)}
                            >
                              {/* Full-bleed hover */}
                              <div className="absolute inset-0 bg-[#0EA885]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                              <img src={getAvatarUrl(act.creator, 32)} alt="" className="relative w-8 h-8 ring-2 ring-zinc-100 flex-shrink-0" />
                              <div className="relative flex-1 min-w-0">
                                <p className="text-sm text-zinc-700 font-medium truncate leading-snug">{act.title}</p>
                                <p className="text-xs text-zinc-400 mt-1 font-mono">
                                  <span className={`font-medium ${act.action === "Now live" ? "text-[#0EA885]" :
                                    act.action === "Completed" || act.action === "Resolved" ? "text-zinc-500" : "text-amber-600"
                                    }`}>{act.action}</span>
                                  <span className="mx-1.5 text-zinc-300">|</span>
                                  <WalletName address={act.creator} />
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
