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
const getCategoryColor = (category?: string): string => {
  switch (category) {
    case "development": return "bg-gradient-to-br from-sky-50 to-blue-50";
    case "design": return "bg-gradient-to-br from-violet-50 to-purple-50";
    case "marketing": return "bg-gradient-to-br from-amber-50 to-orange-50";
    case "research": return "bg-gradient-to-br from-emerald-50 to-teal-50";
    default: return "bg-gradient-to-br from-stone-50 to-slate-50";
  }
};

const getCategoryBadgeColor = (category?: string): string => {
  switch (category) {
    case "development": return "bg-sky-100/80 text-sky-700 border-sky-200/60";
    case "design": return "bg-violet-100/80 text-violet-700 border-violet-200/60";
    case "marketing": return "bg-amber-100/80 text-amber-700 border-amber-200/60";
    case "research": return "bg-emerald-100/80 text-emerald-700 border-emerald-200/60";
    default: return "bg-stone-100/80 text-stone-600 border-stone-200/60";
  }
};

const getAvatarUrl = (address: string, size: number = 40) => {
  // Use DiceBear API with identicon style - creates geometric block patterns
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&size=${size}`;
};

// === SKELETON COMPONENTS ===
const SkeletonCard = () => (
  <div className="bg-white  shadow-sm border border-stone-100 overflow-hidden animate-pulse">
    <div className="h-40 bg-gradient-to-br from-stone-100 to-stone-50" />
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8  bg-stone-100" />
        <div className="h-3 w-24 bg-stone-100 " />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-4/5 bg-stone-100 " />
        <div className="h-3 w-1/2 bg-stone-50 " />
      </div>
      <div className="pt-4 border-t border-stone-50 flex justify-between items-center">
        <div className="h-3 w-16 bg-stone-100 " />
        <div className="h-5 w-24 bg-stone-100 " />
      </div>
    </div>
  </div>
);

const SkeletonListItem = () => (
  <div className="bg-white  shadow-sm border border-stone-100 px-5 py-4 flex items-center gap-5 animate-pulse">
    <div className="w-14 h-14  bg-gradient-to-br from-stone-100 to-stone-50 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-stone-100 " />
      <div className="h-3 w-1/2 bg-stone-50 " />
    </div>
    <div className="h-6 w-24 bg-stone-100 " />
  </div>
);

const SidebarSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="bg-gradient-to-br from-stone-100 to-stone-50 h-28 " />
    <div className="bg-white  shadow-sm border border-stone-100 overflow-hidden">
      <div className="h-10 bg-stone-50" />
      <div className="p-5 space-y-4">
        <div className="h-24 bg-gradient-to-br from-stone-100 to-stone-50 " />
        <div className="h-4 w-3/4 bg-stone-100 " />
        <div className="h-3 w-1/2 bg-stone-50 " />
      </div>
    </div>
    <div className="bg-white  shadow-sm border border-stone-100 overflow-hidden">
      <div className="h-10 bg-stone-50" />
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between py-2">
            <div className="h-3 w-24 bg-stone-100 " />
            <div className="h-3 w-10 bg-stone-100 " />
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
  const [questMetadata, setQuestMetadata] = useState<Map<number, QuestMetadata>>(new Map());
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

  // Load bounty metadata
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

  // Load quest metadata
  useEffect(() => {
    const loadQuestMetadata = async () => {
      const newMeta = new Map<number, QuestMetadata>();
      for (const q of quests) {
        if (q.metadataCid && !questMetadata.has(q.id)) {
          try {
            const meta = await fetchMetadataFromIpfs(q.metadataCid);
            newMeta.set(q.id, meta);
          } catch { }
        }
      }
      if (newMeta.size > 0) setQuestMetadata(prev => new Map([...prev, ...newMeta]));
    };
    if (quests.length > 0) loadQuestMetadata();
  }, [quests]);

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
            const [creator, title, description, totalAmount, , , qualifiersCount, deadline, , resolved, cancelled] = questData as any[];
            // Extract metadata CID from description
            let metadataCid;
            if (description && typeof description === "string") {
              const match = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
              metadataCid = match ? match[1] : undefined;
            }
            loadedQuests.push({ id: i, creator, title, description: description || "", amount: totalAmount, totalRecipients: qualifiersCount, deadline: BigInt(deadline), resolved, cancelled, type: "quest", metadataCid });
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
        if (item.type === "quest") {
          const meta = questMetadata.get((item as Quest).id);
          return meta?.questType === categoryFilter;
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
    if (isEnded) return { label: "Ended", color: "bg-stone-100/80 text-stone-500" };

    if (item.type === "bounty") {
      const map = [
        { label: "Open", color: "bg-[#0EA885]/15 text-[#0EA885]" },
        { label: "Judging", color: "bg-amber-100/80 text-amber-700" },
        { label: "Resolved", color: "bg-stone-100/80 text-stone-600" },
        { label: "Slashed", color: "bg-rose-100/80 text-rose-600" },
      ];
      return map[(item as Bounty).status] || map[0];
    }
    const q = item as Quest;
    if (q.resolved) return { label: "Completed", color: "bg-stone-100/80 text-stone-600" };
    if (q.cancelled) return { label: "Cancelled", color: "bg-stone-100/80 text-stone-400" };
    return { label: "Live", color: "bg-[#0EA885]/15 text-[#0EA885]" };
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
    const meta = questMetadata.get(q.id);
    return {
      title: q.title || `Quest #${q.id}`,
      image: meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null,
      category: meta?.questType || "",
      subCount,
    };
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
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50/50 pb-24 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Mobile stats toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#0EA885] to-[#0c9478] text-white  flex items-center justify-center shadow-lg shadow-[#0EA885]/25 hover:shadow-xl hover:shadow-[#0EA885]/30 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          {showStats ? <X className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ===== MAIN CONTENT ===== */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Explore</h2>
                <p className="text-stone-500 mt-1 text-sm">Discover bounties and quests</p>
              </div>
              <div className="flex items-center bg-white  shadow-sm border border-stone-100 p-1">
                <button onClick={() => setViewMode("card")} className={`h-9 w-9  flex items-center justify-center transition-all duration-200 ${viewMode === "card" ? "bg-stone-900 text-white shadow-sm" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`h-9 w-9  flex items-center justify-center transition-all duration-200 ${viewMode === "list" ? "bg-stone-900 text-white shadow-sm" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white  shadow-sm border border-stone-100 p-4 mb-6 space-y-4">
              {/* Row 1: Type tabs + Search + Sort */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-stone-100/60  p-1 flex-shrink-0">
                  {typeFilters.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTypeFilter(f.id)}
                      className={`px-4 py-2 text-xs font-semibold  transition-all duration-200 whitespace-nowrap ${typeFilter === f.id
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <Input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search bounties & quests..."
                    className="pl-11 pr-10 h-11 text-sm bg-stone-50/50 border-stone-100  focus:bg-white focus:border-[#0EA885] focus:ring-[#0EA885]/20 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-11 px-4 flex items-center gap-2 text-sm font-medium bg-stone-50/50 text-stone-600 border border-stone-100  hover:bg-stone-100/50 hover:border-stone-200 transition-all whitespace-nowrap flex-shrink-0">
                      <ArrowUpDown className="w-4 h-4 text-stone-400" />
                      <span className="hidden sm:inline">{sortOptions.find(s => s.id === sortBy)?.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48  shadow-lg border-stone-100">
                    {sortOptions.map(opt => (
                      <DropdownMenuItem key={opt.id} onClick={() => setSortBy(opt.id)} className="text-sm cursor-pointer ">
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
                      className={`px-4 py-2 text-xs font-semibold  transition-all duration-200 whitespace-nowrap ${activeFilter === f.id
                        ? "bg-[#0EA885] text-white shadow-sm shadow-[#0EA885]/25"
                        : "bg-stone-100/60 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-9 px-4 flex items-center gap-2 text-xs font-semibold bg-stone-100/60 text-stone-600  hover:bg-stone-100 transition-all whitespace-nowrap ml-3 flex-shrink-0">
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{categoryFilters.find(f => f.id === categoryFilter)?.label}</span>
                      <span className="sm:hidden">Category</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52  shadow-lg border-stone-100">
                    {categoryFilters.map(f => (
                      <DropdownMenuItem key={f.id} onClick={() => setCategoryFilter(f.id)} className="text-sm cursor-pointer ">
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
                {/* Color legend */}
                <div className="flex items-center gap-4 text-[11px] text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#0EA885]" />
                    <span>Bounty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-amber-400" />
                    <span>Quest</span>
                  </div>
                </div>
                {/* Results count */}
                <p className="text-[11px] text-stone-400">
                  <span className="font-medium text-stone-600">{unifiedItems.length}</span> results
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {displayedItems.map(item => {
                    const statusInfo = getStatusInfo(item);
                    const { title, image, category, subCount } = getItemData(item);

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                        className="group cursor-pointer bg-white shadow-sm hover:shadow-xl hover:shadow-stone-200/50 border border-stone-100 hover:border-stone-200 transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        {/* Type color bar at top */}
                        <div className={`h-1 w-full ${item.type === "bounty" ? "bg-[#0EA885]" : "bg-amber-400"}`} />

                        {/* Image - Clean, no overlays */}
                        <div className="relative w-full h-36 overflow-hidden">
                          {image ? (
                            <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className={`w-full h-full ${getCategoryColor(category)} flex items-center justify-center`}>
                              {item.type === "bounty" ? (
                                <Target className="w-10 h-10 text-stone-300" />
                              ) : (
                                <Zap className="w-10 h-10 text-stone-300" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          {/* Title */}
                          <h3 className="text-[15px] font-semibold text-stone-800 mb-3 line-clamp-2 leading-snug group-hover:text-[#0EA885] transition-colors">
                            {title}
                          </h3>

                          {/* Creator */}
                          <div className="flex items-center gap-2 mb-3">
                            <img src={getAvatarUrl(item.creator, 18)} alt="" className="w-[18px] h-[18px] flex-shrink-0" />
                            <WalletName address={item.creator} className="text-[11px] text-stone-400 truncate" />
                          </div>

                          {/* Footer: Meta info + Price */}
                          <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] text-stone-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDeadline(item.deadline)}
                              </span>
                              {subCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {subCount}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Image src={ethIcon} alt="ETH" width={18} height={18} className="flex-shrink-0" />
                                <span className="text-base font-bold text-stone-800">{(Number(item.amount) / 1e18).toFixed(3)}</span>
                              </div>
                              {ethPrice > 0 && (
                                <div className="text-[11px] font-medium text-stone-400 mt-0.5">{formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {displayedItems.map(item => {
                    const { title, image, category, subCount } = getItemData(item);

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(`/${item.type === "bounty" ? "bounties" : "quests"}/${item.id}`)}
                        className="group cursor-pointer bg-white shadow-sm hover:shadow-md border border-stone-100 hover:border-stone-200 transition-all duration-200 flex items-center overflow-hidden"
                      >
                        {/* Type indicator bar */}
                        <div className={`w-1 self-stretch flex-shrink-0 ${item.type === "bounty" ? "bg-[#0EA885]" : "bg-amber-400"}`} />

                        <div className="flex items-center gap-4 px-4 py-3 flex-1">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-12 h-12 overflow-hidden">
                            {image ? (
                              <img src={image} alt={title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full ${getCategoryColor(category)} flex items-center justify-center`}>
                                {item.type === "bounty" ? <Target className="w-5 h-5 text-stone-300" /> : <Zap className="w-5 h-5 text-stone-300" />}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-stone-800 truncate group-hover:text-[#0EA885] transition-colors">{title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDeadline(item.deadline)}
                              </span>
                              {subCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {subCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex-shrink-0 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Image src={ethIcon} alt="ETH" width={18} height={18} className="flex-shrink-0" />
                              <span className="text-base font-bold text-stone-800">{(Number(item.amount) / 1e18).toFixed(3)}</span>
                            </div>
                            {ethPrice > 0 && <div className="text-[11px] text-stone-400 mt-0.5">{formatUSD(convertEthToUSD(Number(item.amount) / 1e18, ethPrice))}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-20 bg-white  border-2 border-dashed border-stone-200">
                <div className="w-16 h-16  bg-stone-100 flex items-center justify-center mx-auto mb-5">
                  <Search className="h-8 w-8 text-stone-300" />
                </div>
                <p className="text-base font-semibold text-stone-600 mb-2">No results found</p>
                <p className="text-sm text-stone-400 max-w-sm mx-auto">Try adjusting your filters or search query to find what you&apos;re looking for</p>
              </div>
            )}

            {/* ===== LOAD MORE ===== */}
            {!loading && displayedItems.length < unifiedItems.length && (
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
                  className="px-8 py-3 h-auto text-sm font-semibold  border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-all"
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
              className={`${showStats ? "fixed right-0 top-0 bottom-0 w-80 overflow-y-auto p-4" : ""} lg:relative lg:sticky lg:top-24 space-y-5 bg-gradient-to-b from-stone-50 to-white lg:bg-transparent`}
              onClick={e => e.stopPropagation()}
            >
              {loading ? <SidebarSkeleton /> : (
                <>
                  {/* Total in Escrow */}
                  <div className="bg-gradient-to-br from-[#0EA885] via-[#0c9478] to-[#0a7d66] p-5  text-white shadow-lg shadow-[#0EA885]/20">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-10 h-10  bg-white/20 flex items-center justify-center">
                        <Image src={ethIcon} alt="ETH" width={24} height={24} className="flex-shrink-0" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Total in Escrow</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight">{stats.totalEth.toFixed(3)}</span>
                      <span className="text-sm font-medium text-white/60">ETH</span>
                    </div>
                    {ethPrice > 0 && <div className="text-sm font-medium text-white/70 mt-2">{formatUSD(convertEthToUSD(stats.totalEth, ethPrice))}</div>}
                  </div>

                  {/* Featured Bounty */}
                  {featuredBounty && (() => {
                    const meta = bountyMetadata.get(featuredBounty.id);
                    const fImage = meta?.images?.[0] ? formatIpfsUrl(meta.images[0]) : null;
                    const fTitle = meta?.title || `Bounty #${featuredBounty.id}`;
                    return (
                      <div className="bg-white  shadow-sm border border-stone-100 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/50 flex items-center gap-2">
                          <div className="w-6 h-6  bg-amber-100 flex items-center justify-center">
                            <Star className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <span className="text-xs font-semibold text-amber-800">Featured Bounty</span>
                        </div>
                        <div
                          className="p-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                          onClick={() => router.push(`/bounties/${featuredBounty.id}`)}
                        >
                          <div className="w-full h-28 mb-4  overflow-hidden">
                            {fImage ? (
                              <img src={fImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center">
                                <Target className="w-10 h-10 text-stone-300" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-stone-800 mb-3 line-clamp-2 leading-snug">{fTitle}</h4>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Image src={ethIcon} alt="ETH" width={18} height={18} className="flex-shrink-0" />
                              <span className="text-base font-bold text-stone-800">{(Number(featuredBounty.amount) / 1e18).toFixed(3)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-medium">{formatDeadline(featuredBounty.deadline)}</span>
                            </div>
                          </div>
                          <Button className="w-full bg-stone-900 hover:bg-stone-800 text-white  h-10 text-sm font-medium gap-2">
                            View Bounty <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Stats */}
                  <div className="bg-white  shadow-sm border border-stone-100 overflow-hidden">
                    <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-100 flex items-center gap-2">
                      <div className="w-6 h-6  bg-stone-200/60 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-stone-500" />
                      </div>
                      <span className="text-xs font-semibold text-stone-700">Quick Stats</span>
                    </div>
                    <div className="divide-y divide-stone-50">
                      <div className="px-4 py-3.5 flex items-center justify-between">
                        <span className="text-sm text-stone-500">Active Bounties</span>
                        <span className="text-base font-bold text-green-600 bg-green-50 px-2.5 py-0.5 ">{stats.activeBounties}</span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-between">
                        <span className="text-sm text-stone-500">Active Quests</span>
                        <span className="text-base font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 ">{stats.activeQuests}</span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-between">
                        <span className="text-sm text-stone-500">Completed</span>
                        <span className="text-base font-bold text-sky-600 bg-sky-5g0 px-2.5 py-0.5 ">{stats.completed}</span>
                      </div>
                      {ethPrice > 0 && (
                        <div className="px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-purple-50/50">
                          <span className="text-sm text-stone-500 flex items-center gap-2">
                            <Image src={ethIcon} alt="ETH" width={18} height={18} className="flex-shrink-0" />
                            ETH Price
                          </span>
                          <span className="text-base font-bold text-stone-800">{formatUSD(ethPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {recentActivity.length > 0 && (
                    <div className="bg-white  shadow-sm border border-stone-100 overflow-hidden">
                      <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-100 flex items-center gap-2">
                        <div className="w-6 h-6  bg-stone-200/60 flex items-center justify-center">
                          <Activity className="w-3.5 h-3.5 text-stone-500" />
                        </div>
                        <span className="text-xs font-semibold text-stone-700">Recent Activity</span>
                      </div>
                      <div className="divide-y divide-stone-50">
                        {recentActivity.map((act, i) => {
                          return (
                            <div
                              key={i}
                              className="px-4 py-3.5 flex items-start gap-3 hover:bg-stone-50/50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/${act.type === "bounty" ? "bounties" : "quests"}/${act.id}`)}
                            >
                              <img src={getAvatarUrl(act.creator, 32)} alt="" className="w-8 h-8  ring-2 ring-stone-100 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-stone-700 font-medium truncate leading-snug">{act.title}</p>
                                <p className="text-xs text-stone-400 mt-1">
                                  <span className={`font-medium ${act.action === "Now live" ? "text-[#0EA885]" :
                                    act.action === "Completed" || act.action === "Resolved" ? "text-stone-500" : "text-amber-600"
                                    }`}>{act.action}</span>
                                  <span className="mx-1.5">&bull;</span>
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