"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import {
 CONTRACT_ADDRESSES,
 QUINTY_ABI,
 MANTLE_SEPOLIA_CHAIN_ID,
} from "../../utils/contracts";
import { formatETH, wagmiConfig } from "../../utils/web3";
import {
 Target,
 Calendar,
 Coins,
 ExternalLink,
 Clock,
 Loader2,
 Trophy,
} from "lucide-react";

interface Transaction {
 id: string;
 type: "bounty_created" | "bounty_submitted" | "bounty_won" | "bounty_revealed" | "bounty_replied";
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

 // Load Bounty transactions
 try {
  const bountyCounter = await readContract(wagmiConfig, {
  address: CONTRACT_ADDRESSES[MANTLE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
  abi: QUINTY_ABI,
  functionName: "bountyCounter",
  });
  const bountyCount = Number(bountyCounter);

  for (let i = 1; i <= bountyCount; i++) {
  try {
  const bountyData = await readContract(wagmiConfig, {
   address: CONTRACT_ADDRESSES[MANTLE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
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
  ] = bountyData as any;

  // Check if user created this bounty
  if (creator.toLowerCase() === address.toLowerCase()) {
   allTransactions.push({
   id: `bounty-created-${i}`,
   type: "bounty_created",
   itemId: i,
   amount: amount,
   timestamp: deadline,
   status: status === 3 ? "Resolved" : status === 1 ? "Open" : status === 0 ? "OPREC" : status === 2 ? "Pending Reveal" : "Active",
   description: description.split("\n")[0] || `Bounty #${i}`,
   });
  }

  // Get submissions
  const submissionCount = await readContract(wagmiConfig, {
   address: CONTRACT_ADDRESSES[MANTLE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
   abi: QUINTY_ABI,
   functionName: "getSubmissionCount",
   args: [BigInt(i)],
  });

  for (let subIdx = 0; subIdx < Number(submissionCount); subIdx++) {
   try {
   const submissionData = await readContract(wagmiConfig, {
   address: CONTRACT_ADDRESSES[MANTLE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
   abi: QUINTY_ABI,
   functionName: "getSubmissionStruct",
   args: [BigInt(i), BigInt(subIdx)],
   });

   const sub = submissionData as any;

   if (sub.solver.toLowerCase() === address.toLowerCase()) {
   allTransactions.push({
    id: `bounty-submitted-${i}-${subIdx}`,
    type: "bounty_submitted",
    itemId: i,
    amount: sub.deposit,
    timestamp: sub.submittedAt || deadline,
    status: sub.revealed ? "Revealed" : "Submitted",
    description: description.split("\n")[0] || `Bounty #${i}`,
   });

   if (sub.selected) {
    allTransactions.push({
    id: `bounty-won-${i}-${subIdx}`,
    type: "bounty_won",
    itemId: i,
    amount: amount,
    timestamp: sub.submittedAt || deadline,
    status: "Won",
    description: description.split("\n")[0] || `Bounty #${i}`,
    });
   }

   if (sub.revealed) {
    allTransactions.push({
    id: `bounty-revealed-${i}-${subIdx}`,
    type: "bounty_revealed",
    itemId: i,
    timestamp: sub.revealedAt || sub.submittedAt || deadline,
    status: "Revealed",
    description: description.split("\n")[0] || `Bounty #${i}`,
    });
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

 allTransactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
 setTransactions(allTransactions);
 } catch (error) {
 console.error("Error loading transaction history:", error);
 } finally {
 setIsLoading(false);
 }
 };

 const getTransactionColor = (type: Transaction["type"]) => {
 if (type.includes("created")) return "bg-blue-500";
 if (type.includes("submitted")) return "bg-purple-500";
 if (type.includes("won")) return "bg-green-500";
 if (type.includes("revealed")) return "bg-emerald-500";
 if (type.includes("replied")) return "bg-cyan-500";
 return "bg-gray-500";
 };

 const getTransactionBg = (type: Transaction["type"]) => {
 if (type.includes("created")) return "bg-blue-50";
 if (type.includes("submitted")) return "bg-purple-50";
 if (type.includes("won")) return "bg-green-50";
 if (type.includes("revealed")) return "bg-emerald-50";
 if (type.includes("replied")) return "bg-cyan-50";
 return "bg-gray-50";
 };

 const getTransactionLabel = (type: Transaction["type"]) => {
 const labels: Record<Transaction["type"], string> = {
 bounty_created: "Created Bounty",
 bounty_submitted: "Submitted to Bounty",
 bounty_won: "Won Bounty",
 bounty_revealed: "Revealed Solution",
 bounty_replied: "Replied to Submission",
 };
 return labels[type];
 };

 if (!address) {
 return (
 <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative flex items-center justify-center p-4">
  <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
  <div className="text-center border-2 border-gray-900 bg-white p-12 max-w-md relative z-10">
  <div className="w-20 h-20 mx-auto mb-4 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
   <Clock className="w-10 h-10 text-white" />
  </div>
  <h2 className="text-2xl font-black mb-3 uppercase tracking-tight">CONNECT YOUR WALLET</h2>
  <p className="text-sm font-mono text-gray-600 uppercase tracking-wider">
  Please connect your wallet to view transaction history
  </p>
  </div>
 </div>
 );
 }

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative flex items-center justify-center p-4">
  <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
  <div className="text-center border-2 border-gray-900 bg-white p-12 max-w-md relative z-10">
  <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
  <p className="text-sm font-mono text-gray-600 mt-6 uppercase tracking-wider">Loading transaction history...</p>
  </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
 {/* Grid Background */}
 <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />

 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-6 sm:pb-8 relative z-10">
  {/* Page Header - Brutalist */}
  <div className="mb-8">
  <div className="flex items-center gap-4 mb-6">
   <div className="w-12 h-12 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
   <Clock className="w-6 h-6 text-white" />
   </div>
   <div>
   <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tight leading-none">
    HISTORY
   </h1>
   <p className="text-sm font-mono text-gray-600 mt-1 uppercase tracking-wider">
    ALL YOUR BOUNTY TRANSACTIONS
   </p>
   </div>
  </div>
  {/* Horizontal accent line */}
  <div className="h-1 w-32 bg-blue-500" />
  </div>

  {/* Stats Grid - Brutalist */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  {/* Total Transactions */}
  <div className="border-2 border-gray-900 bg-white p-4">
   <div className="flex items-center gap-2 mb-3">
   <Target className="h-4 w-4 text-blue-600" />
   <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider font-bold">
    Total Transactions
   </p>
   </div>
   <p className="text-3xl font-black text-gray-900">{transactions.length}</p>
  </div>

  {/* Bounties Won */}
  <div className="border-2 border-gray-900 bg-green-50 p-4">
   <div className="flex items-center gap-2 mb-3">
   <Trophy className="h-4 w-4 text-green-600" />
   <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider font-bold">
    Bounties Won
   </p>
   </div>
   <p className="text-3xl font-black text-green-600">
   {transactions.filter((tx) => tx.type === "bounty_won").length}
   </p>
  </div>

  {/* Bounties Created */}
  <div className="border-2 border-gray-900 bg-blue-50 p-4">
   <div className="flex items-center gap-2 mb-3">
   <Target className="h-4 w-4 text-blue-600" />
   <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider font-bold">
    Bounties Created
   </p>
   </div>
   <p className="text-3xl font-black text-blue-600">
   {transactions.filter((tx) => tx.type === "bounty_created").length}
   </p>
  </div>
  </div>

  {transactions.length === 0 ? (
  <div className="text-center py-16 border-2 border-dashed border-gray-300 bg-gray-50">
   <div className="w-20 h-20 mx-auto mb-4 bg-white border-2 border-gray-900 flex items-center justify-center">
   <Clock className="w-10 h-10 text-gray-400" />
   </div>
   <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
   NO TRANSACTIONS FOUND
   </h3>
   <p className="text-sm text-gray-600 font-mono mb-6 uppercase tracking-wider">
   You haven't made any transactions yet
   </p>
   <button
   onClick={() => router.push("/bounties")}
   className="px-6 py-3 border-2 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-all font-mono text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
   >
   <Target className="w-4 h-4" />
   EXPLORE BOUNTIES
   </button>
  </div>
  ) : (
  <div className="space-y-3">
  {transactions.map((tx) => {
   const colorClass = getTransactionColor(tx.type);
   const bgClass = getTransactionBg(tx.type);

   return (
   <div
   key={tx.id}
   onClick={() => router.push(`/bounties/${tx.itemId}`)}
   className="group border-2 border-gray-900 bg-white hover:border-blue-500 transition-all cursor-pointer"
   >
    <div className="p-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-4 flex-1 min-w-0">
     {/* Icon Box */}
     <div className={`w-12 h-12 border-2 border-gray-900 ${colorClass} flex items-center justify-center`}>
     <Target className="h-5 w-5 text-white" />
     </div>

     {/* Content */}
     <div className="flex-1 min-w-0">
     <div className="flex items-center gap-2 mb-1">
      <h3 className="font-black text-sm uppercase tracking-tight truncate">
      {getTransactionLabel(tx.type)}
      </h3>
      <div className={`px-2 py-0.5 border border-gray-900 ${bgClass} font-mono text-[10px] uppercase tracking-wider font-bold`}>
      {tx.status}
      </div>
     </div>
     <p className="text-xs text-gray-600 truncate font-mono">
      {tx.description}
     </p>
     <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-gray-500 uppercase">
      <span className="flex items-center gap-1">
      <Calendar className="h-3 w-3" />
      {new Date(Number(tx.timestamp) * 1000).toLocaleDateString()}
      </span>
      {tx.amount && (
      <span className="flex items-center gap-1">
       <Coins className="h-3 w-3" />
       {formatETH(tx.amount)} MNT
      </span>
      )}
     </div>
     </div>
    </div>

    {/* Arrow Icon */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
     <ExternalLink className="h-5 w-5 text-blue-500" />
    </div>
    </div>
   </div>
   );
  })}
  </div>
  )}
 </div>
 </div>
 );
}
