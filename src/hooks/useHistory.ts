import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, QUINTY_ABI, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface Transaction {
    id: string;
    type: "bounty_created" | "bounty_submitted" | "bounty_won" | "bounty_revealed" | "bounty_replied" | "quest_created" | "quest_submitted" | "quest_approved" | "quest_rejected";
    contractType: "Quinty" | "Quest";
    itemId: number;
    amount?: bigint;
    timestamp: bigint;
    status: string;
    description: string;
}

export interface HistoryStats {
    bountySubmissions: number;
    bountyWins: number;
    bountiesCreated: number;
    questSubmissions: number;
    questApproved: number;
    questsCreated: number;
    totalSubmissions: number;
    totalWins: number;
    totalCreated: number;
}

export function useHistory() {
    const { address } = useAccount();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<HistoryStats>({
        bountySubmissions: 0,
        bountyWins: 0,
        bountiesCreated: 0,
        questSubmissions: 0,
        questApproved: 0,
        questsCreated: 0,
        totalSubmissions: 0,
        totalWins: 0,
        totalCreated: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        if (!address) {
            setTransactions([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const allTransactions: Transaction[] = [];

            // Fetch Bounty transactions
            const bountyCounter = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                abi: QUINTY_ABI,
                functionName: "bountyCounter",
            });

            const bountyCount = Number(bountyCounter);
            const bountyPromises = Array.from({ length: bountyCount }, (_, i) => {
                const id = i + 1;
                return (async () => {
                    try {
                        const bountyData = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getBounty",
                            args: [BigInt(id)],
                        });

                        const [creator, title, description, amount, openDeadline, judgingDeadline, slashPercent, status] = bountyData as any;

                        if (creator.toLowerCase() === address.toLowerCase()) {
                            allTransactions.push({
                                id: `bounty-created-${id}`,
                                type: "bounty_created",
                                contractType: "Quinty",
                                itemId: id,
                                amount: amount,
                                timestamp: openDeadline, // Using openDeadline as timestamp
                                status: status === 2 ? "Resolved" : status === 3 ? "Slashed" : "Active",
                                description: title || description.split("\n")[0] || `Bounty #${id}`,
                            });
                        }

                        const submissionCount = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getSubmissionCount",
                            args: [BigInt(id)],
                        });

                        for (let j = 0; j < Number(submissionCount); j++) {
                            const subData = await readContract(wagmiConfig, {
                                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                                abi: QUINTY_ABI,
                                functionName: "getSubmissionStruct",
                                args: [BigInt(id), BigInt(j)],
                            }) as any;

                            if (subData.solver.toLowerCase() === address.toLowerCase()) {
                                allTransactions.push({
                                    id: `bounty-submitted-${id}-${j}`,
                                    type: "bounty_submitted",
                                    contractType: "Quinty",
                                    itemId: id,
                                    amount: subData.deposit,
                                    timestamp: openDeadline,
                                    status: subData.revealed ? "Revealed" : "Submitted",
                                    description: title || description.split("\n")[0] || `Bounty #${id}`,
                                });
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                })();
            });

            // Fetch Quest transactions
            const questCounter = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                abi: QUEST_ABI,
                functionName: "questCounter",
            });

            const questPromises = Array.from({ length: Number(questCounter) }, (_, i) => {
                const id = i + 1;
                return (async () => {
                    try {
                        const quest = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                            abi: QUEST_ABI,
                            functionName: "getQuest",
                            args: [BigInt(id)],
                        }) as any;

                        const [creator, title, , totalReward, perQualifier, , , deadline, createdAt] = quest;

                        if (creator.toLowerCase() === address.toLowerCase()) {
                            allTransactions.push({
                                id: `quest-created-${id}`,
                                type: "quest_created",
                                contractType: "Quest",
                                itemId: id,
                                amount: totalReward,
                                timestamp: createdAt,
                                status: "Created",
                                description: title || `Quest #${id}`,
                            });
                        }

                        // Check for user's quest entries
                        const entryCount = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                            abi: QUEST_ABI,
                            functionName: "getEntryCount",
                            args: [BigInt(id)],
                        });

                        for (let j = 0; j < Number(entryCount); j++) {
                            const entryData = await readContract(wagmiConfig, {
                                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                                abi: QUEST_ABI,
                                functionName: "getEntry",
                                args: [BigInt(id), BigInt(j)],
                            }) as any;

                            const [solver, , , timestamp, status] = entryData;

                            if (solver.toLowerCase() === address.toLowerCase()) {
                                // Entry submitted
                                allTransactions.push({
                                    id: `quest-submitted-${id}-${j}`,
                                    type: "quest_submitted",
                                    contractType: "Quest",
                                    itemId: id,
                                    amount: perQualifier,
                                    timestamp: BigInt(timestamp),
                                    status: status === 1 ? "Approved" : status === 2 ? "Rejected" : "Pending",
                                    description: title || `Quest #${id}`,
                                });

                                // If approved, also add a "win" entry
                                if (status === 1) {
                                    allTransactions.push({
                                        id: `quest-approved-${id}-${j}`,
                                        type: "quest_approved",
                                        contractType: "Quest",
                                        itemId: id,
                                        amount: perQualifier,
                                        timestamp: BigInt(timestamp),
                                        status: "Approved",
                                        description: `Won: ${title || `Quest #${id}`}`,
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                })();
            });

            await Promise.all([...bountyPromises, ...questPromises]);
            allTransactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
            setTransactions(allTransactions);

            // Calculate stats
            const bountySubmissions = allTransactions.filter(t => t.type === "bounty_submitted").length;
            const bountyWins = allTransactions.filter(t => t.type === "bounty_won").length;
            const bountiesCreated = allTransactions.filter(t => t.type === "bounty_created").length;
            const questSubmissions = allTransactions.filter(t => t.type === "quest_submitted").length;
            const questApproved = allTransactions.filter(t => t.type === "quest_approved").length;
            const questsCreated = allTransactions.filter(t => t.type === "quest_created").length;

            setStats({
                bountySubmissions,
                bountyWins,
                bountiesCreated,
                questSubmissions,
                questApproved,
                questsCreated,
                totalSubmissions: bountySubmissions + questSubmissions,
                totalWins: bountyWins + questApproved,
                totalCreated: bountiesCreated + questsCreated,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Clear transactions when wallet disconnects
    useEffect(() => {
        if (!address) {
            setTransactions([]);
        }
    }, [address]);

    return { transactions, stats, isLoading, refetch: loadHistory };
}
