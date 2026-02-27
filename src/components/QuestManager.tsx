import React, { useState, useMemo } from "react";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { CONTRACT_ADDRESSES, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID, ETH_ADDRESS, ERC20_ABI, parseTokenAmount, getTokenInfo } from "../utils/contracts";
import { parseETH, wagmiConfig } from "../utils/web3";
import { readContract } from "@wagmi/core";
import { ensureBaseSepoliaNetwork } from "../utils/network";
import { uploadMetadataToIpfs, QuestMetadata } from "../utils/ipfs";
import QuestCard from "./QuestCard";
import { useQuests } from "../hooks/useQuests";
import { QuestListSkeleton } from "./quests/QuestSkeleton";
import { QuestFilters } from "./quests/QuestFilters";
import { QuestForm } from "./quests/QuestForm";
import { Button } from "./ui/button";
import { Settings, Plus, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestManager() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const { quests, entryCounts, isLoading, refetch } = useQuests();

  const [activeTab, setActiveTab] = useState<"browse" | "create" | "manage">("browse");
  const [showPastQuests, setShowPastQuests] = useState(false);

  const activeQuests = useMemo(() => {
    return quests.filter(a => !a.resolved && !a.cancelled);
  }, [quests]);

  const pastQuests = useMemo(() => {
    return quests.filter(a => a.resolved || a.cancelled);
  }, [quests]);

  const userQuests = useMemo(() => {
    return quests.filter(a => a.creator.toLowerCase() === address?.toLowerCase());
  }, [quests, address]);

  const handleCreateQuest = async (formData: any) => {
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      const networkOk = await ensureBaseSepoliaNetwork();
      if (!networkOk) return;
    }

    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log("Creating quest with form data:", formData);
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);
      const token = formData.token || ETH_ADDRESS;
      const perQualifierWei = token === ETH_ADDRESS
        ? parseETH(formData.perQualifier)
        : parseTokenAmount(formData.perQualifier, token);
      const totalAmount = perQualifierWei * BigInt(formData.maxQualifiers);

      // Create quest metadata with images array (same pattern as bounties)
      const metadata: QuestMetadata = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        deadline: deadlineTimestamp,
        questType: formData.questType || "other",
      };

      // Upload metadata to Pinata
      const metadataCid = await uploadMetadataToIpfs(metadata);

      if (token !== ETH_ADDRESS) {
        // ERC-20: approve then create
        const contractAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`;
        const allowance = await readContract(wagmiConfig, {
          address: token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, contractAddress],
        }) as bigint;

        if (allowance < totalAmount) {
          const approveHash = await writeContractAsync({
            address: token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [contractAddress, totalAmount],
          });
          const { waitForTransactionReceipt } = await import("wagmi/actions");
          await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        }
      }

      const result = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
        abi: QUEST_ABI,
        functionName: "createQuest",
        args: [
          formData.title,
          `${formData.description}\n\nMetadata: ipfs://${metadataCid}`,
          perQualifierWei,
          BigInt(formData.maxQualifiers),
          BigInt(deadlineTimestamp),
          formData.requirements,
          token as `0x${string}`,
        ],
        value: token === ETH_ADDRESS ? totalAmount : 0n,
      });

      console.log("Quest created successfully:", result);

      // Wait a bit for the transaction to be indexed
      setTimeout(() => {
        refetch();
        setActiveTab("browse");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating quest:", error);
      alert(`Error creating quest: ${error.message || error}`);
      console.error(error);
    }
  };

  return (
    <div className="space-y-10">
      {/* Unified Header Section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 text-balance">Quests</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium text-pretty">
          Participate in community tasks and earn rewards directly on-chain.
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200">
          {[
            { id: "browse", label: "Browse", icon: LayoutGrid },
            { id: "manage", label: "My Quests", icon: Settings },
            { id: "create", label: "Create", icon: Plus },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className={`transition-all px-6 ${activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <tab.icon className="size-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "create" ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <QuestForm onSubmit={handleCreateQuest} isPending={false} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {activeTab === "browse" && (
                <QuestFilters
                  showPastQuests={showPastQuests}
                  setShowPastQuests={setShowPastQuests}
                />
              )}

              {isLoading ? (
                <QuestListSkeleton />
              ) : (() => {
                const displayQuests = activeTab === "browse" ? activeQuests : userQuests;

                console.log(`${activeTab} tab - Showing ${displayQuests.length} quests`, { address, totalQuests: quests.length });

                if (displayQuests.length === 0) {
                  return (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center size-16 bg-slate-100 mb-4">
                        <Settings className="size-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 text-balance mb-2">
                        {activeTab === "manage" ? "No quests created yet" : "No quests found"}
                      </h3>
                      <p className="text-slate-500 text-sm text-pretty mb-6">
                        {activeTab === "manage"
                          ? "Create your first quest to get started"
                          : "Check back later for new quests"}
                      </p>
                      {activeTab === "manage" && (
                        <Button onClick={() => setActiveTab("create")} className="bg-[#0EA885] hover:bg-[#0EA885]/90">
                          <Plus className="size-4 mr-2" />
                          Create Quest
                        </Button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayQuests.map(a => (
                      <QuestCard
                        key={a.id}
                        quest={a}
                        entryCount={entryCounts[a.id] || 0}
                      />
                    ))}
                  </div>
                );
              })()}

              {activeTab === "browse" && showPastQuests && pastQuests.length > 0 && (
                <div className="pt-12 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 mb-8 text-center uppercase">Past Quests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60">
                    {pastQuests.map(a => (
                      <QuestCard
                        key={a.id}
                        quest={a}
                        entryCount={entryCounts[a.id] || 0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
