"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { useAdmin } from "../../hooks/useAdmin";
import { useHiddenItems } from "../../hooks/useHiddenItems";
import { useAuth } from "../../contexts/AuthContext";
import { WalletName } from "../../components/WalletName";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  QUEST_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { wagmiConfig, formatAddress } from "../../utils/web3";
import { fetchMetadataFromIpfs, BountyMetadata, QuestMetadata } from "../../utils/ipfs";
import {
  Shield,
  Eye,
  EyeOff,
  Search,
  Loader2,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface BountyItem {
  id: number;
  type: "bounty";
  title: string;
  creator: string;
  status: number;
  hidden: boolean;
}

interface QuestItem {
  id: number;
  type: "quest";
  title: string;
  creator: string;
  resolved: boolean;
  cancelled: boolean;
  hidden: boolean;
}

type Item = BountyItem | QuestItem;

export default function AdminPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { isAdmin } = useAdmin();
  const { profile } = useAuth();
  const { hiddenBountyIds, hiddenQuestIds, refetch: refetchHidden } = useHiddenItems();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bounties" | "quests">("all");
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedItems: Item[] = [];

      // Load bounties
      try {
        const bountyCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "bountyCounter",
        });
        const count = Number(bountyCounter);
        for (let i = 1; i <= count; i++) {
          try {
            const data = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getBounty",
              args: [BigInt(i)],
            }) as any[];
            let title = data[1] || `Bounty #${i}`;
            const description = data[2] || "";
            const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
            if (metadataMatch) {
              try {
                const meta = await fetchMetadataFromIpfs(metadataMatch[1]) as BountyMetadata;
                if (meta.title) title = meta.title;
              } catch {}
            }
            loadedItems.push({
              id: i,
              type: "bounty",
              title,
              creator: data[0],
              status: Number(data[9]),
              hidden: hiddenBountyIds.has(i),
            });
          } catch {}
        }
      } catch {}

      // Load quests
      try {
        const questCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
          abi: QUEST_ABI,
          functionName: "questCounter",
        });
        const count = Number(questCounter);
        for (let i = 1; i <= count; i++) {
          try {
            const data = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
              abi: QUEST_ABI,
              functionName: "getQuest",
              args: [BigInt(i)],
            }) as any[];
            loadedItems.push({
              id: i,
              type: "quest",
              title: data[1] || `Quest #${i}`,
              creator: data[0],
              resolved: data[10],
              cancelled: data[11],
              hidden: hiddenQuestIds.has(i),
            });
          } catch {}
        }
      } catch {}

      setItems(loadedItems);
    } finally {
      setIsLoading(false);
    }
  }, [hiddenBountyIds, hiddenQuestIds]);

  useEffect(() => {
    if (isAdmin) loadItems();
  }, [isAdmin, loadItems]);

  const toggleHide = async (item: Item) => {
    const key = `${item.type}-${item.id}`;
    setActionLoading(key);
    try {
      const token = localStorage.getItem('quinty_auth_token');
      if (!token) throw new Error("Not authenticated");
      if (item.hidden) {
        const res = await fetch(`${apiUrl}/moderation/unhide/${item.type}/${item.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to unhide");
      } else {
        const res = await fetch(`${apiUrl}/moderation/hide`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: item.type,
            onChainId: item.id,
            reason: "Hidden by admin",
          }),
        });
        if (!res.ok) throw new Error("Failed to hide");
      }
      await refetchHidden();
      // Update local state immediately
      setItems((prev) =>
        prev.map((i) =>
          i.type === item.type && i.id === item.id ? { ...i, hidden: !i.hidden } : i
        )
      );
    } catch (err) {
      console.error("Moderation action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (typeFilter === "bounties" && item.type !== "bounty") return false;
    if (typeFilter === "quests" && item.type !== "quest") return false;
    if (showHiddenOnly && !item.hidden) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q) ||
        `${item.id}`.includes(q)
      );
    }
    return true;
  });

  const hiddenCount = items.filter((i) => i.hidden).length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Admin Moderation</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {items.length} total items &middot; {hiddenCount} hidden
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadItems(); refetchHidden(); }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search by title, ID, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <div className="flex items-center bg-white border border-zinc-200 p-0.5">
            {(["all", "bounties", "quests"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  typeFilter === f
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {f === "all" ? "All" : f === "bounties" ? "Bounties" : "Quests"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowHiddenOnly(!showHiddenOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all ${
              showHiddenOnly
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Hidden only ({hiddenCount})
          </button>
        </div>

        {/* Items list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-sm">No items found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const key = `${item.type}-${item.id}`;
              const isToggling = actionLoading === key;
              return (
                <div
                  key={key}
                  className={`group flex items-center gap-4 px-4 py-3 bg-white border transition-all ${
                    item.hidden
                      ? "border-red-200 bg-red-50/50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {/* Type icon */}
                  <div
                    className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                      item.type === "bounty" ? "bg-amber-50" : "bg-blue-50"
                    }`}
                  >
                    {item.type === "bounty" ? (
                      <Target className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Zap className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400 uppercase">
                        {item.type} #{item.id}
                      </span>
                      {item.hidden && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-zinc-900 truncate mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      by <WalletName address={item.creator} />
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        router.push(
                          item.type === "bounty"
                            ? `/bounties/${item.id}`
                            : `/quests/${item.id}`
                        )
                      }
                      className="h-8 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 bg-white flex items-center gap-1 transition-all"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleHide(item)}
                      disabled={isToggling}
                      className={`h-8 px-3 text-xs font-medium flex items-center gap-1.5 transition-all ${
                        item.hidden
                          ? "bg-[#0EA885] text-white hover:bg-[#0c9478]"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : item.hidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Unhide
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Hide
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
