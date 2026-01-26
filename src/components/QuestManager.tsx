import React, { useState, useMemo } from "react";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { CONTRACT_ADDRESSES, AIRDROP_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { parseETH } from "../utils/web3";
import { ensureBaseSepoliaNetwork } from "../utils/network";
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

    try {
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);
      const perQualifierWei = parseETH(formData.perQualifier);
      const totalAmount = perQualifierWei * BigInt(formData.maxQualifiers);

      await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "createAirdrop",
        args: [
          formData.title,
          formData.description,
          perQualifierWei,
          BigInt(formData.maxQualifiers),
          BigInt(deadlineTimestamp),
          formData.requirements,
        ],
        value: totalAmount,
      });

      setActiveTab("browse");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-10">
      {/* Unified Header Section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quests</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Participate in community tasks and earn rewards directly on-chain.
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
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
              className={`rounded-lg transition-all px-6 ${activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(activeTab === "browse" ? activeQuests : userQuests).map(a => (
                    <QuestCard
                      key={a.id}
                      quest={a}
                      entryCount={entryCounts[a.id] || 0}
                    />
                  ))}
                </div>
              )}

              {activeTab === "browse" && showPastQuests && pastQuests.length > 0 && (
                <div className="pt-12 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 mb-8 text-center uppercase tracking-widest">Past Quests</h3>
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
