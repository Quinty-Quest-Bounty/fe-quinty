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
  Zap,
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
  amount: bigint;
  totalRecipients: bigint;
  deadline: bigint;
  resolved: boolean;
  cancelled: boolean;
  type: "quest";
}

type UnifiedItem = Bounty | Quest;

// === CONSTANTS ===
const ITEMS_PER_PAGE = 20;
const DISPLAY_PER_PAGE = 12;
const LOAD_MORE_COUNT = 12;

// === HELPERS ===
const getCategoryColor = (category?: string): string => {
  // All categories use very light solid color
  return "bg-slate-100 dark:bg-slate-200";
};

const getCategoryBadgeColor = (category?: string): string => {
  switch (category) {
    case "development": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
    case "design": return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
    case "marketing": return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
    case "research": return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    default: return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  }
};

const getAvatarUrl = (address: string, size: number = 40) => {
  // Use DiceBear API with identicon style - creates geometric block patterns
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&size=${size}`;
};

// === SKELETON COMPONENTS ===
const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
    <div className="h-36 bg-slate-200 dark:bg-slate-800" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  </div>
);

const SkeletonListItem = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
  </div>
);

const SidebarSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-slate-200 dark:bg-slate-800 h-24" />
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="h-8 bg-slate-100 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="h-8 bg-slate-100 dark:bg-slate-800" />
      <div className="p-3 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between py-1">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
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
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [submissionCounts, setSubmissionCounts] = useState<Map<string, number>>(new Map());

  const searchRef = useRef<HTMLInputElement>(null);

  // === EFFECTS ===

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset display count on filter/sort/search change
  useEffect(() => {
    setDisplayCount(DISPLAY_PER_PAGE);
  }, [activeFilter, typeFilter, categoryFilter, debouncedSearch, sortBy]);

  // Keyboard shortcut: / or Ctrl+K to focus search
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

  // Fetch ETH price
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Read counters
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

  // Load bounties
  useEffect(() => {
    let isMounted = true;
    const loadBounties = async () => {
      if (bountyCounter === undefined || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      const count = Number(bountyCounter);
      if (count === 0) {
        if (isMounted) setLoading(false);
        return;
      }

      const loadedBounties: Bounty[] = [];
      for (let i = count; i >= Math.max(1, count - ITEMS_PER_PAGE + 1); i--) {
        try {
          const bountyData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBounty",
            args: [BigInt(i)],
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

  // Load metadata
  useEffect(() => {
    const loadMetadata = async () => {
      const newMeta = new Map<number, BountyMetadata>();
      for (const b of bounties) {
        if (b.metadataCid && !bountyMetadata.has(b.id)) {
          try {
            const meta = await fetchMetadataFromIpfs(b.metadataCid);
            newMeta.set(b.id, meta);
          } catch { }
        }
      }
      if (newMeta.size > 0) setBountyMetadata(prev => new Map([...prev, ...newMeta]));
    };
    if (bounties.length > 0) loadMetadata();
  }, [bounties]);

  // Load quests
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
            abi: QUEST_ABI,
            functionName: "getQuest",
            args: [BigInt(i)],
          });
          if (questData && Array.isArray(questData)) {
            const [creator, title, , totalAmount, , , qualifiersCount, deadline, , resolved, cancelled] = questData as any[];
            loadedQuests.push({ id: i, creator, title, amount: totalAmount, totalRecipients: qualifiersCount, deadline: BigInt(deadline), resolved, cancelled, type: "quest" });
          }
        } catch (err) {
          console.error(`Error loading quest ${i}:`, err);
        }
      }
      if (isMounted) setQuests(loadedQuests);
    };
    loadQuests();
    return () => { isMounted = false; };
  }, [questCounter]);

  // Fetch submission counts
  useEffect(() => {
    const fetchCounts = async () => {
      const counts = new Map<string, number>();
      for (const b of bounties) {
        try {
          const c = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getSubmissionCount",
            args: [BigInt(b.id)],
          });
          counts.set(`bounty-${b.id}`, Number(c));
        } catch { }
      }
      for (const q of quests) {
        try {
          const c = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
            abi: QUEST_ABI,
            functionName: "getEntryCount",
            args: [BigInt(q.id)],
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
        if (item.type === "bounty") {
          const meta = bountyMetadata.get((item as Bounty).id);
          return meta?.bountyType === categoryFilter;
        }
        return true;
      });
    }

    combined = combined.filter(item => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const isEnded = item.deadline < now;
      if (item.type === "bounty") {
        const b = item as Bounty;
        if (activeFilter === "all") return true;
        // Live = OPEN (0) or JUDGING (1)
        if (activeFilter === "live") return (b.status === 0 || b.status === 1);
        if (activeFilter === "in-review") return b.status === 1; // JUDGING
        if (activeFilter === "completed") return b.status === 2; // RESOLVED
        if (activeFilter === "ended") return b.status === 2 || b.status === 3; // RESOLVED or SLASHED
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
          const b = item as Bounty;
          const meta = bountyMetadata.get(b.id);
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
  }, [bounties, quests, activeFilter, typeFilter, categoryFilter, bountyMetadata, debouncedSearch, sortBy]);

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
      // Active = OPEN (0) or JUDGING (1) phase
      activeBounties: bounties.filter(b => (b.status === 0 || b.status === 1)).length,
      activeQuests: quests.filter(q => !q.resolved && !q.cancelled && q.deadline >= now).length,
      // Completed = RESOLVED (2) for bounties
      completed: bounties.filter(b => b.status === 2).length + quests.filter(q => q.resolved).length,
      totalEth: [...bounties, ...quests].reduce((sum, item) => sum + Number(item.amount) / 1e18, 0),
    };
  }, [bounties, quests]);

  // === HELPERS ===

  const getStatusInfo = (item: UnifiedItem) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const isEnded = item.deadline < now;
    if (isEnded) return { label: "ENDED", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };

    if (item.type === "bounty") {
      const map = [
        { label: "OPEN", color: "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20" },
        { label: "JUDGING", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
        { label: "RESOLVED", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
        { label: "SLASHED", color: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
      ];
      return map[(item as Bounty).status] || map[0];
    }
    const q = item as Quest;
    if (q.resolved) return { label: "COMPLETED", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };
    if (q.cancelled) return { label: "ENDED", color: "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700" };
    return { label: "LIVE", color: "bg-[#0EA885]/10 text-[#0EA885] border-[#0EA885]/20" };
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
      const b = item as Bounty;
      const meta = bountyMetadata.get(b.id);
      return {
        title: meta?.title || b.description.split("\n")[0] || "Untitled Bounty",
        image: meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null,
        category: meta?.bountyType || "",
        subCount,
      };
    }
    const q = item as Quest;
    return { title: q.title || `Quest #${q.id}`, image: null, category: "", subCount };
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Mobile stats toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#0EA885] text-white flex items-center justify-center shadow-lg hover:bg-[#0c8a6f] transition-colors"
        >
          {showStats ? <X className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ===== MAIN CONTENT ===== */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Explore</h2>
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewMode("card")} className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-colors ${viewMode === "card" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-colors border-l border-slate-200 dark:border-slate-700 ${viewMode === "list" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Row 1: Type tabs + Search + Sort */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                {typeFilters.map(f => (
                  <button key={f.id} onClick={() => setTypeFilter(f.id)} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap ${typeFilter === f.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search... ( / )" className="pl-9 pr-8 h-9 text-sm" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 px-3 flex items-center gap-2 text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap flex-shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{sortOptions.find(s => s.id === sortBy)?.label}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {sortOptions.map(opt => (
                    <DropdownMenuItem key={opt.id} onClick={() => setSortBy(opt.id)} className="text-xs cursor-pointer">
                      <Check className={`w-4 h-4 mr-2 ${sortBy === opt.id ? "opacity-100" : "opacity-0"}`} />
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Row 2: Status pills + Category dropdown */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
                {statusFilters.map(f => (
                  <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap ${activeFilter === f.id ? "bg-[#0EA885] text-white border-[#0EA885]" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              {(typeFilter === "all" || typeFilter === "bounties") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-8 px-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap ml-2 flex-shrink-0">
                      <Filter className="w-3 h-3" />
                      <span className="hidden sm:inline">{categoryFilters.find(f => f.id === categoryFilter)?.label}</span>
                      <span className="sm:hidden">Category</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {categoryFilters.map(f => (
                      <DropdownMenuItem key={f.id} onClick={() => setCategoryFilter(f.id)} className="text-xs uppercase tracking-wider cursor-pointer">
                        <Check className={`w-4 h-4 mr-2 ${categoryFilter === f.id ? "opacity-100" : "opacity-0"}`} />
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Results count */}
            {!loading && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
                Showing {Math.min(displayCount, unifiedItems.length)} of {unifiedItems.length} items
                {debouncedSearch && <span className="ml-1">for &quot;{debouncedSearch}&quot;</span>}
              </div>
            )}

            {/* ===== CONTENT ===== */}
            {loading ? (
              viewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                        className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0EA885] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        {/* Image / Solid Fallback */}
                        <div className="relative w-full h-36 overflow-hidden">
                          {image ? (
                            <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-200 flex items-center justify-center">
                              {item.type === "bounty" ? <Target className="w-10 h-10 text-slate-400 dark:text-slate-500" /> : <Zap className="w-10 h-10 text-slate-400 dark:text-slate-500" />}
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusInfo.color}`}>{statusInfo.label}</span>
                            {category && <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(category)}`}>{category}</span>}
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/90 dark:bg-black/70 backdrop-blur-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.type === "bounty" ? "BOUNTY" : "QUEST"}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={getAvatarUrl(item.creator, 20)} alt="" className="w-5 h-5 flex-shrink-0" />
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{formatAddress(item.creator)}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#0EA885] transition-colors">{title}</h3>
                          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                <Clock className="h-3 w-3" />{formatDeadline(item.deadline)}
                              </div>
                              {subCount > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  <Users className="h-3 w-3" />{subCount}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Image src={ethIcon} alt="ETH" width={16} height={16} className="flex-shrink-0" />
                                <span className="text-sm font-black text-slate-900 dark:text-white">{(Number(item.amount) / 1e18).toFixed(3)}</span>
                              </div>
                              {ethPrice > 0 && (
                                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayedItems.map(item => {
                    const statusInfo = getStatusInfo(item);
                    const { title, image, category, subCount } = getItemData(item);

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                        className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0EA885] hover:shadow-md transition-all duration-200 px-4 py-3 flex items-center gap-4"
                      >
                        <div className="flex-shrink-0 w-12 h-12 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                          {image ? (
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-200 flex items-center justify-center">
                              {item.type === "bounty" ? <Target className="w-5 h-5 text-slate-400 dark:text-slate-500" /> : <Zap className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <img src={getAvatarUrl(item.creator, 16)} alt="" className="w-4 h-4 flex-shrink-0" />
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatAddress(item.creator)}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 truncate group-hover:text-[#0EA885] transition-colors">{title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusInfo.color}`}>{statusInfo.label}</span>
                            <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{item.type === "bounty" ? "BOUNTY" : "QUEST"}</span>
                            {category && <span className={`px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider border ${getCategoryBadgeColor(category)}`}>{category}</span>}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDeadline(item.deadline)}</span>
                            {subCount > 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" />{subCount}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <Image src={ethIcon} alt="ETH" width={20} height={20} className="flex-shrink-0" />
                            <span className="text-lg font-black text-slate-900 dark:text-white">{(Number(item.amount) / 1e18).toFixed(3)}</span>
                          </div>
                          {ethPrice > 0 && <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">No items found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your filters or search query</p>
              </div>
            )}

            {/* ===== LOAD MORE ===== */}
            {!loading && displayedItems.length < unifiedItems.length && (
              <div className="text-center mt-8 space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing {displayedItems.length} of {unifiedItems.length} items
                </p>
                <Button variant="outline" onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)} className="px-8 text-xs font-bold uppercase tracking-wider">
                  Load More
                </Button>
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <div
            className={`${showStats ? "fixed inset-0 z-40 bg-black/50 lg:relative lg:bg-transparent" : "hidden"} lg:block w-full lg:w-72 flex-shrink-0 order-1 lg:order-2`}
            onClick={() => setShowStats(false)}
          >
            <div
              className={`${showStats ? "fixed right-0 top-0 bottom-0 w-72 overflow-y-auto" : ""} lg:relative lg:sticky lg:top-6 space-y-4 bg-slate-50 dark:bg-slate-950 lg:bg-transparent`}
              onClick={e => e.stopPropagation()}
            >
              {loading ? <SidebarSkeleton /> : (
                <>
                  {/* Total in Escrow */}
                  <div className="bg-gradient-to-br from-[#0EA885] to-[#0c8a6f] p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Image src={ethIcon} alt="ETH" width={28} height={28} className="flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">Total in Escrow</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{stats.totalEth.toFixed(3)}</span>
                      <span className="text-xs font-medium text-white/60">ETH</span>
                    </div>
                    {ethPrice > 0 && <div className="text-sm font-medium text-white/70 mt-1">{formatUSD(convertEthToUSD(stats.totalEth, ethPrice))}</div>}
                  </div>

                  {/* Featured Bounty */}
                  {featuredBounty && (() => {
                    const meta = bountyMetadata.get(featuredBounty.id);
                    const fImage = meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null;
                    const fTitle = meta?.title || `Bounty #${featuredBounty.id}`;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Featured Bounty</span>
                        </div>
                        <div className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => router.push(`/bounties/${featuredBounty.id}`)}>
                          <div className="w-full h-24 mb-3 overflow-hidden">
                            {fImage ? (
                              <img src={fImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 dark:bg-slate-200 flex items-center justify-center">
                                <Target className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{fTitle}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Image src={ethIcon} alt="ETH" width={16} height={16} className="flex-shrink-0" />
                              <span className="text-sm font-black text-slate-900 dark:text-white">{(Number(featuredBounty.amount) / 1e18).toFixed(3)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><Clock className="w-3 h-3" />{formatDeadline(featuredBounty.deadline)}</div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-3 text-xs font-bold gap-1">
                            View Bounty <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Stats */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Stats</span>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Active Bounties</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">{stats.activeBounties}</span>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Active Quests</span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">{stats.activeQuests}</span>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Completed</span>
                      <span className="text-sm font-black text-[#0EA885]">{stats.completed}</span>
                    </div>
                    {ethPrice > 0 && (
                      <div className="px-4 py-2.5 flex items-center justify-between bg-purple-50/50 dark:bg-purple-500/5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                          <Image src={ethIcon} alt="ETH" width={16} height={16} className="flex-shrink-0" />
                          ETH Price
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatUSD(ethPrice)}</span>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  {recentActivity.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recent Activity</span>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {recentActivity.map((act, i) => {
                          return (
                            <div
                              key={i}
                              className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              onClick={() => router.push(`/${act.type === "bounty" ? "bounties" : "quests"}/${act.id}`)}
                            >
                              <img src={getAvatarUrl(act.creator, 28)} alt="" className="w-7 h-7 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{act.title}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{act.action} &bull; {formatAddress(act.creator)}</p>
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