"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  GRANT_PROGRAM_ABI,
  CROWDFUNDING_ABI,
  LOOKING_FOR_GRANT_ABI,
  AIRDROP_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { formatETH, formatAddress, wagmiConfig } from "../../utils/web3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Gift,
  TrendingUp,
  Users,
  Coins,
  Calendar,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Loader2,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "bounty_created" | "bounty_submitted" | "bounty_won" | "bounty_revealed" | "bounty_replied" | "grant_created" | "grant_applied" | "grant_received" | "crowdfunding_created" | "crowdfunding_contributed" | "lfg_created" | "lfg_supported" | "airdrop_created" | "airdrop_submitted";
  contractType: "Quinty" | "GrantProgram" | "Crowdfunding" | "LookingForGrant" | "Airdrop";
  itemId: number;
  amount?: bigint;
  timestamp: bigint;
  status: string;
  description: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (address) {
      loadTransactionHistory();
    }
  }, [address]);

  const loadTransactionHistory = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const allTransactions: Transaction[] = [];

      console.log("Loading transaction history for address:", address);

      // Load Bounty transactions
      try {
        console.log("Loading bounties...");
        const bountyCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "bountyCounter",
        });
        console.log("Bounty counter:", bountyCounter);
        const bountyCount = Number(bountyCounter);

        for (let i = 1; i <= bountyCount; i++) {
          try {
            const bountyData = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getBountyData",
              args: [BigInt(i)],
            });

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
            ] = bountyData as any;

            // Check if user created this bounty
            if (creator.toLowerCase() === address.toLowerCase()) {
              console.log(`User created bounty ${i}`);
              allTransactions.push({
                id: `bounty-created-${i}`,
                type: "bounty_created",
                contractType: "Quinty",
                itemId: i,
                amount: amount,
                timestamp: deadline,
                status: status === 3 ? "Resolved" : status === 1 ? "Open" : status === 0 ? "OPREC" : status === 2 ? "Pending Reveal" : "Active",
                description: description.split("\n")[0] || `Bounty #${i}`,
              });
            }

            // Get submissions
            const submissionCount = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getSubmissionCount",
              args: [BigInt(i)],
            });

            for (let subIdx = 0; subIdx < Number(submissionCount); subIdx++) {
              try {
                const submissionData = await readContract(wagmiConfig, {
                  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                  abi: QUINTY_ABI,
                  functionName: "getSubmissionStruct",
                  args: [BigInt(i), BigInt(subIdx)],
                });

                const sub = submissionData as any;

                // Check if user submitted to this bounty
                if (sub.solver.toLowerCase() === address.toLowerCase()) {
                  allTransactions.push({
                    id: `bounty-submitted-${i}-${subIdx}`,
                    type: "bounty_submitted",
                    contractType: "Quinty",
                    itemId: i,
                    amount: sub.deposit,
                    timestamp: sub.submittedAt || deadline,
                    status: sub.revealed ? "Revealed" : "Submitted",
                    description: description.split("\n")[0] || `Bounty #${i}`,
                  });

                  // Add won transaction if user is selected as winner
                  if (sub.selected) {
                    allTransactions.push({
                      id: `bounty-won-${i}-${subIdx}`,
                      type: "bounty_won",
                      contractType: "Quinty",
                      itemId: i,
                      amount: amount,
                      timestamp: sub.submittedAt || deadline,
                      status: "Won",
                      description: description.split("\n")[0] || `Bounty #${i}`,
                    });
                  }

                  // Add revealed transaction if solution was revealed
                  if (sub.revealed) {
                    allTransactions.push({
                      id: `bounty-revealed-${i}-${subIdx}`,
                      type: "bounty_revealed",
                      contractType: "Quinty",
                      itemId: i,
                      timestamp: sub.revealedAt || sub.submittedAt || deadline,
                      status: "Revealed",
                      description: description.split("\n")[0] || `Bounty #${i}`,
                    });
                  }
                }

                // Check for replies by user on any submission
                if (sub.replies && Array.isArray(sub.replies)) {
                  for (let replyIdx = 0; replyIdx < sub.replies.length; replyIdx++) {
                    const reply = sub.replies[replyIdx];
                    if (reply.replier.toLowerCase() === address.toLowerCase()) {
                      allTransactions.push({
                        id: `bounty-replied-${i}-${subIdx}-${replyIdx}`,
                        type: "bounty_replied",
                        contractType: "Quinty",
                        itemId: i,
                        timestamp: reply.timestamp || deadline,
                        status: "Replied",
                        description: description.split("\n")[0] || `Bounty #${i}`,
                      });
                    }
                  }
                }
              } catch (subError) {
                console.error(`Error loading submission ${subIdx} for bounty ${i}:`, subError);
              }
            }
          } catch (bountyError) {
            console.error(`Error loading bounty ${i}:`, bountyError);
          }
        }
      } catch (error) {
        console.error("Error loading bounty transactions:", error);
      }

      // Load Grant Program transactions
      try {
        console.log("Loading grants...");
        const grantCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram as `0x${string}`,
          abi: GRANT_PROGRAM_ABI,
          functionName: "grantCounter",
        });
        console.log("Grant counter:", grantCounter);
        const grantCount = Number(grantCounter);

        for (let i = 1; i <= grantCount; i++) {
          try {
            const grant = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram as `0x${string}`,
              abi: GRANT_PROGRAM_ABI,
              functionName: "getGrantInfo",
              args: [BigInt(i)],
            });

            const [giver, title, , totalFunds, , , , status, , createdAt] = grant as any;

            // Check if user created this grant
            if (giver.toLowerCase() === address.toLowerCase()) {
              allTransactions.push({
                id: `grant-created-${i}`,
                type: "grant_created",
                contractType: "GrantProgram",
                itemId: i,
                amount: totalFunds,
                timestamp: createdAt,
                status: status === 2 ? "Active" : "Open",
                description: title || `Grant #${i}`,
              });
            }

            // Check if user applied
            const appCount = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram as `0x${string}`,
              abi: GRANT_PROGRAM_ABI,
              functionName: "getApplicationCount",
              args: [BigInt(i)],
            });

            for (let j = 0; j < Number(appCount); j++) {
              try {
                const app = await readContract(wagmiConfig, {
                  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].GrantProgram as `0x${string}`,
                  abi: GRANT_PROGRAM_ABI,
                  functionName: "getApplication",
                  args: [BigInt(i), BigInt(j)],
                });

                const [applicant, , , requestedAmount, appliedAt, appStatus] = app as any;

                if (applicant.toLowerCase() === address.toLowerCase()) {
                  allTransactions.push({
                    id: `grant-applied-${i}-${j}`,
                    type: "grant_applied",
                    contractType: "GrantProgram",
                    itemId: i,
                    amount: requestedAmount,
                    timestamp: appliedAt,
                    status: appStatus === 1 ? "Approved" : appStatus === 2 ? "Rejected" : "Pending",
                    description: title || `Grant #${i}`,
                  });
                }
              } catch (appError) {
                console.error(`Error loading application ${j} for grant ${i}:`, appError);
              }
            }
          } catch (grantError) {
            console.error(`Error loading grant ${i}:`, grantError);
          }
        }
      } catch (error) {
        console.error("Error loading grant transactions:", error);
      }

      // Load Crowdfunding transactions
      try {
        console.log("Loading crowdfunding...");
        const campaignCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding as `0x${string}`,
          abi: CROWDFUNDING_ABI,
          functionName: "campaignCounter",
        });
        console.log("Campaign counter:", campaignCounter);
        const crowdfundingCount = Number(campaignCounter);

        for (let i = 1; i <= crowdfundingCount; i++) {
          try {
            const campaign = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding as `0x${string}`,
              abi: CROWDFUNDING_ABI,
              functionName: "getCampaignInfo",
              args: [BigInt(i)],
            });

            const [
              creator,
              title,
              projectDetails,
              socialAccounts,
              fundingGoal,
              totalRaised,
              deadline,
              createdAt,
              status,
              totalWithdrawn,
            ] = campaign as any;

            // Check if user created this campaign
            if (creator.toLowerCase() === address.toLowerCase()) {
              allTransactions.push({
                id: `crowdfunding-created-${i}`,
                type: "crowdfunding_created",
                contractType: "Crowdfunding",
                itemId: i,
                timestamp: createdAt,
                status: status === 1 ? "Successful" : status === 0 ? "Active" : "Failed",
                description: title || `Campaign #${i}`,
              });
            }

            // Check if user contributed
            const contributorCount = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding as `0x${string}`,
              abi: CROWDFUNDING_ABI,
              functionName: "getContributorCount",
              args: [BigInt(i)],
            });

            for (let j = 0; j < Number(contributorCount); j++) {
              try {
                const contributor = await readContract(wagmiConfig, {
                  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Crowdfunding as `0x${string}`,
                  abi: CROWDFUNDING_ABI,
                  functionName: "getContributor",
                  args: [BigInt(i), BigInt(j)],
                });

                const [contributorAddr, amount, refunded] = contributor as any;

                if (contributorAddr.toLowerCase() === address.toLowerCase()) {
                  allTransactions.push({
                    id: `crowdfunding-contributed-${i}-${j}`,
                    type: "crowdfunding_contributed",
                    contractType: "Crowdfunding",
                    itemId: i,
                    amount: amount,
                    timestamp: createdAt,
                    status: refunded ? "Refunded" : "Contributed",
                    description: title || `Campaign #${i}`,
                  });
                }
              } catch (contributorError) {
                console.error(`Error loading contributor ${j} for campaign ${i}:`, contributorError);
              }
            }
          } catch (campaignError) {
            console.error(`Error loading campaign ${i}:`, campaignError);
          }
        }
      } catch (error) {
        console.error("Error loading crowdfunding transactions:", error);
      }

      // Load Looking for Grant transactions
      try {
        console.log("Loading LFG requests...");
        const requestCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant as `0x${string}`,
          abi: LOOKING_FOR_GRANT_ABI,
          functionName: "requestCounter",
        });
        console.log("Request counter:", requestCounter);
        const lfgCount = Number(requestCounter);

        for (let i = 1; i <= lfgCount; i++) {
          try {
            const request = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant as `0x${string}`,
              abi: LOOKING_FOR_GRANT_ABI,
              functionName: "getRequestInfo",
              args: [BigInt(i)],
            });

            const [creator, title, , , , , , , , status, createdAt] = request as any;

            // Check if user created this request
            if (creator.toLowerCase() === address.toLowerCase()) {
              allTransactions.push({
                id: `lfg-created-${i}`,
                type: "lfg_created",
                contractType: "LookingForGrant",
                itemId: i,
                timestamp: createdAt,
                status: status === 1 ? "Funded" : status === 0 ? "Active" : "Cancelled",
                description: title || `LFG Request #${i}`,
              });
            }

            // Check if user supported
            const supporterCount = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant as `0x${string}`,
              abi: LOOKING_FOR_GRANT_ABI,
              functionName: "getSupporterCount",
              args: [BigInt(i)],
            });

            for (let j = 0; j < Number(supporterCount); j++) {
              try {
                const supporter = await readContract(wagmiConfig, {
                  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].LookingForGrant as `0x${string}`,
                  abi: LOOKING_FOR_GRANT_ABI,
                  functionName: "getSupporter",
                  args: [BigInt(i), BigInt(j)],
                });

                const [supporterAddr, amount, timestamp] = supporter as any;

                if (supporterAddr.toLowerCase() === address.toLowerCase()) {
                  allTransactions.push({
                    id: `lfg-supported-${i}-${j}`,
                    type: "lfg_supported",
                    contractType: "LookingForGrant",
                    itemId: i,
                    amount: amount,
                    timestamp: timestamp,
                    status: "Supported",
                    description: title || `LFG Request #${i}`,
                  });
                }
              } catch (supporterError) {
                console.error(`Error loading supporter ${j} for LFG ${i}:`, supporterError);
              }
            }
          } catch (lfgError) {
            console.error(`Error loading LFG request ${i}:`, lfgError);
          }
        }
      } catch (error) {
        console.error("Error loading LFG transactions:", error);
      }

      // Load Airdrop transactions
      try {
        const airdropCounter = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
          abi: AIRDROP_ABI,
          functionName: "airdropCounter",
        });

        for (let i = 1; i <= Number(airdropCounter); i++) {
          try {
            const airdrop = await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
              abi: AIRDROP_ABI,
              functionName: "getAirdrop",
              args: [BigInt(i)],
            });

            const [creator, title, , totalReward, , deadline, , createdAt] = airdrop as any;

            // Check if user created this airdrop
            if (creator.toLowerCase() === address.toLowerCase()) {
              allTransactions.push({
                id: `airdrop-created-${i}`,
                type: "airdrop_created",
                contractType: "Airdrop",
                itemId: i,
                amount: totalReward,
                timestamp: createdAt,
                status: "Created",
                description: title || `Airdrop #${i}`,
              });
            }

            // Check if user submitted to this airdrop
            try {
              const hasSubmitted = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                abi: AIRDROP_ABI,
                functionName: "hasSubmitted",
                args: [BigInt(i), address],
              });

              if (hasSubmitted) {
                const submission = await readContract(wagmiConfig, {
                  address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                  abi: AIRDROP_ABI,
                  functionName: "getUserSubmission",
                  args: [BigInt(i), address],
                });

                const [, submittedAt, status] = submission as any;

                allTransactions.push({
                  id: `airdrop-submitted-${i}`,
                  type: "airdrop_submitted",
                  contractType: "Airdrop",
                  itemId: i,
                  timestamp: submittedAt,
                  status: status === 1 ? "Approved" : status === 2 ? "Rejected" : "Pending",
                  description: title || `Airdrop #${i}`,
                });
              }
            } catch (submissionError) {
              // User hasn't submitted to this airdrop
            }
          } catch (airdropError) {
            console.error(`Error loading airdrop ${i}:`, airdropError);
          }
        }
      } catch (error) {
        console.error("Error loading airdrop transactions:", error);
      }

      // Sort by timestamp descending
      allTransactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      console.log("Total transactions loaded:", allTransactions.length);
      console.log("Transactions:", allTransactions);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transaction history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "bounty_created":
      case "bounty_submitted":
      case "bounty_won":
      case "bounty_revealed":
      case "bounty_replied":
        return Target;
      case "grant_created":
      case "grant_applied":
      case "grant_received":
        return Gift;
      case "crowdfunding_created":
      case "crowdfunding_contributed":
        return Users;
      case "lfg_created":
      case "lfg_supported":
        return TrendingUp;
      case "airdrop_created":
      case "airdrop_submitted":
        return Coins;
      default:
        return ArrowRight;
    }
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    if (type.includes("created")) return "text-blue-600 bg-blue-50 border-blue-200";
    if (type.includes("submitted") || type.includes("applied")) return "text-purple-600 bg-purple-50 border-purple-200";
    if (type.includes("won") || type.includes("received")) return "text-green-600 bg-green-50 border-green-200";
    if (type.includes("revealed")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (type.includes("replied")) return "text-cyan-600 bg-cyan-50 border-cyan-200";
    if (type.includes("contributed") || type.includes("supported")) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getTransactionLabel = (type: Transaction["type"]) => {
    const labels: Record<Transaction["type"], string> = {
      bounty_created: "Created Bounty",
      bounty_submitted: "Submitted to Bounty",
      bounty_won: "Won Bounty",
      bounty_revealed: "Revealed Solution",
      bounty_replied: "Replied to Submission",
      grant_created: "Created Grant Program",
      grant_applied: "Applied for Grant",
      grant_received: "Received Grant",
      crowdfunding_created: "Created Campaign",
      crowdfunding_contributed: "Contributed to Campaign",
      lfg_created: "Created LFG Request",
      lfg_supported: "Supported LFG",
      airdrop_created: "Created Airdrop",
      airdrop_submitted: "Submitted to Airdrop",
    };
    return labels[type];
  };

  const getRouteForTransaction = (tx: Transaction) => {
    switch (tx.contractType) {
      case "Quinty":
        return `/bounties/${tx.itemId}`;
      case "GrantProgram":
        return `/funding/grant-program/${tx.itemId}`;
      case "Crowdfunding":
        return `/funding/crowdfunding/${tx.itemId}`;
      case "LookingForGrant":
        return `/funding/looking-for-grant/${tx.itemId}`;
      case "Airdrop":
        return `/airdrops/${tx.itemId}`;
      default:
        return "#";
    }
  };

  const filteredTransactions = filter === "all"
    ? transactions
    : transactions.filter((tx) => {
        if (filter === "bounties") return tx.contractType === "Quinty";
        if (filter === "grants") return tx.contractType === "GrantProgram";
        if (filter === "crowdfunding") return tx.contractType === "Crowdfunding";
        if (filter === "lfg") return tx.contractType === "LookingForGrant";
        if (filter === "airdrops") return tx.contractType === "Airdrop";
        return true;
      });

  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to view transaction history
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-6">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your interactions with Quinty smart contracts
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-muted-foreground">Bounties</p>
              </div>
              <p className="text-2xl font-bold">
                {transactions.filter((tx) => tx.contractType === "Quinty").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Grants</p>
              </div>
              <p className="text-2xl font-bold">
                {transactions.filter((tx) => tx.contractType === "GrantProgram").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-muted-foreground">Crowdfunding</p>
              </div>
              <p className="text-2xl font-bold">
                {transactions.filter((tx) => tx.contractType === "Crowdfunding").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <p className="text-xs text-muted-foreground">LFG</p>
              </div>
              <p className="text-2xl font-bold">
                {transactions.filter((tx) => tx.contractType === "LookingForGrant").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="bounties">Bounties</SelectItem>
              <SelectItem value="grants">Grants</SelectItem>
              <SelectItem value="crowdfunding">Crowdfunding</SelectItem>
              <SelectItem value="lfg">Looking for Grant</SelectItem>
              <SelectItem value="airdrops">Airdrops</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all"
                  ? "You haven't made any transactions yet"
                  : `No ${filter} transactions found`}
              </p>
              <Button onClick={() => router.push("/bounties")}>Explore Bounties</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => {
              const Icon = getTransactionIcon(tx.type);
              const colorClass = getTransactionColor(tx.type);

              return (
                <Card
                  key={tx.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(getRouteForTransaction(tx))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {getTransactionLabel(tx.type)}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {tx.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(Number(tx.timestamp) * 1000).toLocaleDateString()}
                            </span>
                            {tx.amount && (
                              <span className="flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                {formatETH(tx.amount)} ETH
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
