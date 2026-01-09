"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronLeft, ChevronsLeft } from "lucide-react";
import { useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_ADDRESSES, QUINTY_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { mockBounties, getMockMetadata, getExampleBounty } from "../utils/mockBounties";
import { formatETH, wagmiConfig } from "../utils/web3";
import { useIndexerBounties } from "../hooks/useIndexer";

interface BountySidebarProps {
  currentBountyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BountySidebar({ currentBountyId, isOpen, onClose }: BountySidebarProps) {
  const router = useRouter();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const currencyLabel = isBase ? "ETH" : "MNT";

  const { data: indexerBounties = [], isLoading: isIndexerLoading } = useIndexerBounties();
  const [fallbackBounties, setFallbackBounties] = React.useState<any[]>([]);
  const [isFallbackLoading, setIsFallbackLoading] = React.useState(false);

  // Fallback logic if indexer is empty
  React.useEffect(() => {
    const loadFallback = async () => {
      if (!isIndexerLoading && indexerBounties.length === 0 && !isFallbackLoading) {
        setIsFallbackLoading(true);
        try {
          const counter = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[chainId]?.Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "bountyCounter",
          });

          const loaded = [];
          for (let i = 1; i <= Number(counter); i++) {
            const data = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[chainId]?.Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getBountyData",
              args: [BigInt(i)],
            });
            if (data) {
              const d = data as any[];
              loaded.push({
                id: i,
                description: d[1],
                amount: d[2],
                status: Number(d[6]),
                title: d[1].split("\n")[0],
              });
            }
          }
          setFallbackBounties(loaded);
        } catch (e) {
          console.error("Sidebar fallback error:", e);
        } finally {
          setIsFallbackLoading(false);
        }
      }
    };
    loadFallback();
  }, [indexerBounties, isIndexerLoading, chainId]);

  // Map data to the format expected by the sidebar
  const realBounties = React.useMemo(() => {
    const loadedBounties = [];

    // Always add the example bounty first
    loadedBounties.push(getExampleBounty());

    const sourceData = indexerBounties.length > 0 ? indexerBounties : fallbackBounties;

    sourceData.forEach((b: any) => {
      const id = typeof b.id === 'string' ? parseInt(b.id.split("-").pop()) : b.id;
      loadedBounties.push({
        id,
        description: b.description,
        amount: BigInt(b.amount),
        status: typeof b.status === 'string'
          ? (b.status === "OPREC" ? 0 : b.status === "OPEN" ? 1 : b.status === "RESOLVED" ? 3 : 2)
          : b.status,
        title: b.title || b.description?.split("\n")[0],
        metadataCid: b.metadataCid || b.description,
        submissions: { length: b.submissions?.items?.length || 0 },
      });
    });

    // Sort by ID descending (newest first)
    return loadedBounties.sort((a, b) => b.id - a.id);
  }, [indexerBounties, fallbackBounties]);

  const isLoading = isIndexerLoading || isFallbackLoading;

  return (
    <>
      {/* Sidebar Container - Fixed Position */}
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] ${isOpen ? "w-80" : "w-0"
          } transition-all duration-300 ${isOpen ? 'border-r-2' : 'border-r-0'} border-gray-900 bg-white overflow-hidden flex-shrink-0 z-30`}
      >
        <div className="h-full overflow-y-auto">
          {/* Sidebar Header - Sticky */}
          <div className="p-4 border-b-2 border-gray-900 bg-gray-50 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-sm uppercase tracking-tight">ALL BOUNTIES</h2>
              <button
                onClick={onClose}
                className="p-1 border-2 border-gray-900 hover:bg-gray-100 transition-all"
                title="Minimize sidebar"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-mono text-gray-600 uppercase">{realBounties.length} Total</p>
          </div>

          {/* Bounty List */}
          <div className="p-2">
            {isLoading ? (
              <div className="p-4 text-center font-mono text-xs text-gray-500 uppercase">
                Loading...
              </div>
            ) : realBounties.map((b) => {
              const bMetadata = getMockMetadata(b.metadataCid || "");
              const isExample = b.id === 999;
              const bountyUrlId = isExample ? "example" : b.id.toString();
              const isActive = currentBountyId === bountyUrlId;

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    router.push(`/bounties/${bountyUrlId}`);
                    // Close sidebar on mobile after navigation
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`w-full text-left p-3 mb-2 border-2 transition-all ${isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-900 bg-white hover:bg-gray-50 hover:border-blue-500"
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-8 h-8 flex-shrink-0 border-2 border-gray-900 flex items-center justify-center ${b.status === 1
                        ? "bg-green-500"
                        : b.status === 0
                          ? "bg-blue-500"
                          : "bg-gray-500"
                        }`}
                    >
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-black uppercase tracking-tight leading-tight mb-1 truncate">
                        {bMetadata?.title || b.description?.split("\n")[0] || `Bounty #${b.id}`}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
                        <span className="font-bold">{formatETH(b.amount)} {currencyLabel}</span>
                        {!isExample && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>ID: {b.id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden top-16"
          onClick={onClose}
        />
      )}
    </>
  );
}
