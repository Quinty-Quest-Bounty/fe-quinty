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

  const { data: realBounties = [], isLoading } = useQuery({
    queryKey: ["sidebar-bounties", chainId],
    queryFn: async () => {
      const bountyCounter = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "bountyCounter",
      });

      const count = Number(bountyCounter);
      const loadedBounties = [];

      // Always add the example bounty first
      loadedBounties.push(getExampleBounty());

      for (let i = 1; i <= count; i++) {
        try {
          const data = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[chainId].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(i)],
          });

          if (data) {
            const bountyArray = data as any[];
            const description = bountyArray[1];
            const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
            const metadataCid = metadataMatch ? metadataMatch[1] : undefined;

            loadedBounties.push({
              id: i,
              description: bountyArray[1],
              amount: bountyArray[2],
              status: bountyArray[6],
              metadataCid,
              submissions: { length: 0 }, // Simplified for sidebar
            });
          }
        } catch (e) {
          console.error(`Error loading bounty ${i}:`, e);
        }
      }

      return loadedBounties.reverse();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
  });

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
