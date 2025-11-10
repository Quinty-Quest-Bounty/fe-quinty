"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  DISPUTE_ABI,
  QUINTY_ABI, // Import Quinty ABI to get submission details
  BASE_SEPOLIA_CHAIN_ID,
  MIN_VOTING_STAKE,
} from "../utils/contracts";
import { readContract } from "@wagmi/core";
import {
  formatETH,
  formatTimeLeft,
  formatAddress,
  wagmiConfig,
  parseETH,
} from "../utils/web3";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Scale,
  Vote,
  Users,
  Clock,
  AlertTriangle,
  ExternalLink,
  Gavel,
  Trophy,
  Target,
  Eye,
  Coins,
  FileText,
  CheckCircle,
  Timer,
  Award,
} from "lucide-react";

// Interfaces
interface Dispute {
  id: number;
  bountyId: number;
  isExpiry: boolean;
  amount: bigint;
  votingEnd: number;
  voteCount: number;
  resolved: boolean;
}

interface Vote {
  voter: string;
  stake: bigint;
  rankedSubIds: number[];
}

interface Submission {
  solver: string;
  blindedIpfsCid: string;
}

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  allowMultipleWinners: boolean;
  winnerShares: readonly bigint[];
  status: number; // 0:OPEN, 1:PENDING_REVEAL, 2:RESOLVED, 3:DISPUTED, 4:EXPIRED
  slashPercent: bigint;
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
}

export default function DisputeManager() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  // State
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [eligibleBounties, setEligibleBounties] = useState<Bounty[]>([]);
  const [disputedSubmissions, setDisputedSubmissions] = useState<{
    [bountyId: number]: Submission[];
  }>({});
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Form states
  const [voteForm, setVoteForm] = useState<{
    rank1: string;
    rank2: string;
    rank3: string;
    stakeAmount: string;
  }>({ rank1: "-1", rank2: "-1", rank3: "-1", stakeAmount: MIN_VOTING_STAKE });

  // Read dispute counter
  const { data: disputeCounter, refetch: refetchDisputes } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
      .DisputeResolver as `0x${string}`,
    abi: DISPUTE_ABI,
    functionName: "disputeCounter",
  });

  // Read bounty counter
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
  });

  // Load eligible bounties for dispute
  const loadEligibleBounties = async () => {
    if (bountyCounter === undefined) return;

    console.log("🔍 DEBUG: Starting to load eligible bounties...");
    console.log("🔍 DEBUG: Bounty counter:", Number(bountyCounter));

    const loadedBounties: Bounty[] = [];
    for (let i = 1; i <= Number(bountyCounter); i++) {
      try {
        console.log(`🔍 DEBUG: Loading bounty ${i}...`);
        const bountyData = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
            .Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getBountyData",
          args: [BigInt(i)],
        });

        if (bountyData) {
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
          ] = bountyData as any;

          console.log(`🔍 DEBUG: Bounty ${i} data:`, {
            creator,
            description: description?.substring(0, 50) + "...",
            amount: amount?.toString(),
            deadline: deadline?.toString(),
            status: Number(status),
            selectedWinners: selectedWinners?.length,
            selectedSubmissionIds: selectedSubmissionIds?.length,
          });

          // Only include PENDING_REVEAL bounties (status 1) that can be disputed
          if (status === 1 && selectedWinners.length > 0) {
            console.log(`✅ DEBUG: Bounty ${i} is eligible for dispute!`);
            const bounty: Bounty = {
              id: i,
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
            };
            loadedBounties.push(bounty);
          } else {
            console.log(
              `❌ DEBUG: Bounty ${i} not eligible - status: ${Number(
                status
              )}, selectedWinners: ${selectedWinners?.length}`
            );
          }
        } else {
          console.log(`❌ DEBUG: No data returned for bounty ${i}`);
        }
      } catch (error) {
        console.error(`Error loading bounty ${i}:`, error);
      }
    }
    console.log(
      `🔍 DEBUG: Total eligible bounties found: ${loadedBounties.length}`
    );
    setEligibleBounties(loadedBounties);
  };

  // Function to fetch submissions for a given bounty
  const fetchSubmissionsForBounty = async (bountyId: number) => {
    if (disputedSubmissions[bountyId]) return; // Already fetched

    try {
      const submissionCount = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "getSubmissionCount",
        args: [BigInt(bountyId)],
      });

      const loadedSubmissions: Submission[] = [];
      for (let i = 0; i < Number(submissionCount); i++) {
        const subData = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
            .Quinty as `0x${string}`,
          abi: QUINTY_ABI,
          functionName: "getSubmission",
          args: [BigInt(bountyId), BigInt(i)],
        });
        const [, solver, blindedIpfsCid] = subData as any;
        loadedSubmissions.push({ solver, blindedIpfsCid });
      }
      setDisputedSubmissions((prev) => ({
        ...prev,
        [bountyId]: loadedSubmissions,
      }));
    } catch (error) {
      console.error(
        `Error fetching submissions for bounty ${bountyId}:`,
        error
      );
    }
  };

  // Load all disputes
  const loadDisputes = async () => {
    if (disputeCounter === undefined) return;

    const loadedDisputes: Dispute[] = [];
    for (let i = 1; i <= Number(disputeCounter); i++) {
      try {
        const disputeData = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
            .DisputeResolver as `0x${string}`,
          abi: DISPUTE_ABI,
          functionName: "getDispute",
          args: [BigInt(i)],
        });

        if (disputeData) {
          const [bountyId, isExpiry, amount, votingEnd, resolved, voteCount] =
            disputeData as any;
          const dispute: Dispute = {
            id: i,
            bountyId: Number(bountyId),
            isExpiry,
            amount,
            votingEnd: Number(votingEnd),
            resolved,
            voteCount: Number(voteCount),
          };
          loadedDisputes.push(dispute);
          fetchSubmissionsForBounty(dispute.bountyId); // Fetch submissions for the disputed bounty
        }
      } catch (error) {
        console.error(`Error loading dispute ${i}:`, error);
      }
    }
    setDisputes(loadedDisputes.reverse());
  };

  // Cast vote
  const castVote = async () => {
    if (!isConnected || !selectedDispute) return;

    const rankings = [voteForm.rank1, voteForm.rank2, voteForm.rank3].map(
      Number
    );
    if (rankings.some((r) => r < 0)) {
      alert("Please rank 3 unique submissions.");
      return;
    }
    const uniqueRankings = new Set(rankings);
    if (uniqueRankings.size !== 3) {
      alert("Rankings must be for 3 unique submissions.");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .DisputeResolver as `0x${string}`,
        abi: DISPUTE_ABI,
        functionName: "vote",
        args: [BigInt(selectedDispute.id), rankings.map((r) => BigInt(r))],
        value: parseETH(voteForm.stakeAmount),
      });

      alert("Vote cast successfully!");
      refetchDisputes();
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Error casting vote");
    }
  };

  // Resolve dispute
  const resolveDispute = async (disputeId: number) => {
    if (!isConnected) return;

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .DisputeResolver as `0x${string}`,
        abi: DISPUTE_ABI,
        functionName: "resolveDispute",
        args: [BigInt(disputeId)],
      });

      alert("Dispute resolved successfully!");
      refetchDisputes();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      alert("Error resolving dispute");
    }
  };

  // Initiate dispute
  const initiatePengadilan = async (bounty: Bounty) => {
    if (!isConnected) return;

    // Calculate required stake (10% of bounty amount)
    const requiredStake = (bounty.amount * BigInt(1000)) / BigInt(10000); // 10%

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .DisputeResolver as `0x${string}`,
        abi: DISPUTE_ABI,
        functionName: "initiatePengadilanDispute",
        args: [BigInt(bounty.id)],
        value: requiredStake,
      });

      alert("Dispute initiated successfully!");
      refetchDisputes();
      loadEligibleBounties(); // Refresh the list
    } catch (error) {
      console.error("Error initiating:", error);
      alert("Error initiating dispute");
    }
  };

  useEffect(() => {
    if (disputeCounter) {
      loadDisputes();
    }
  }, [disputeCounter]);

  useEffect(() => {
    if (bountyCounter) {
      loadEligibleBounties();
    }
  }, [bountyCounter]);

  // Show Coming Soon message

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Dispute Resolution
          </h1>
          <p className="text-muted-foreground">
            Participate in community voting to resolve bounty disputes and
            expiries. Help maintain fairness and justice in the ecosystem.
          </p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Scale className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-3 text-center">
            Coming Soon
          </CardTitle>
          <CardDescription className="text-center max-w-md text-base">
            Community-powered dispute resolution is currently under development.
            Soon you'll be able to participate in voting to resolve bounty disputes
            and maintain ecosystem fairness.
          </CardDescription>
          <Badge variant="secondary" className="mt-6 px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            In Development
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
