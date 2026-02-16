import React, { useState, useMemo, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, QUINTY_ABI, BASE_SEPOLIA_CHAIN_ID, BountyStatus } from "../utils/contracts";
import { parseETH, wagmiConfig } from "../utils/web3";
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
      const now = BigInt(Math.floor(Date.now() / 1000));
      // Active: OPEN or JUDGING phase
      const isActive = b.status === BountyStatus.OPEN || b.status === BountyStatus.JUDGING;
      // Past: RESOLVED or SLASHED
      const isPast = b.status === BountyStatus.RESOLVED || b.status === BountyStatus.SLASHED;
      
      if (statusFilter === "resolved") return b.status === BountyStatus.RESOLVED;
      if (statusFilter === "slashed") return b.status === BountyStatus.SLASHED;
      if (statusFilter === "judging") return b.status === BountyStatus.JUDGING || (b.status === BountyStatus.OPEN && now > b.openDeadline);
      return isActive;
    });
  }, [bounties, statusFilter]);

  const pastBounties = useMemo(() => {
    return bounties.filter(b => b.status === BountyStatus.RESOLVED || b.status === BountyStatus.SLASHED);
  }, [bounties]);

  const handleCreateBounty = async (formData: any) => {
    try {
      console.log("Creating bounty with form data:", formData);

      if (!address) {
        alert("Please connect your wallet first");
        return;
      }

      const missingFields = [];
      if (!formData.title) missingFields.push("Title");
      if (!formData.description) missingFields.push("Description");
      if (!formData.amount) missingFields.push("Amount");
      if (!formData.openDeadline) missingFields.push("Submission Deadline");
      if (!formData.judgingDeadline) missingFields.push("Judging Deadline");

      if (missingFields.length > 0) {
        alert(`Please fill in: ${missingFields.join(", ")}`);
        return;
      }

      const openDeadlineTs = Math.floor(new Date(formData.openDeadline).getTime() / 1000);
      const judgingDeadlineTs = Math.floor(new Date(formData.judgingDeadline).getTime() / 1000);

      const metadata: BountyMetadata = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements.filter((r: string) => r.trim()),
        deliverables: formData.deliverables.filter((d: string) => d.trim()),
        skills: formData.skills.filter((s: string) => s.trim()),
        images: formData.images || [],
        deadline: judgingDeadlineTs, // Use judging deadline as primary deadline for metadata
        bountyType: formData.bountyType,
      };

      console.log("Uploading metadata to IPFS...");
      const metadataCid = await uploadMetadataToIpfs(metadata);
      console.log("Metadata CID:", metadataCid);

      console.log("Calling smart contract with new params...");
      console.log("openDeadline:", openDeadlineTs, "judgingDeadline:", judgingDeadlineTs, "slashPercent:", formData.slashPercent);
      
      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "createBounty",
        args: [
          formData.title,
          `${formData.description}\n\nMetadata: ipfs://${metadataCid}`,
          BigInt(openDeadlineTs),
          BigInt(judgingDeadlineTs),
          BigInt(formData.slashPercent), // Already in basis points from form
        ],
        value: parseETH(formData.amount),
      });
    } catch (e: any) {
      console.error("Error creating bounty:", e);
      alert(`Error creating bounty: ${e.message || e}`);
    }
  };

  // Action handlers
  const submitToBounty = async (bountyId: number, ipfsCid: string, socialHandle: string) => {
    try {
      // Get required deposit amount (1% of bounty)
      const depositAmount = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getRequiredDeposit",
        args: [BigInt(bountyId)],
      }) as bigint;

      console.log("Submitting with deposit:", depositAmount.toString());

      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "submitToBounty",
        args: [BigInt(bountyId), ipfsCid, socialHandle],
        value: depositAmount,
      });
    } catch (e: any) {
      console.error("Error submitting to bounty:", e);
      alert(`Error: ${e.message || e}`);
    }
  };

  const selectWinner = async (bountyId: number, submissionId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "selectWinner",
      args: [BigInt(bountyId), BigInt(submissionId)],
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

  const refundNoSubmissions = async (bountyId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
      abi: QUINTY_ABI,
      functionName: "refundNoSubmissions",
      args: [BigInt(bountyId)],
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
          Secure, escrow-backed tasks with instant winner payouts.
        </p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200">
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
                      <div className="inline-flex items-center justify-center size-16 bg-slate-100 mb-4">
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
                        onSubmitToBounty={submitToBounty}
                        onSelectWinner={selectWinner}
                        onTriggerSlash={triggerSlash}
                        onRefundNoSubmissions={refundNoSubmissions}
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
                        onSubmitToBounty={submitToBounty}
                        onSelectWinner={selectWinner}
                        onTriggerSlash={triggerSlash}
                        onRefundNoSubmissions={refundNoSubmissions}
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
