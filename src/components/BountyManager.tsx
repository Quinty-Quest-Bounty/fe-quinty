import React, { useState, useMemo, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, QUINTY_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { parseETH } from "../utils/web3";
import { uploadMetadataToIpfs, BountyMetadata } from "../utils/ipfs";
import BountyCard from "./BountyCard";
import { useBounties } from "../hooks/useBounties";
import { BountyListSkeleton } from "./bounties/BountySkeleton";
import { BountyFilters } from "./bounties/BountyFilters";
import { BountyForm } from "./bounties/BountyForm";
import { Button } from "./ui/button";
import { Target, Users, Plus, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BountyManager() {
  const { address } = useAccount();
  const { bounties, isLoading, refetch } = useBounties();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [activeTab, setActiveTab] = useState<"browse" | "create" | "my-bounties">("browse");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPastBounties, setShowPastBounties] = useState(false);

  const filteredBounties = useMemo(() => {
    return bounties.filter(b => {
      const isPast = b.status === 3 || BigInt(Math.floor(Date.now() / 1000)) > b.deadline;
      if (statusFilter === "resolved") return b.status === 3;
      if (statusFilter === "expired") return BigInt(Math.floor(Date.now() / 1000)) > b.deadline;
      return !isPast;
    });
  }, [bounties, statusFilter]);

  const pastBounties = useMemo(() => {
    return bounties.filter(b => b.status === 3 || BigInt(Math.floor(Date.now() / 1000)) > b.deadline);
  }, [bounties]);

  const handleCreateBounty = async (formData: any) => {
    try {
      console.log("Creating bounty with form data:", formData);

      // Check wallet connection
      if (!address) {
        alert("Please connect your wallet first");
        return;
      }

      // Validate required fields
      if (!formData.title || !formData.description || !formData.amount || !formData.deadline) {
        alert("Please fill in all required fields");
        return;
      }

      const metadata: BountyMetadata = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements.filter((r: string) => r.trim()),
        deliverables: formData.deliverables.filter((d: string) => d.trim()),
        skills: formData.skills.filter((s: string) => s.trim()),
        images: formData.images || [],
        deadline: Math.floor(new Date(formData.deadline).getTime() / 1000),
        bountyType: formData.bountyType,
      };

      console.log("Uploading metadata to IPFS...");
      const metadataCid = await uploadMetadataToIpfs(metadata);
      console.log("Metadata CID:", metadataCid);

      const winnerSharesArg = formData.allowMultipleWinners ? formData.winnerShares.map((s: number) => BigInt(s * 100)) : [];
      const oprecDeadline = formData.hasOprec && formData.oprecDeadline ? Math.floor(new Date(formData.oprecDeadline).getTime() / 1000) : 0;

      console.log("Calling smart contract...");
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "createBounty",
        args: [
          `${formData.title}\n\nMetadata: ipfs://${metadataCid}`,
          BigInt(metadata.deadline),
          formData.allowMultipleWinners,
          winnerSharesArg,
          BigInt(formData.slashPercent * 100),
          formData.hasOprec,
          BigInt(oprecDeadline),
        ],
        value: parseETH(formData.amount),
      });
    } catch (e: any) {
      console.error("Error creating bounty:", e);
      alert(`Error creating bounty: ${e.message || e}`);
    }
  };

  // Action handlers
  const submitSolution = async (bountyId: number, ipfsCid: string) => {
    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty) return;
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "submitSolution",
      args: [BigInt(bountyId), ipfsCid, []],
      value: bounty.amount / 10n,
    });
  };

  const selectWinners = async (bountyId: number, winners: string[], subIds: number[]) => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "selectWinners",
      args: [BigInt(bountyId), winners, subIds.map(id => BigInt(id))],
    });
  };

  const triggerSlash = async (bountyId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "triggerSlash",
      args: [BigInt(bountyId)],
    });
  };

  const addReply = async (bountyId: number, subId: number, content: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "addReply",
      args: [BigInt(bountyId), BigInt(subId), content],
    });
  };

  const revealSolution = async (bountyId: number, subId: number, revealCid: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "revealSolution",
      args: [BigInt(bountyId), BigInt(subId), revealCid],
    });
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      console.log("Transaction confirmed!");
      refetch();
      if (activeTab === "create") {
        setActiveTab("browse");
      }
    }
  }, [isConfirmed, refetch, activeTab]);

  return (
    <div className="space-y-10">
      {/* Unified Header Section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 text-balance">Bounties</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium text-pretty">
          Secure, escrow-backed tasks for developers and creators.
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
          {[
            { id: "browse", label: "Browse", icon: LayoutGrid },
            { id: "my-bounties", label: "My Bounties", icon: Users },
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
              <BountyForm onSubmit={handleCreateBounty} isPending={isPending || isConfirming} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {activeTab === "browse" && (
                <BountyFilters
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  showPastBounties={showPastBounties}
                  setShowPastBounties={setShowPastBounties}
                />
              )}

              {isLoading ? (
                <BountyListSkeleton />
              ) : (() => {
                const displayBounties = activeTab === "browse"
                  ? filteredBounties
                  : bounties.filter(b => b.creator.toLowerCase() === address?.toLowerCase());

                console.log(`${activeTab} tab - Showing ${displayBounties.length} bounties`, { address, totalBounties: bounties.length });

                if (displayBounties.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center size-16 rounded-full bg-slate-100 mb-4">
                        <Target className="size-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 text-balance mb-2">
                        {activeTab === "my-bounties" ? "No bounties created yet" : "No bounties found"}
                      </h3>
                      <p className="text-slate-500 text-sm text-pretty mb-6">
                        {activeTab === "my-bounties"
                          ? "Create your first bounty to get started"
                          : "Try adjusting your filters"}
                      </p>
                      {activeTab === "my-bounties" && (
                        <Button onClick={() => setActiveTab("create")} className="bg-[#0EA885] hover:bg-[#0EA885]/90">
                          <Plus className="size-4 mr-2" />
                          Create Bounty
                        </Button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayBounties.map(b => (
                      <BountyCard
                        key={b.id}
                        bounty={b}
                        onSubmitSolution={submitSolution}
                        onSelectWinners={selectWinners}
                        onTriggerSlash={triggerSlash}
                        onAddReply={addReply}
                        onRevealSolution={revealSolution}
                      />
                    ))}
                  </div>
                );
              })()}

              {activeTab === "browse" && showPastBounties && pastBounties.length > 0 && (
                <div className="pt-12 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 mb-8 text-center uppercase">Past Bounties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60">
                    {pastBounties.map(b => (
                      <BountyCard
                        key={b.id}
                        bounty={b}
                        onSubmitSolution={submitSolution}
                        onSelectWinners={selectWinners}
                        onTriggerSlash={triggerSlash}
                        onAddReply={addReply}
                        onRevealSolution={revealSolution}
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
