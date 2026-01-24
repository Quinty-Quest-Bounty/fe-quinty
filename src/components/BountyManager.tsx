"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../utils/contracts";
import { parseETH, wagmiConfig } from "../utils/web3";
import BountyCard from "./BountyCard";
import {
  uploadMetadataToIpfs,
  uploadToIpfs,
  BountyMetadata,
} from "../utils/ipfs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Plus,
  Minus,
  Upload,
  ChevronDown,
  Clock,
  Target,
  Users,
  DollarSign,
} from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";

// V2 Interfaces matching contract structs
interface Reply {
  replier: string;
  content: string;
  timestamp: bigint;
}

interface Submission {
  solver: string;
  blindedIpfsCid: string;
  revealIpfsCid: string;
  deposit: bigint;
  replies: readonly Reply[];
  revealed: boolean;
}

interface Bounty {
  id: number;
  creator: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  allowMultipleWinners: boolean;
  winnerShares: readonly bigint[];
  status: number; // Enum: 0:OPREC, 1:OPEN, 2:PENDING_REVEAL, 3:RESOLVED, 4:EXPIRED
  slashPercent: bigint;
  submissions: readonly Submission[];
  selectedWinners: readonly string[];
  selectedSubmissionIds: readonly bigint[];
  metadataCid?: string;
  hasOprec?: boolean;
  oprecDeadline?: bigint;
}

export default function BountyManager() {
  const { isConnected, address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // State
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [activeTab, setActiveTab] = useState<
    "create" | "browse" | "my-bounties"
  >("browse");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showPastBounties, setShowPastBounties] = useState(false);

  // Form states
  const [newBounty, setNewBounty] = useState({
    title: "",
    description: "",
    amount: "",
    deadline: "",
    slashPercent: 30,
    allowMultipleWinners: false,
    winnerShares: [100],
    bountyType: "development" as
      | "development"
      | "design"
      | "marketing"
      | "research"
      | "other",
    requirements: [""],
    deliverables: [""],
    skills: [""],
    images: [] as string[], // IPFS CIDs for uploaded images
    hasOprec: false,
    oprecDeadline: "",
  });

  // Date and time state for the calendar
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Sync date and time to deadline field
  useEffect(() => {
    if (deadlineDate && deadlineTime) {
      const [hours, minutes] = deadlineTime.split(":");
      const combinedDateTime = new Date(deadlineDate);
      combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const formattedDateTime = combinedDateTime.toISOString().slice(0, 16);
      setNewBounty((prev) => ({ ...prev, deadline: formattedDateTime }));
    }
  }, [deadlineDate, deadlineTime]);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [newSubmission, setNewSubmission] = useState({
    bountyId: 0,
    ipfsCid: "",
  });

  // Read bounty counter
  const { data: bountyCounter } = useReadContract({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    functionName: "bountyCounter",
    query: { enabled: true, retry: false, refetchOnWindowFocus: false },
  });

  // Watch for bounty events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    eventName: "BountyCreated",
    onLogs() {
      loadBountiesAndSubmissions();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
    abi: QUINTY_ABI,
    eventName: "SubmissionCreated",
    onLogs() {
      loadBountiesAndSubmissions();
    },
  });

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (newFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (uploadedFiles.length === 0) return [];
    setIsUploadingImages(true);
    const uploadedCids: string[] = [];
    try {
      for (const file of uploadedFiles) {
        const cid = await uploadToIpfs(file, {
          bountyTitle: newBounty.title,
          type: "bounty-image",
        });
        uploadedCids.push(cid);
      }
      return uploadedCids;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const loadBountiesAndSubmissions = async () => {
    if (!bountyCounter) return;
    try {
      const loadedBounties: Bounty[] = [];
      for (let i = 1; i <= Number(bountyCounter); i++) {
        try {
          const bountyData = (await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(i)],
          })) as any[];

          const submissionCount = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
            abi: QUINTY_ABI,
            functionName: "getSubmissionCount",
            args: [BigInt(i)],
          });

          const submissions: Submission[] = [];
          for (let j = 0; j < Number(submissionCount); j++) {
            const sub = (await readContract(wagmiConfig, {
              address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
              abi: QUINTY_ABI,
              functionName: "getSubmissionStruct",
              args: [BigInt(i), BigInt(j)],
            })) as Submission;
            submissions.push(sub);
          }

          const description = bountyData[1];
          const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);

          loadedBounties.push({
            id: i,
            creator: bountyData[0],
            description: description,
            amount: bountyData[2],
            deadline: bountyData[3],
            allowMultipleWinners: bountyData[4],
            winnerShares: bountyData[5],
            status: Number(bountyData[6]),
            slashPercent: bountyData[7],
            selectedWinners: bountyData[8],
            selectedSubmissionIds: bountyData[9],
            hasOprec: bountyData[10],
            oprecDeadline: bountyData[11],
            submissions,
            metadataCid: metadataMatch ? metadataMatch[1] : undefined,
          });
        } catch (e) {
          console.error(`Error loading bounty ${i}`, e);
        }
      }
      setBounties(loadedBounties.reverse());
    } catch (error) {
      console.error("Error loading all bounties", error);
    }
  };

  const createBounty = async () => {
    if (!isConnected) return;
    const deadlineTimestamp = Math.floor(new Date(newBounty.deadline).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (deadlineTimestamp <= now) {
      alert("Deadline must be in the future");
      return;
    }
    try {
      const imageCids = await uploadImages();
      const metadata: BountyMetadata = {
        title: newBounty.title,
        description: newBounty.description,
        requirements: newBounty.requirements.filter((r) => r.trim()),
        deliverables: newBounty.deliverables.filter((d) => d.trim()),
        skills: newBounty.skills.filter((s) => s.trim()),
        images: imageCids,
        deadline: deadlineTimestamp,
        bountyType: newBounty.bountyType,
      };
      const metadataCid = await uploadMetadataToIpfs(metadata);
      const winnerSharesArg = newBounty.allowMultipleWinners ? newBounty.winnerShares.map((s) => BigInt(s * 100)) : [];
      const oprecDeadline = newBounty.hasOprec && newBounty.oprecDeadline ? Math.floor(new Date(newBounty.oprecDeadline).getTime() / 1000) : 0;

      writeContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "createBounty",
        args: [
          `${newBounty.title}\n\nMetadata: ipfs://${metadataCid}`,
          BigInt(deadlineTimestamp),
          newBounty.allowMultipleWinners,
          winnerSharesArg,
          BigInt(newBounty.slashPercent * 100),
          newBounty.hasOprec,
          BigInt(oprecDeadline),
        ],
        value: parseETH(newBounty.amount),
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const submitSolution = async (bountyId: number, ipfsCid: string) => {
    if (!isConnected) return;
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

  useEffect(() => {
    if (isConfirmed) loadBountiesAndSubmissions();
  }, [isConfirmed]);

  useEffect(() => {
    if (bountyCounter) loadBountiesAndSubmissions();
  }, [bountyCounter]);

  const getFilteredBounties = () => {
    return bounties.filter(b => {
      const isPast = b.status === 3 || BigInt(Math.floor(Date.now() / 1000)) > b.deadline;
      if (statusFilter === "resolved") return b.status === 3;
      if (statusFilter === "expired") return BigInt(Math.floor(Date.now() / 1000)) > b.deadline;
      return !isPast;
    });
  };

  const getPastBounties = () => {
    return bounties.filter(b => b.status === 3 || BigInt(Math.floor(Date.now() / 1000)) > b.deadline);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Quinty Bounty</h1>
        <p className="text-muted-foreground text-lg">100% ETH escrow and secure submissions.</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-md bg-muted p-1">
          {["browse", "my-bounties", "create"].map((tab) => (
            <Button key={tab} variant={activeTab === tab ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab as any)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {activeTab === "create" && (
        <div className="max-w-4xl mx-auto bg-white border rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Basic Info</h3>
              <Input placeholder="Title" value={newBounty.title} onChange={e => setNewBounty({...newBounty, title: e.target.value})} />
              <textarea placeholder="Description" rows={4} className="w-full p-2 border rounded" value={newBounty.description} onChange={e => setNewBounty({...newBounty, description: e.target.value})} />
              <Input type="number" placeholder="Amount (ETH)" value={newBounty.amount} onChange={e => setNewBounty({...newBounty, amount: e.target.value})} />
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Settings</h3>
              <div className="flex gap-2">
                <Input type="date" className="flex-1" onChange={e => setDeadlineDate(new Date(e.target.value))} />
                <Input type="time" className="w-32" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={newBounty.allowMultipleWinners} onChange={e => setNewBounty({...newBounty, allowMultipleWinners: e.target.checked})} />
                <label className="text-sm">Allow Multiple Winners</label>
              </div>
              <Button onClick={createBounty} disabled={isPending || isConfirming} className="w-full">
                {isPending || isConfirming ? "Processing..." : "Create Bounty"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "browse" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredBounties().map(b => (
              <BountyCard key={b.id} bounty={b} onSubmitSolution={submitSolution} onSelectWinners={selectWinners} onTriggerSlash={triggerSlash} onAddReply={addReply} onRevealSolution={revealSolution} />
            ))}
          </div>

          <div className="pt-8 border-t flex flex-col items-center gap-4">
            <Button variant="outline" onClick={() => setShowPastBounties(!showPastBounties)}>
              {showPastBounties ? "Hide" : "Show"} Past Bounties <ChevronDown className={showPastBounties ? "rotate-180" : ""} />
            </Button>
            {showPastBounties && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 w-full">
                {getPastBounties().map(b => (
                  <BountyCard key={b.id} bounty={b} onSubmitSolution={submitSolution} onSelectWinners={selectWinners} onTriggerSlash={triggerSlash} onAddReply={addReply} onRevealSolution={revealSolution} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "my-bounties" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.filter(b => b.creator.toLowerCase() === address?.toLowerCase()).map(b => (
            <BountyCard key={b.id} bounty={b} onSubmitSolution={submitSolution} onSelectWinners={selectWinners} onTriggerSlash={triggerSlash} onAddReply={addReply} onRevealSolution={revealSolution} />
          ))}
        </div>
      )}
    </div>
  );
}
