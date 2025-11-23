"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  AIRDROP_ABI,
  GRANT_PROGRAM_ABI,
  LOOKING_FOR_GRANT_ABI,
  CROWDFUNDING_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "../../utils/web3";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ChevronRight,
  Target,
  Rocket,
  Coins,
  ExternalLink,
  Clock,
} from "lucide-react";

type DashboardSection = "all" | "bounties" | "airdrops" | "funding";

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  status: number;
  metadataCid?: string;
}

interface Airdrop {
  id: number;
  creator: string;
  title: string;
  amount: bigint;
  totalRecipients: bigint;
  deadline: bigint;
  resolved: boolean;
  cancelled: boolean;
}

interface FundingItem {
  id: number;
  creator: string;
  title: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  deadline: bigint;
  type: "looking-for-grant" | "grant-program" | "crowdfunding";
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>("all");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [fundingItems, setFundingItems] = useState<FundingItem[]>([]);

  // Read bounty counter
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
  });

  // Read airdrop counter
  const { data: airdropCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: "airdropCounter",
  });

  // Read grant counter
  const { data: grantCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram as `0x${string}`,
    abi: GRANT_PROGRAM_ABI,
    functionName: "grantCounter",
  });

  // Read looking for grant counter
  const { data: requestCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant as `0x${string}`,
    abi: LOOKING_FOR_GRANT_ABI,
    functionName: "requestCounter",
  });

  // Read crowdfunding counter
  const { data: campaignCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding as `0x${string}`,
    abi: CROWDFUNDING_ABI,
    functionName: "campaignCounter",
  });

  // Load bounties (matching BountyManager logic)
  useEffect(() => {
    const loadBounties = async () => {
      if (!bountyCounter) return;
      const count = Number(bountyCounter);
      const loadedBounties: Bounty[] = [];

      // Start from 1, not 0
      for (let i = 1; i <= count; i++) {
        try {
          // Use getBountyData like BountyManager
          const bountyData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(i)],
          });

          if (bountyData) {
            const bountyArray = bountyData as any[];
            const [
              creator,
              description,
              amount,
              deadline,
              allowMultipleWinners,
              winnerShares,
              status,
              slashPercent,
              selectedWinners,
              selectedSubmissionIds,
              hasOprec,
              oprecDeadline,
            ] = bountyArray;

            const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
            const metadataCid = metadataMatch ? metadataMatch[1] : undefined;

            loadedBounties.push({
              id: i,
              creator,
              description,
              amount,
              deadline,
              status,
              metadataCid,
            });
          }
        } catch (err) {
          console.error(`Error loading bounty ${i}:`, err);
        }
      }
      setBounties(loadedBounties);
    };
    loadBounties();
  }, [bountyCounter]);

  // Load airdrops
  useEffect(() => {
    const loadAirdrops = async () => {
      if (!airdropCounter) return;
      const count = Number(airdropCounter);
      const loadedAirdrops: Airdrop[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const airdropData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
            abi: AIRDROP_ABI,
            functionName: "getAirdrop",
            args: [BigInt(i)],
          });

          if (airdropData) {
            const [creator, title, description, totalAmount, perQualifier, maxQualifiers, qualifiersCount, deadline, createdAt, resolved, cancelled] = airdropData as any;
            loadedAirdrops.push({
              id: i,
              creator,
              title,
              amount: totalAmount,
              totalRecipients: qualifiersCount,
              deadline: BigInt(deadline),
              resolved,
              cancelled,
            });
          }
        } catch (err) {
          console.error(`Error loading airdrop ${i}:`, err);
        }
      }
      setAirdrops(loadedAirdrops);
    };
    loadAirdrops();
  }, [airdropCounter]);

  // Load funding items (grants, requests, campaigns)
  useEffect(() => {
    const loadFunding = async () => {
      const items: FundingItem[] = [];

      // Load grant programs
      if (grantCounter) {
        const count = Number(grantCounter);
        for (let i = 1; i <= count; i++) {
          try {
            const info = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram as `0x${string}`,
              abi: GRANT_PROGRAM_ABI,
              functionName: "getGrantInfo",
              args: [BigInt(i)],
            });
            const [giver, title, , totalFunds, , , , , , createdAt] = info as any;
            items.push({
              id: i,
              creator: giver,
              title,
              fundingGoal: totalFunds,
              totalRaised: totalFunds,
              deadline: BigInt(createdAt),
              type: "grant-program",
            });
          } catch (err) {
            console.error(`Error loading grant ${i}:`, err);
          }
        }
      }

      // Load looking for grant requests
      if (requestCounter) {
        const count = Number(requestCounter);
        for (let i = 1; i <= count; i++) {
          try {
            const info = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant as `0x${string}`,
              abi: LOOKING_FOR_GRANT_ABI,
              functionName: "getRequestInfo",
              args: [BigInt(i)],
            });
            const [requester, title, , , , , fundingGoal, totalRaised, createdAt, deadline] = info as any;
            items.push({
              id: i,
              creator: requester,
              title,
              fundingGoal,
              totalRaised,
              deadline: BigInt(deadline),
              type: "looking-for-grant",
            });
          } catch (err) {
            console.error(`Error loading request ${i}:`, err);
          }
        }
      }

      // Load crowdfunding campaigns
      if (campaignCounter) {
        const count = Number(campaignCounter);
        for (let i = 1; i <= count; i++) {
          try {
            const info = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding as `0x${string}`,
              abi: CROWDFUNDING_ABI,
              functionName: "getCampaignInfo",
              args: [BigInt(i)],
            });
            const [creator, title, , , fundingGoal, totalRaised, deadline, createdAt] = info as any;
            items.push({
              id: i,
              creator,
              title,
              fundingGoal,
              totalRaised,
              deadline: BigInt(deadline),
              type: "crowdfunding",
            });
          } catch (err) {
            console.error(`Error loading campaign ${i}:`, err);
          }
        }
      }

      setFundingItems(items);
    };
    loadFunding();
  }, [grantCounter, requestCounter, campaignCounter]);

  const sections = [
    { id: "all" as const, label: "All", icon: Target },
    { id: "bounties" as const, label: "Bounties", icon: Target },
    { id: "airdrops" as const, label: "Airdrops", icon: Coins },
    { id: "funding" as const, label: "Funding", icon: Rocket },
  ];

  const getStatusBadge = (status: number) => {
    const statuses = ["OPREC", "OPEN", "REVEAL", "RESOLVED", "DISPUTED", "EXPIRED"];
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-gray-500", "bg-red-500", "bg-gray-400"];
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white text-xs`}>
        {statuses[status] || "UNKNOWN"}
      </Badge>
    );
  };

  const getFundingTypeBadge = (type: string) => {
    const types = {
      "looking-for-grant": { label: "LFG", color: "bg-blue-500" },
      "grant-program": { label: "Grant", color: "bg-green-500" },
      "crowdfunding": { label: "Crowd", color: "bg-pink-500" },
    };
    const config = types[type as keyof typeof types] || { label: type, color: "bg-gray-500" };
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const formatDeadline = (deadline: bigint | number) => {
    const date = new Date(Number(deadline) * 1000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "Ended";
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-sm">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => router.push("/")}
                    className="cursor-pointer hover:text-[#0EA885] transition-all text-xs sm:text-sm font-medium"
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3 text-foreground/40" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs sm:text-sm font-semibold text-[#0EA885]">
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="flex gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <Button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-1.5 text-xs transition-all ${
                    isActive ? "bg-[#0EA885] hover:bg-[#0EA885]/90" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-4">
          {/* Bounties */}
          {(activeSection === "all" || activeSection === "bounties") && bounties.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                Bounties
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {bounties.slice(0, activeSection === "all" ? 4 : undefined).map((bounty) => (
                  <div
                    key={bounty.id}
                    onClick={() => router.push(`/bounties/${bounty.id}`)}
                    className="group cursor-pointer rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          Bounty #{bounty.id}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {bounty.description.split('\n')[0]}
                        </p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(bounty.status)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDeadline(bounty.deadline)}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#0EA885]">
                        {(Number(bounty.amount) / 1e18).toFixed(2)} ETH
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {activeSection === "all" && bounties.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("bounties")}
                  className="w-full mt-2 text-xs"
                >
                  View all {bounties.length} bounties
                </Button>
              )}
            </div>
          )}

          {/* Airdrops */}
          {(activeSection === "all" || activeSection === "airdrops") && airdrops.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                Airdrops
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {airdrops
                  .filter((a) => !a.resolved && !a.cancelled)
                  .slice(0, activeSection === "all" ? 4 : undefined)
                  .map((airdrop) => (
                    <div
                      key={airdrop.id}
                      onClick={() => router.push(`/airdrops/${airdrop.id}`)}
                      className="group cursor-pointer rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {airdrop.title || `Airdrop #${airdrop.id}`}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Number(airdrop.totalRecipients)} recipients
                          </p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDeadline(airdrop.deadline)}
                        </div>
                        <div className="text-sm font-bold text-[#0EA885]">
                          {(Number(airdrop.amount) / 1e18).toFixed(2)} ETH
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {activeSection === "all" && airdrops.filter((a) => !a.resolved && !a.cancelled).length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("airdrops")}
                  className="w-full mt-2 text-xs"
                >
                  View all {airdrops.filter((a) => !a.resolved && !a.cancelled).length} airdrops
                </Button>
              )}
            </div>
          )}

          {/* Funding */}
          {(activeSection === "all" || activeSection === "funding") && fundingItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-500" />
                Funding
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {fundingItems.slice(0, activeSection === "all" ? 4 : undefined).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => router.push(`/funding/${item.type}/${item.id}`)}
                    className="group cursor-pointer rounded-xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {item.title}
                        </h3>
                        <div className="mt-1">
                          {getFundingTypeBadge(item.type)}
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDeadline(item.deadline)}
                      </div>
                      <div className="text-sm font-bold text-[#0EA885]">
                        {(Number(item.fundingGoal) / 1e18).toFixed(2)} ETH
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {activeSection === "all" && fundingItems.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("funding")}
                  className="w-full mt-2 text-xs"
                >
                  View all {fundingItems.length} funding opportunities
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
