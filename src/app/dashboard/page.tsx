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
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Target,
  Rocket,
  Coins,
  Zap,
  ArrowUpRight,
  LayoutGrid,
  Clock,
  Users,
  ChevronRight,
  TrendingUp,
  Wallet
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";
import {
  fetchMetadataFromIpfs,
  BountyMetadata,
} from "../../utils/ipfs";
import {
  getEthPriceInUSD,
  convertEthToUSD,
  formatUSD,
} from "../../utils/prices";

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

// Enhanced Stat Card Component
const StatCard = ({ title, value, trend, label, icon: Icon, color }: { title: string, value: string, trend?: string, label?: string, icon: any, color: string }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-lg ${color.split(' ')[0]} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
      </div>
      {trend && (
        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-0 font-medium text-[10px] px-2">
          <TrendingUp className="w-3 h-3 mr-1" /> {trend}
        </Badge>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-gray-500">{title}</p>
    </div>
    {label && (
       <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400 flex items-center">
         {label}
       </div>
    )}
  </div>
);

const ITEMS_PER_PAGE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>("all");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [fundingItems, setFundingItems] = useState<FundingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bountyMetadata, setBountyMetadata] = useState<Map<number, BountyMetadata>>(new Map());

  // Pagination state
  const [bountyPage, setBountyPage] = useState(1);
  const [airdropPage, setAirdropPage] = useState(1);
  const [fundingPage, setFundingPage] = useState(1);
  const [loadingBounties, setLoadingBounties] = useState(false);
  const [loadingAirdrops, setLoadingAirdrops] = useState(false);
  const [loadingFunding, setLoadingFunding] = useState(false);

  // ETH price state
  const [ethPrice, setEthPrice] = useState<number>(0);

  // Fetch ETH price on mount and refresh every minute
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPriceInUSD();
      setEthPrice(price);
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Read bounty counter
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
  });

  // Read airdrop counter
  const { data: airdropCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.AirdropBounty as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: "airdropCounter",
  });

  // Read grant counter
  const { data: grantCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.GrantProgram as `0x${string}`,
    abi: GRANT_PROGRAM_ABI,
    functionName: "grantCounter",
  });

  // Read looking for grant counter
  const { data: requestCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.LookingForGrant as `0x${string}`,
    abi: LOOKING_FOR_GRANT_ABI,
    functionName: "requestCounter",
  });

  // Read crowdfunding counter
  const { data: campaignCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.Crowdfunding as `0x${string}`,
    abi: CROWDFUNDING_ABI,
    functionName: "campaignCounter",
  });

  // Load bounties with pagination
  useEffect(() => {
    let isMounted = true;
    const loadBounties = async () => {
      if (!bountyCounter || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      setLoadingBounties(true);
      const count = Number(bountyCounter);

      // Calculate range for current page (load from newest to oldest)
      const startIndex = Math.max(1, count - (bountyPage * ITEMS_PER_PAGE) + 1);
      const endIndex = Math.min(count, count - ((bountyPage - 1) * ITEMS_PER_PAGE));

      const loadedBounties: Bounty[] = [];

      // Load bounties in reverse order (newest first)
      for (let i = endIndex; i >= startIndex; i--) {
        try {
          const bountyData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(i)],
          });

          if (bountyData && Array.isArray(bountyData)) {
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
            ] = bountyData as any[];

            let metadataCid;
            if (description && typeof description === 'string') {
               const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);
               metadataCid = metadataMatch ? metadataMatch[1] : undefined;
            }

            loadedBounties.push({
              id: i,
              creator,
              description: description || "",
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

      if (isMounted) {
        setBounties(loadedBounties);
        setLoadingBounties(false);
        setLoading(false);
      }
    };
    loadBounties();
    return () => { isMounted = false; };
  }, [bountyCounter, bountyPage]);

  // Load metadata for bounties
  useEffect(() => {
    const loadMetadata = async () => {
      const newMetadata = new Map<number, BountyMetadata>();

      for (const bounty of bounties) {
        if (bounty.metadataCid && !bountyMetadata.has(bounty.id)) {
          try {
            const meta = await fetchMetadataFromIpfs(bounty.metadataCid);
            newMetadata.set(bounty.id, meta);
          } catch (error) {
            console.error(`Failed to load metadata for bounty ${bounty.id}:`, error);
          }
        }
      }

      if (newMetadata.size > 0) {
        setBountyMetadata(prev => new Map([...prev, ...newMetadata]));
      }
    };

    if (bounties.length > 0) {
      loadMetadata();
    }
  }, [bounties]);

  // Load airdrops with pagination
  useEffect(() => {
    let isMounted = true;
    const loadAirdrops = async () => {
      if (!airdropCounter || !CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      setLoadingAirdrops(true);
      const count = Number(airdropCounter);

      // Calculate range for current page (load from newest to oldest)
      const startIndex = Math.max(1, count - (airdropPage * ITEMS_PER_PAGE) + 1);
      const endIndex = Math.min(count, count - ((airdropPage - 1) * ITEMS_PER_PAGE));

      const loadedAirdrops: Airdrop[] = [];

      // Load airdrops in reverse order (newest first)
      for (let i = endIndex; i >= startIndex; i--) {
        try {
          const airdropData = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
            abi: AIRDROP_ABI,
            functionName: "getAirdrop",
            args: [BigInt(i)],
          });

          if (airdropData && Array.isArray(airdropData)) {
            const [creator, title, description, totalAmount, perQualifier, maxQualifiers, qualifiersCount, deadline, createdAt, resolved, cancelled] = airdropData as any[];
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

      if (isMounted) {
        setAirdrops(loadedAirdrops);
        setLoadingAirdrops(false);
      }
    };
    loadAirdrops();
    return () => { isMounted = false; };
  }, [airdropCounter, airdropPage]);

  // Load funding items (loads all, pagination happens in display)
  useEffect(() => {
    let isMounted = true;
    const loadFunding = async () => {
      if (!CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]) return;

      setLoadingFunding(true);
      const items: FundingItem[] = [];

      try {
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
              if (info && Array.isArray(info)) {
                 const [giver, title, , totalFunds, , , , , , createdAt] = info as any[];
                 items.push({
                   id: i,
                   creator: giver,
                   title,
                   fundingGoal: totalFunds,
                   totalRaised: totalFunds,
                   deadline: BigInt(createdAt),
                   type: "grant-program",
                 });
              }
            } catch (err) {
              console.error(`Error loading grant ${i}:`, err);
            }
          }
        }

        // Load requests
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
              if (info && Array.isArray(info)) {
                 const [requester, title, , , , , fundingGoal, totalRaised, createdAt, deadline] = info as any[];
                 items.push({
                   id: i,
                   creator: requester,
                   title,
                   fundingGoal,
                   totalRaised,
                   deadline: BigInt(deadline),
                   type: "looking-for-grant",
                 });
              }
            } catch (err) {
              console.error(`Error loading request ${i}:`, err);
            }
          }
        }

        // Load crowdfunding
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
              if (info && Array.isArray(info)) {
                 const [creator, title, , , fundingGoal, totalRaised, deadline, createdAt] = info as any[];
                 items.push({
                   id: i,
                   creator,
                   title,
                   fundingGoal,
                   totalRaised,
                   deadline: BigInt(deadline),
                   type: "crowdfunding",
                 });
              }
            } catch (err) {
              console.error(`Error loading campaign ${i}:`, err);
            }
          }
        }
      } catch (e) {
         console.error("Error loading funding items", e);
      }

      if (isMounted) {
        setFundingItems(items.reverse());
        setLoadingFunding(false);
      }
    };
    loadFunding();
    return () => { isMounted = false; };
  }, [grantCounter, requestCounter, campaignCounter]);

  const sections = [
    { id: "all" as const, label: "Overview", icon: LayoutGrid },
    { id: "bounties" as const, label: "Bounties", icon: Target },
    { id: "airdrops" as const, label: "Airdrops", icon: Zap },
    { id: "funding" as const, label: "Funding", icon: Rocket },
  ];

  const getStatusBadge = (status: number) => {
    const statuses = ["OPREC", "OPEN", "REVEAL", "RESOLVED", "DISPUTED", "EXPIRED"];
    const styles = [
      "bg-blue-100 text-blue-700 border-blue-200", // OPREC
      "bg-green-100 text-green-700 border-green-200", // OPEN
      "bg-yellow-100 text-yellow-700 border-yellow-200", // REVEAL
      "bg-gray-100 text-gray-700 border-gray-200", // RESOLVED
      "bg-red-100 text-red-700 border-red-200", // DISPUTED
      "bg-gray-100 text-gray-500 border-gray-200" // EXPIRED
    ];
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles[5]}`}>
        {statuses[status] || "UNKNOWN"}
      </span>
    );
  };

  const getFundingTypeBadge = (type: string) => {
    const types = {
      "looking-for-grant": { label: "Grant Request", style: "bg-indigo-100 text-indigo-700 border-indigo-200" },
      "grant-program": { label: "Grant Program", style: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      "crowdfunding": { label: "Crowdfunding", style: "bg-pink-100 text-pink-700 border-pink-200" },
    };
    const config = types[type as keyof typeof types] || { label: type, style: "bg-gray-100 text-gray-600" };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${config.style}`}>
        {config.label}
      </span>
    );
  };

  const formatDeadline = (deadline: bigint | number) => {
    try {
        const date = new Date(Number(deadline) * 1000);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diff < 0) return "Ended";
        if (days > 0) return `${days}d left`;
        return `${hours}h left`;
    } catch (e) {
        return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Welcome back. Here's what's happening on Quinty.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full px-5">
               <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
            </Button>
            <Button onClick={() => router.push("/bounties")} className="bg-[#0EA885] hover:bg-[#0b8a6c] text-white rounded-full px-6 shadow-lg shadow-[#0EA885]/20 transition-all hover:scale-105">
              + Create New
            </Button>
          </div>
        </div>

        {/* Stats Overview - Improved compact cards with more info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
           <StatCard 
              title="Active Bounties" 
              value={bountyCounter ? bountyCounter.toString() : "0"} 
              trend="+12%" 
              label="Volume: 2.4 ETH"
              icon={Target} 
              color="bg-blue-500 text-blue-600" 
            />
           <StatCard 
              title="Grants Distributed" 
              value={grantCounter ? grantCounter.toString() : "0"} 
              trend="+5%" 
              label="Active Programs: 4"
              icon={Rocket} 
              color="bg-emerald-500 text-emerald-600" 
            />
           <StatCard 
              title="Airdrop Campaigns" 
              value={airdropCounter ? airdropCounter.toString() : "0"} 
              trend="+8%" 
              label="Claimed: 450"
              icon={Zap} 
              color="bg-yellow-500 text-yellow-600" 
            />
           <StatCard 
              title="Crowdfunding" 
              value={campaignCounter ? campaignCounter.toString() : "0"} 
              trend="+24%" 
              label="Raised: 15.2 ETH"
              icon={Users} 
              color="bg-purple-500 text-purple-600" 
            />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto pb-1 no-scrollbar">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                    isActive 
                      ? "border-[#0EA885] text-[#0EA885]" 
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#0EA885]" : "text-gray-400"}`} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-12">
          
          {/* Bounties Section */}
          {(activeSection === "all" || activeSection === "bounties") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Latest Bounties
                </h2>
                {activeSection === "all" && (
                  <Button variant="ghost" className="text-sm text-gray-500 hover:text-[#0EA885] hover:bg-transparent p-0 h-auto font-normal" onClick={() => setActiveSection("bounties")}>
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
              
              {loadingBounties ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA885]"></div>
                </div>
              ) : bounties.length > 0 ? (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {bounties.slice(0, activeSection === "all" ? 4 : undefined).map((bounty) => {
                    const metadata = bountyMetadata.get(bounty.id);
                    const title = metadata?.title || bounty.description.split("\n")[0] || "Untitled Bounty Task";

                    return (
                    <div
                      key={bounty.id}
                      onClick={() => router.push(`/bounties/${bounty.id}`)}
                      className="group cursor-pointer rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      {/* Image Section - with placeholder if no image */}
                      <div className="relative w-full h-32 overflow-hidden">
                        {metadata?.images && metadata.images.length > 0 ? (
                          <img
                            src={`https://ipfs.io/ipfs/${metadata.images[0]}`}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                            <div className="text-center">
                              <Target className="h-10 w-10 text-blue-300 mx-auto mb-1.5" />
                              <p className="text-[10px] text-blue-400 font-medium">Bounty #{bounty.id}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                             <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                #{bounty.id}
                             </div>
                             <span className="text-[10px] text-gray-400 font-medium">Bounty</span>
                          </div>
                          {getStatusBadge(bounty.status)}
                        </div>

                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-[#0EA885] transition-colors">
                          {title}
                        </h3>
                        <p className="text-[10px] text-gray-400 mb-3 truncate">
                           Creator: {bounty.creator.substring(0, 6)}...{bounty.creator.substring(38)}
                        </p>

                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-500 text-[10px] bg-gray-50 px-1.5 py-1 rounded-md">
                            <Clock className="h-3 w-3" />
                            {formatDeadline(bounty.deadline)}
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-900">
                              {(Number(bounty.amount) / 1e18).toFixed(3)} <span className="text-[10px] font-medium text-gray-500">ETH</span>
                            </div>
                            {ethPrice > 0 && (
                              <div className="text-[10px] text-gray-400">
                                {formatUSD(convertEthToUSD(Number(bounty.amount) / 1e18, ethPrice))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>

                {/* Pagination Controls for Bounties (only show when not in "all" view) */}
                {activeSection === "bounties" && bountyCounter && Number(bountyCounter) > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBountyPage(p => Math.max(1, p - 1))}
                      disabled={bountyPage === 1}
                      className="rounded-full"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {bountyPage} of {Math.ceil(Number(bountyCounter) / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBountyPage(p => p + 1)}
                      disabled={bountyPage >= Math.ceil(Number(bountyCounter) / ITEMS_PER_PAGE)}
                      className="rounded-full"
                    >
                      Next
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                  <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No active bounties found.</p>
                  <p className="text-xs text-gray-400 mt-1">Check back later or create one yourself.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Airdrops Section */}
          {(activeSection === "all" || activeSection === "airdrops") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Active Airdrops
                </h2>
                {activeSection === "all" && (
                  <Button variant="ghost" className="text-sm text-gray-500 hover:text-[#0EA885] hover:bg-transparent p-0 h-auto font-normal" onClick={() => setActiveSection("airdrops")}>
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {loadingAirdrops ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                </div>
              ) : airdrops.length > 0 ? (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {airdrops
                    .filter((a) => !a.resolved && !a.cancelled)
                    .slice(0, activeSection === "all" ? 4 : undefined)
                    .map((airdrop) => (
                      <div
                        key={airdrop.id}
                        onClick={() => router.push(`/airdrops/${airdrop.id}`)}
                        className="group cursor-pointer rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        {/* Placeholder Image for Airdrops */}
                        <div className="relative w-full h-32 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center">
                            <div className="text-center">
                              <Zap className="h-10 w-10 text-yellow-300 mx-auto mb-1.5" />
                              <p className="text-[10px] text-yellow-400 font-medium">Airdrop #{airdrop.id}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3">
                           <div className="flex items-start justify-between mb-2">
                              <div className="h-6 w-6 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100">
                                 <Zap className="h-3.5 w-3.5" />
                              </div>
                              <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-0 font-normal text-[10px]">
                                 {Number(airdrop.totalRecipients)} spots
                              </Badge>
                           </div>

                           <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate group-hover:text-yellow-600 transition-colors">
                              {airdrop.title || `Airdrop #${airdrop.id}`}
                           </h3>
                           <p className="text-[10px] text-gray-400 mb-3 truncate">
                              Creator: {airdrop.creator.substring(0, 6)}...{airdrop.creator.substring(38)}
                           </p>

                           <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                                 <Clock className="h-3 w-3" />
                                 {formatDeadline(airdrop.deadline)}
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">
                                   {(Number(airdrop.amount) / 1e18).toFixed(2)} <span className="text-[10px] font-medium text-gray-500">ETH</span>
                                </div>
                                {ethPrice > 0 && (
                                  <div className="text-[10px] text-gray-400">
                                    {formatUSD(convertEthToUSD(Number(airdrop.amount) / 1e18, ethPrice))}
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination Controls for Airdrops */}
                {activeSection === "airdrops" && airdropCounter && Number(airdropCounter) > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAirdropPage(p => Math.max(1, p - 1))}
                      disabled={airdropPage === 1}
                      className="rounded-full"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {airdropPage} of {Math.ceil(Number(airdropCounter) / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAirdropPage(p => p + 1)}
                      disabled={airdropPage >= Math.ceil(Number(airdropCounter) / ITEMS_PER_PAGE)}
                      className="rounded-full"
                    >
                      Next
                    </Button>
                  </div>
                )}
                </>
               ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                  <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No active airdrops.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Funding Section */}
          {(activeSection === "all" || activeSection === "funding") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-purple-500" />
                  Funding Opportunities
                </h2>
                {activeSection === "all" && (
                  <Button variant="ghost" className="text-sm text-gray-500 hover:text-[#0EA885] hover:bg-transparent p-0 h-auto font-normal" onClick={() => setActiveSection("funding")}>
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {loadingFunding ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : fundingItems.length > 0 ? (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {fundingItems
                    .slice(
                      activeSection === "all" ? 0 : (fundingPage - 1) * ITEMS_PER_PAGE,
                      activeSection === "all" ? 4 : fundingPage * ITEMS_PER_PAGE
                    )
                    .map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => router.push(`/funding/${item.type}/${item.id}`)}
                      className="group cursor-pointer rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      <div className="p-3">
                         <div className="flex items-start justify-between mb-2">
                            {getFundingTypeBadge(item.type)}
                            <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#0EA885] transition-colors" />
                         </div>

                         <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate group-hover:text-purple-600 transition-colors">
                           {item.title}
                         </h3>
                         <p className="text-[10px] text-gray-400 mb-2 truncate">
                           Creator: {item.creator.substring(0, 6)}...{item.creator.substring(38)}
                         </p>

                         <div className="space-y-1 mb-3">
                           <div className="flex justify-between text-[10px] font-medium text-gray-500">
                              <span>Progress</span>
                              <span>{Math.min(Math.round((Number(item.totalRaised) / Number(item.fundingGoal)) * 100), 100)}%</span>
                           </div>
                           <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                             <div
                                className="bg-[#0EA885] h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((Number(item.totalRaised) / Number(item.fundingGoal)) * 100, 100)}%` }}
                             />
                           </div>
                         </div>

                         <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                           <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                             <Clock className="h-3 w-3" />
                             {formatDeadline(item.deadline)}
                           </div>
                           <div className="text-right">
                             <div className="text-xs font-bold text-[#0EA885]">
                               {(Number(item.fundingGoal) / 1e18).toFixed(2)} ETH
                             </div>
                             {ethPrice > 0 && (
                               <div className="text-[10px] text-gray-400">
                                 {formatUSD(convertEthToUSD(Number(item.fundingGoal) / 1e18, ethPrice))}
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls for Funding */}
                {activeSection === "funding" && fundingItems.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFundingPage(p => Math.max(1, p - 1))}
                      disabled={fundingPage === 1}
                      className="rounded-full"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {fundingPage} of {Math.ceil(fundingItems.length / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFundingPage(p => p + 1)}
                      disabled={fundingPage >= Math.ceil(fundingItems.length / ITEMS_PER_PAGE)}
                      className="rounded-full"
                    >
                      Next
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                  <Rocket className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No funding items available.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}