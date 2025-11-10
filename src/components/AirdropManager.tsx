"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
  useChainId,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  CONTRACT_ADDRESSES,
  AIRDROP_ABI,
  BASE_SEPOLIA_CHAIN_ID,
} from "../utils/contracts";
import {
  formatETH,
  formatTimeLeft,
  formatAddress,
  wagmiConfig,
  parseETH,
} from "../utils/web3";
import { uploadToIpfs, formatIpfsUrl, IpfsImage } from "../utils/ipfs";
import { ensureBaseSepoliaNetwork } from "../utils/network";
import AirdropCard from "./AirdropCard";
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
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Plus,
  Search,
  Settings,
  Gift,
  Users,
  Calendar,
  Coins,
  Upload,
  X,
  Check,
  Clock,
  Target,
  Send,
  Eye,
  Star,
  Trash2,
  FileText,
  ExternalLink,
} from "lucide-react";

interface Airdrop {
  id: number;
  creator: string;
  title: string;
  description: string;
  totalAmount: bigint;
  perQualifier: bigint;
  maxQualifiers: number;
  qualifiersCount: number;
  deadline: number;
  createdAt: number;
  resolved: boolean;
  cancelled: boolean;
  requirements: string;
  imageUrl?: string;
}

interface Entry {
  solver: string;
  ipfsProofCid: string;
  timestamp: number;
  status: number; // 0: Pending, 1: Approved, 2: Rejected
  feedback: string;
}

export default function AirdropManager() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  // State
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [entries, setEntries] = useState<{ [airdropId: number]: Entry[] }>({});
  const [entryCounts, setEntryCounts] = useState<{
    [airdropId: number]: number;
  }>({});
  const [selectedAirdrop, setSelectedAirdrop] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "browse" | "manage">(
    "browse"
  );

  // Form states
  const [newAirdrop, setNewAirdrop] = useState({
    title: "",
    description: "",
    perQualifier: "",
    maxQualifiers: 100,
    deadline: "",
    requirements: "",
    imageUrl: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [newEntry, setNewEntry] = useState({
    airdropId: 0,
    ipfsProofCid: "",
    twitterUrl: "",
    description: "",
  });

  const [verificationForm, setVerificationForm] = useState({
    airdropId: 0,
    entryId: 0,
    status: 1, // 1 = Approved
    feedback: "",
    qualifiedIndices: [] as number[],
  });

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalAirdropId, setModalAirdropId] = useState<number | null>(null);

  // Read airdrop counter
  const { data: airdropCounter, refetch: refetchAirdropCounter } =
    useReadContract({
      address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
        .AirdropBounty as `0x${string}`,
      abi: AIRDROP_ABI,
      functionName: "airdropCounter",
      query: { enabled: true, retry: false, refetchOnWindowFocus: false },
    });

  // Watch for airdrop events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
      .AirdropBounty as `0x${string}`,
    abi: AIRDROP_ABI,
    eventName: "AirdropCreated",
    onLogs() {
      refetchAirdropCounter();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
      .AirdropBounty as `0x${string}`,
    abi: AIRDROP_ABI,
    eventName: "EntrySubmitted",
    onLogs() {
      if (selectedAirdrop) {
        loadEntries(selectedAirdrop);
      }
    },
  });

  // Load all airdrops
  const loadAirdrops = async () => {
    if (airdropCounter === undefined) return;

    try {
      const loadedAirdrops: Airdrop[] = [];
      const counts: { [airdropId: number]: number } = {};

      for (let i = 1; i <= Number(airdropCounter); i++) {
        try {
        const airdrop = await readAirdrop(i);
        if (airdrop) {
          loadedAirdrops.push(airdrop);

          // Load entry count for this airdrop
          const entryCount = await readContract(wagmiConfig, {
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
              .AirdropBounty as `0x${string}`,
            abi: AIRDROP_ABI,
            functionName: "getEntryCount",
            args: [BigInt(i)],
          });
          counts[i] = Number(entryCount);
        }
        } catch (error) {
          console.error(`Error loading airdrop ${i}:`, error);
        }
      }
      setAirdrops(loadedAirdrops.reverse());
      setEntryCounts(counts);
    } catch (error) {
      console.error("Error loading airdrops:", error);
      // Don't show error to user, just log it
    }
  };

  // Read specific airdrop
  const readAirdrop = async (airdropId: number): Promise<Airdrop | null> => {
    try {
      const airdropData = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "getAirdrop",
        args: [BigInt(airdropId)],
      });

      if (airdropData) {
        const [
          creator,
          title,
          description,
          totalAmount,
          perQualifier,
          maxQualifiers,
          qualifiersCount,
          deadline,
          createdAt,
          resolved,
          cancelled,
          requirements,
        ] = airdropData as any;
        return {
          id: airdropId,
          creator,
          title,
          description,
          totalAmount,
          perQualifier,
          maxQualifiers: Number(maxQualifiers),
          qualifiersCount: Number(qualifiersCount),
          deadline: Number(deadline),
          createdAt: Number(createdAt),
          resolved,
          cancelled,
          requirements,
          imageUrl: description.includes("ipfs://")
            ? description.match(/ipfs:\/\/[^\s\n]+/)?.[0]
            : undefined,
        };
      }
      return null;
    } catch (e) {
      console.error(`Error reading airdrop ${airdropId}:`, e);
      return null;
    }
  };

  // Load entries for an airdrop
  const loadEntries = async (airdropId: number) => {
    try {
      const entryCount = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "getEntryCount",
        args: [BigInt(airdropId)],
      });

      const loadedEntries: Entry[] = [];
      for (let i = 0; i < Number(entryCount); i++) {
        const entryData = await readContract(wagmiConfig, {
          address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
            .AirdropBounty as `0x${string}`,
          abi: AIRDROP_ABI,
          functionName: "getEntry",
          args: [BigInt(airdropId), BigInt(i)],
        });
        const [solver, ipfsProofCid, timestamp, status, feedback] =
          entryData as any;
        loadedEntries.push({
          solver,
          ipfsProofCid,
          timestamp: Number(timestamp),
          status: Number(status),
          feedback,
        });
      }

      setEntries((prev) => ({
        ...prev,
        [airdropId]: loadedEntries,
      }));
    } catch (error) {
      console.error(`Error loading entries for airdrop ${airdropId}:`, error);
    }
  };

  const validateAndSetImage = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return false;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
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
    if (files.length > 0) {
      const file = files[0];
      validateAndSetImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setIsDragOver(false);
    setNewAirdrop({ ...newAirdrop, imageUrl: "" });
  };

  // Create airdrop
  const createAirdrop = async () => {
    if (
      !isConnected ||
      !newAirdrop.title ||
      !newAirdrop.perQualifier ||
      !newAirdrop.deadline ||
      !newAirdrop.requirements
    )
      return;

    // Check if user is on Base Sepolia using wagmi's reliable chainId
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      const networkOk = await ensureBaseSepoliaNetwork();
      if (!networkOk) {
        alert("Please connect to Base Sepolia to create airdrops");
        return;
      }
    }

    try {
      let finalImageUrl = newAirdrop.imageUrl;

      // Upload image first if selected but not yet uploaded
      if (selectedImage && !finalImageUrl) {
        setIsUploading(true);
        try {
          const cid = await uploadToIpfs(selectedImage, {
            name: `airdrop-image-${Date.now()}`,
            type: "airdrop-banner",
          });
          finalImageUrl = `ipfs://${cid}`;
        } catch (error) {
          console.error("Error uploading image:", error);
          alert("Error uploading image. Please try again.");
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const deadlineTimestamp = Math.floor(
        new Date(newAirdrop.deadline).getTime() / 1000
      );
      const perQualifierWei = parseETH(newAirdrop.perQualifier);
      const totalAmount = perQualifierWei * BigInt(newAirdrop.maxQualifiers);

      // Include image URL in description if available
      const descriptionWithImage = finalImageUrl
        ? `${newAirdrop.description}\n\nImage: ${finalImageUrl}`
        : newAirdrop.description || "";

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "createAirdrop",
        args: [
          newAirdrop.title,
          descriptionWithImage,
          perQualifierWei,
          BigInt(newAirdrop.maxQualifiers),
          BigInt(deadlineTimestamp),
          newAirdrop.requirements,
        ],
        value: totalAmount,
      });

      console.log("Create airdrop transaction hash:", txHash);

      // Reset form
      setNewAirdrop({
        title: "",
        description: "",
        perQualifier: "",
        maxQualifiers: 100,
        deadline: "",
        requirements: "",
        imageUrl: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating airdrop:", error);
      alert("Error creating airdrop");
    }
  };

  // Submit entry
  const submitEntry = async () => {
    if (!isConnected || !newEntry.airdropId || !newEntry.ipfsProofCid) return;

    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "submitEntry",
        args: [BigInt(newEntry.airdropId), newEntry.ipfsProofCid],
      });

      console.log("Submit entry transaction hash:", txHash);

      setNewEntry({
        airdropId: 0,
        ipfsProofCid: "",
        twitterUrl: "",
        description: "",
      });
    } catch (error) {
      console.error("Error submitting entry:", error);
      alert("Error submitting entry");
    }
  };

  // Verify entry
  const verifyEntry = async () => {
    if (
      !isConnected ||
      !verificationForm.airdropId ||
      verificationForm.entryId === undefined
    )
      return;

    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "verifyEntry",
        args: [
          BigInt(verificationForm.airdropId),
          BigInt(verificationForm.entryId),
          verificationForm.status,
          verificationForm.feedback || "",
        ],
      });

      console.log("Verify entry transaction hash:", txHash);

      setVerificationForm({
        airdropId: 0,
        entryId: 0,
        status: 1,
        feedback: "",
        qualifiedIndices: [],
      });
    } catch (error) {
      console.error("Error verifying entry:", error);
      alert("Error verifying entry");
    }
  };

  // Verify and distribute rewards
  const verifyAndDistribute = async (
    airdropId?: number,
    selectedIndices?: number[]
  ) => {
    // Use parameters if provided, otherwise fall back to form state
    const targetAirdropId = airdropId || verificationForm.airdropId;
    const targetIndices = selectedIndices || verificationForm.qualifiedIndices;

    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!targetAirdropId || targetAirdropId === 0) {
      alert("Invalid airdrop ID. Please try again.");
      return;
    }

    if (targetIndices.length === 0) {
      alert("Please select at least one participant to receive rewards.");
      return;
    }

    // Validate that all indices are valid numbers
    if (targetIndices.some((i) => isNaN(i) || i < 0)) {
      alert("Invalid participant selection. Please try again.");
      return;
    }

    // Check contract address
    const contractAddress =
      CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]?.AirdropBounty;
    if (!contractAddress) {
      alert(
        "Contract address not found. Please check your network configuration."
      );
      return;
    }

    setIsDistributing(true);
    try {
      // Check if current user is the creator of this airdrop
      const airdrop = airdrops.find((a) => a.id === targetAirdropId);
      if (!airdrop) {
        alert("Airdrop not found. Please refresh and try again.");
        setIsDistributing(false);
        return;
      }

      if (airdrop.creator.toLowerCase() !== address?.toLowerCase()) {
        alert(
          "Only the airdrop creator can verify entries and distribute rewards."
        );
        setIsDistributing(false);
        return;
      }

      // Check airdrop status
      if (airdrop.resolved) {
        alert("This airdrop has already been resolved.");
        setIsDistributing(false);
        return;
      }

      if (airdrop.cancelled) {
        alert("This airdrop has been cancelled.");
        setIsDistributing(false);
        return;
      }

      // Check if deadline has passed
      const now = Math.floor(Date.now() / 1000);
      if (now < airdrop.deadline) {
        alert("Cannot distribute rewards before the airdrop deadline.");
        setIsDistributing(false);
        return;
      }

      // Validate entries exist for this airdrop
      const airdropEntries = entries[targetAirdropId];
      if (!airdropEntries || airdropEntries.length === 0) {
        alert("No entries found for this airdrop. Please load entries first.");
        setIsDistributing(false);
        return;
      }

      // Validate all indices are within range
      const maxIndex = airdropEntries.length - 1;
      const invalidIndices = targetIndices.filter((i) => i < 0 || i > maxIndex);
      if (invalidIndices.length > 0) {
        alert(
          `Invalid entry indices: ${invalidIndices.join(
            ", "
          )}. Valid range is 0-${maxIndex}.`
        );
        setIsDistributing(false);
        return;
      }

      const entryIds = targetIndices.map((i) => BigInt(i));
      const statuses = targetIndices.map(() => 1); // 1 = approved status
      const feedbacks = targetIndices.map(
        () => "Approved for reward distribution"
      );

      console.log("Attempting to distribute rewards with params:", {
        airdropId: targetAirdropId,
        indices: targetIndices,
        entryIds: entryIds.map((id) => id.toString()),
        statuses,
        feedbacks,
        entriesCount: airdropEntries.length,
        contractAddress: contractAddress,
        network: BASE_SEPOLIA_CHAIN_ID,
      });

      const txHash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "verifyMultipleEntries",
        args: [BigInt(targetAirdropId), entryIds, statuses, feedbacks],
      });

      console.log("Verification transaction hash:", txHash);

      // After verification, finalize the airdrop to distribute rewards
      const finalizeTxHash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "finalizeAirdrop",
        args: [BigInt(targetAirdropId)],
      });

      console.log("Finalize airdrop transaction hash:", finalizeTxHash);

      // Reset verification form
      setVerificationForm({
        airdropId: 0,
        entryId: 0,
        status: 1,
        feedback: "",
        qualifiedIndices: [],
      });

      loadAirdrops();
      // Refresh entries for the airdrop
      loadEntries(targetAirdropId);
    } catch (error: any) {
      console.error("Error distributing rewards:", error);

      // More detailed error reporting
      let errorMessage = "Error distributing rewards. ";
      if (error?.message) {
        errorMessage += `Details: ${error.message}`;
      } else if (error?.reason) {
        errorMessage += `Reason: ${error.reason}`;
      } else {
        errorMessage += "Please check the console for more details.";
      }

      alert(errorMessage);
    } finally {
      setIsDistributing(false);
    }
  };

  // Cancel airdrop
  const cancelAirdrop = async (airdropId: number) => {
    if (!isConnected || !airdropId) return;

    setIsCancelling(true);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "cancelAirdrop",
        args: [BigInt(airdropId)],
      });

      console.log("Cancel airdrop transaction hash:", txHash);

      loadAirdrops();
    } catch (error) {
      console.error("Error cancelling airdrop:", error);
      alert("Error cancelling airdrop. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Finalize airdrop
  const finalizeAirdrop = async (airdropId: number) => {
    if (!isConnected || !airdropId) return;

    setIsFinalizing(true);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID]
          .AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "finalizeAirdrop",
        args: [BigInt(airdropId)],
      });

      console.log("Finalize airdrop transaction hash:", txHash);

      loadAirdrops();
    } catch (error) {
      console.error("Error finalizing airdrop:", error);
      alert("Error finalizing airdrop. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  useEffect(() => {
    if (airdropCounter !== undefined) {
      loadAirdrops();
    }
  }, [airdropCounter]);

  useEffect(() => {
    if (selectedAirdrop) {
      loadEntries(selectedAirdrop);
    }
  }, [selectedAirdrop]);

  // Load entries for user's campaigns when in manage tab
  useEffect(() => {
    if (activeTab === "manage" && address && airdrops.length > 0) {
      const userCampaigns = airdrops.filter(
        (a) => a.creator === address && !a.resolved && !a.cancelled
      );
      userCampaigns.forEach((campaign) => {
        loadEntries(campaign.id);
      });
    }
  }, [activeTab, address, airdrops]);

  // Remove the wallet connection blocker - let users browse without connecting

  const navigationItems = [
    { id: "browse", label: "Browse", icon: Search },
    { id: "create", label: "Create", icon: Plus },
    { id: "manage", label: "Manage", icon: Settings },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Gift className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Airdrop Bounties
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create transparent promotion tasks with verifiable social proofs and
            distribute rewards fairly
          </p>
        </div>
      </div>

      {/* Wallet Connection Banner */}
      {!isConnected && (
        <Card className="border-purple-200 bg-purple-50/50 max-w-3xl mx-auto">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold text-purple-900">
                Connect Your Wallet to Participate
              </CardTitle>
              <CardDescription className="text-xs text-purple-700">
                Connect your wallet to create campaigns, submit entries, and distribute rewards
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center px-4">
        <div className="inline-flex h-9 sm:h-10 items-center justify-center rounded-lg bg-gray-100 p-0.5 sm:p-1 w-full sm:w-auto max-w-md">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(item.id as any)}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === item.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline sm:inline">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Create Airdrop Tab */}
      {activeTab === "create" && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="text-center p-8 border-b border-gray-200">
              <div className="flex justify-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Gift className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Create Promotion Campaign
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Launch transparent promotional campaigns with fixed ETH rewards
                for verified social media engagement
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* LEFT COLUMN - Basic Info */}
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        1
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Campaign Details
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="title"
                          className="text-sm font-medium text-gray-700"
                        >
                          Campaign Title *
                        </Label>
                        <Input
                          id="title"
                          value={newAirdrop.title}
                          onChange={(e) =>
                            setNewAirdrop({
                              ...newAirdrop,
                              title: e.target.value,
                            })
                          }
                          placeholder="Enter campaign title..."
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium text-gray-700"
                        >
                          Campaign Description
                        </Label>
                        <Textarea
                          id="description"
                          value={newAirdrop.description}
                          onChange={(e) =>
                            setNewAirdrop({
                              ...newAirdrop,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Describe your promotional campaign..."
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="requirements"
                          className="text-sm font-medium text-gray-700"
                        >
                          Requirements (What users need to do) *
                        </Label>
                        <Textarea
                          id="requirements"
                          value={newAirdrop.requirements}
                          onChange={(e) =>
                            setNewAirdrop({
                              ...newAirdrop,
                              requirements: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="e.g., Post on X with #Quinty hashtag, get 100+ likes, include wallet address..."
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500/20 resize-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Campaign Image */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Campaign Image
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Campaign preview"
                            className="w-full h-40 object-cover rounded-lg border border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeImage}
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                            isDragOver
                              ? "border-gray-400 bg-gray-50"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-center">
                              <Upload className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor="image-upload"
                                className="cursor-pointer font-medium text-sm text-gray-900"
                              >
                                Upload an image
                                <span className="text-gray-500 ml-1">
                                  or drag and drop
                                </span>
                              </Label>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              {isDragOver
                                ? "Drop your image here"
                                : "PNG, JPG, GIF up to 5MB"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Rewards & Settings */}
                <div className="space-y-8">
                  {/* Reward Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        3
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Reward Settings
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="reward"
                            className="text-sm font-medium text-gray-700"
                          >
                            Reward Per Qualifier (ETH) *
                          </Label>
                          <div className="relative">
                            <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="reward"
                              type="number"
                              value={newAirdrop.perQualifier}
                              onChange={(e) =>
                                setNewAirdrop({
                                  ...newAirdrop,
                                  perQualifier: e.target.value,
                                })
                              }
                              className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500/20"
                              placeholder="10"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="maxQualifiers"
                            className="text-sm font-medium text-gray-700"
                          >
                            Max Qualifiers *
                          </Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="maxQualifiers"
                              type="number"
                              value={newAirdrop.maxQualifiers}
                              onChange={(e) =>
                                setNewAirdrop({
                                  ...newAirdrop,
                                  maxQualifiers: parseInt(e.target.value) || 0,
                                })
                              }
                              className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500/20"
                              placeholder="100"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="deadline"
                          className="text-sm font-medium text-gray-700"
                        >
                          Deadline *
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={newAirdrop.deadline}
                            onChange={(e) =>
                              setNewAirdrop({
                                ...newAirdrop,
                                deadline: e.target.value,
                              })
                            }
                            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500/20"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Summary */}
                  {newAirdrop.perQualifier && newAirdrop.maxQualifiers && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          4
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Campaign Summary
                        </h3>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Total Budget
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {(
                                parseFloat(newAirdrop.perQualifier) *
                                newAirdrop.maxQualifiers
                              ).toFixed(2)}{" "}
                              ETH
                            </div>
                          </div>

                          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Per User
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {newAirdrop.perQualifier} ETH
                            </div>
                          </div>

                          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Max Participants
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {newAirdrop.maxQualifiers}
                            </div>
                          </div>

                          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Distribution
                            </div>
                            <div className="text-xs font-medium text-gray-700">
                              First-come, first-served
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        if (!isConnected) {
                          alert("Please connect your wallet to create an airdrop campaign");
                          return;
                        }
                        createAirdrop();
                      }}
                      disabled={
                        isUploading ||
                        !newAirdrop.title ||
                        !newAirdrop.perQualifier ||
                        !newAirdrop.maxQualifiers ||
                        !newAirdrop.deadline ||
                        !newAirdrop.requirements
                      }
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="w-4 h-4 mr-2 animate-spin" />
                          Uploading Image...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Campaign
                          {newAirdrop.perQualifier &&
                            newAirdrop.maxQualifiers && (
                              <span className="ml-2 opacity-80">
                                (
                                {(
                                  parseFloat(newAirdrop.perQualifier) *
                                  newAirdrop.maxQualifiers
                                ).toFixed(2)}{" "}
                                ETH)
                              </span>
                            )}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browse Airdrops Tab */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Active Campaigns</h2>
              <p className="text-muted-foreground">
                Discover and participate in promotion campaigns
              </p>
            </div>
            <Badge variant="secondary" className="px-4 py-2">
              {airdrops.filter((a) => !a.resolved && !a.cancelled).length}{" "}
              active
            </Badge>
          </div>

          {airdrops.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="mb-2">No Campaigns Yet</CardTitle>
                <CardDescription className="text-center mb-6">
                  Be the first to create an airdrop campaign!
                </CardDescription>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {airdrops
                .filter((a) => !a.resolved && !a.cancelled)
                .map((airdrop) => (
                  <AirdropCard
                    key={airdrop.id}
                    airdrop={airdrop}
                    entryCount={entryCounts[airdrop.id] || 0}
                    onShowSubmitModal={() => {
                      setModalAirdropId(airdrop.id);
                      setShowSubmitModal(true);
                    }}
                  />
                ))}
            </div>
          )}

          {/* Submit Entry Dialog */}
          <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Your Entry</DialogTitle>
                <DialogDescription>
                  Provide proof of your social media engagement
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">X Post URL</Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="twitterUrl"
                      type="url"
                      placeholder="https://x.com/..."
                      value={
                        newEntry.airdropId === modalAirdropId
                          ? newEntry.twitterUrl
                          : ""
                      }
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          airdropId: modalAirdropId!,
                          twitterUrl: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipfsProof">IPFS Proof CID *</Label>
                  <Input
                    id="ipfsProof"
                    placeholder="QmExample123..."
                    value={
                      newEntry.airdropId === modalAirdropId
                        ? newEntry.ipfsProofCid
                        : ""
                    }
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        airdropId: modalAirdropId!,
                        ipfsProofCid: e.target.value,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload screenshots or proof to IPFS and paste the CID here
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    value={
                      newEntry.airdropId === modalAirdropId
                        ? newEntry.description
                        : ""
                    }
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        airdropId: modalAirdropId!,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setModalAirdropId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    submitEntry();
                    setShowSubmitModal(false);
                    setModalAirdropId(null);
                  }}
                  disabled={
                    !newEntry.ipfsProofCid ||
                    newEntry.airdropId !== modalAirdropId
                  }
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Entries Modal */}
          {selectedAirdrop && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Campaign Entries
                  </h3>
                  <button
                    onClick={() => setSelectedAirdrop(null)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>
                {entries[selectedAirdrop]?.length > 0 ? (
                  <div className="space-y-3">
                    {entries[selectedAirdrop].map((entry, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900">
                            {formatAddress(entry.solver)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 1
                                ? "bg-green-100 text-green-800"
                                : entry.status === 2
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {entry.status === 1
                              ? "Approved"
                              : entry.status === 2
                              ? "Rejected"
                              : "Pending"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div className="mb-1">
                            <strong>
                              {entry.ipfsProofCid.includes("twitter.com") ||
                              entry.ipfsProofCid.includes("x.com")
                                ? "X Post:"
                                : "IPFS:"}
                            </strong>{" "}
                            {entry.ipfsProofCid.includes("twitter.com") ||
                            entry.ipfsProofCid.includes("x.com") ? (
                              <a
                                href={entry.ipfsProofCid}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                              >
                                View Post <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              entry.ipfsProofCid
                            )}
                          </div>
                          <div className="mb-1">
                            <strong>Submitted:</strong>{" "}
                            {new Date(
                              entry.timestamp * 1000
                            ).toLocaleDateString()}
                          </div>
                          {entry.feedback && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <strong className="text-blue-900">
                                Feedback:
                              </strong>
                              <p className="text-blue-800 mt-1">
                                {entry.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-gray-600">No entries submitted yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage Tab - Monochrome Notion-style */}
      {activeTab === "manage" && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Manage Your Campaigns
            </h2>
            <div className="bg-gray-50 border border-gray-200 px-6 py-3 rounded-lg max-w-2xl mx-auto">
              <p className="text-gray-700 text-sm">
                📝 Review submissions and select eligible participants for
                rewards
              </p>
            </div>
          </div>

          {/* Your Active Campaigns */}
          <div className="space-y-4">
            {airdrops.filter(
              (a) => a.creator === address && !a.resolved && !a.cancelled
            ).length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-12 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">📋</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    No Active Campaigns
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You don't have any active campaigns to manage. Create your
                    first campaign to get started!
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Campaign
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {airdrops
                  .filter(
                    (a) => a.creator === address && !a.resolved && !a.cancelled
                  )
                  .map((airdrop) => (
                    <div
                      key={airdrop.id}
                      className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      {/* Campaign Header */}
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Gift className="h-4 w-4 text-gray-600" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {airdrop.title || `Campaign #${airdrop.id}`}
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Reward
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatETH(airdrop.perQualifier)} ETH each
                                </div>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Progress
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {airdrop.qualifiersCount}/
                                  {airdrop.maxQualifiers} qualified
                                </div>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Deadline
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatTimeLeft(BigInt(airdrop.deadline))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {Date.now() / 1000 > airdrop.deadline && (
                              <Button
                                onClick={() => finalizeAirdrop(airdrop.id)}
                                disabled={isFinalizing}
                                variant="default"
                                size="sm"
                                className="bg-gray-900 hover:bg-gray-800 text-white"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {isFinalizing ? "Finalizing..." : "Finalize"}
                              </Button>
                            )}
                            {!airdrop.resolved &&
                              !airdrop.cancelled &&
                              airdrop.qualifiersCount === 0 && (
                                <Button
                                  onClick={() => cancelAirdrop(airdrop.id)}
                                  disabled={isCancelling}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  {isCancelling ? "Cancelling..." : "Cancel"}
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Submissions Section */}
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <h4 className="font-medium text-gray-900">
                              Submissions ({entries[airdrop.id]?.length || 0})
                            </h4>
                          </div>
                          <Button
                            onClick={() => {
                              if (selectedAirdrop === airdrop.id) {
                                setSelectedAirdrop(null);
                              } else {
                                setSelectedAirdrop(airdrop.id);
                                loadEntries(airdrop.id);
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {selectedAirdrop === airdrop.id
                              ? "Hide Submissions"
                              : "Review Submissions"}
                          </Button>
                        </div>

                        {!entries[airdrop.id] ||
                        entries[airdrop.id].length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-center mb-3">
                              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">💭</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                              No submissions yet. Share your campaign to get
                              participants!
                            </p>
                          </div>
                        ) : (
                          <>
                            {selectedAirdrop === airdrop.id && (
                              <div className="space-y-3 mb-6">
                                {entries[airdrop.id].map((entry, index) => (
                                  <div
                                    key={index}
                                    className={`border rounded-lg p-4 transition-colors ${
                                      verificationForm.qualifiedIndices.includes(
                                        index
                                      )
                                        ? "border-gray-400 bg-gray-50"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-600">
                                              {entry.solver
                                                .slice(0, 2)
                                                .toUpperCase()}
                                            </span>
                                          </div>
                                          <span className="font-medium text-gray-900">
                                            {formatAddress(entry.solver)}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={
                                              entry.status === 1
                                                ? "border-gray-400 text-gray-700 bg-gray-100"
                                                : entry.status === 2
                                                ? "border-gray-400 text-gray-700 bg-gray-100"
                                                : "border-gray-300 text-gray-600 bg-gray-50"
                                            }
                                          >
                                            {entry.status === 1
                                              ? "Approved"
                                              : entry.status === 2
                                              ? "Rejected"
                                              : "Pending"}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                          <div className="flex items-center gap-2">
                                            {entry.ipfsProofCid.includes(
                                              "twitter.com"
                                            ) ||
                                            entry.ipfsProofCid.includes(
                                              "x.com"
                                            ) ? (
                                              <>
                                                <ExternalLink className="w-3 h-3 text-gray-400" />
                                                <span>X Post: </span>
                                                <a
                                                  href={entry.ipfsProofCid}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                  View Post
                                                </a>
                                              </>
                                            ) : (
                                              <>
                                                <FileText className="w-3 h-3 text-gray-400" />
                                                <span>
                                                  IPFS: {entry.ipfsProofCid}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            <span>
                                              Submitted:{" "}
                                              {new Date(
                                                entry.timestamp * 1000
                                              ).toLocaleDateString()}
                                            </span>
                                          </div>
                                          {entry.feedback && (
                                            <div className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded text-gray-700 text-xs">
                                              <strong>Feedback:</strong>{" "}
                                              {entry.feedback}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <Button
                                          onClick={() => {
                                            const newQualified =
                                              verificationForm.qualifiedIndices.includes(
                                                index
                                              )
                                                ? verificationForm.qualifiedIndices.filter(
                                                    (i) => i !== index
                                                  )
                                                : [
                                                    ...verificationForm.qualifiedIndices,
                                                    index,
                                                  ];
                                            setVerificationForm({
                                              ...verificationForm,
                                              airdropId: airdrop.id,
                                              qualifiedIndices: newQualified,
                                            });
                                          }}
                                          variant={
                                            verificationForm.qualifiedIndices.includes(
                                              index
                                            )
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className={
                                            verificationForm.qualifiedIndices.includes(
                                              index
                                            )
                                              ? "bg-gray-900 hover:bg-gray-800 text-white"
                                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                          }
                                        >
                                          {verificationForm.qualifiedIndices.includes(
                                            index
                                          ) ? (
                                            <>
                                              <Check className="w-3 h-3 mr-1" />
                                              Selected
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-3 h-3 mr-1" />
                                              Select
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {selectedAirdrop === airdrop.id &&
                              verificationForm.qualifiedIndices.length > 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-1">
                                        Ready to Distribute Rewards
                                      </h5>
                                      <p className="text-sm text-gray-600">
                                        {
                                          verificationForm.qualifiedIndices
                                            .length
                                        }{" "}
                                        participants selected •{" "}
                                        {formatETH(
                                          airdrop.perQualifier *
                                            BigInt(
                                              verificationForm.qualifiedIndices
                                                .length
                                            )
                                        )}{" "}
                                        ETH total
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        verifyAndDistribute(
                                          airdrop.id,
                                          verificationForm.qualifiedIndices
                                        );
                                      }}
                                      disabled={isDistributing}
                                      className="bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors"
                                    >
                                      {isDistributing ? (
                                        <>
                                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                                          Distributing...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4 mr-2" />
                                          Distribute Rewards
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
