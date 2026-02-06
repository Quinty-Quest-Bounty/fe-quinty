import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, QUINTY_ABI, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface Transaction {
    id: string;
    type: "bounty_created" | "bounty_submitted" | "bounty_won" | "bounty_revealed" | "bounty_replied" | "quest_created" | "quest_submitted";
    contractType: "Quinty" | "Quest";
    itemId: number;
    amount?: bigint;
    timestamp: bigint;
    status: string;
    description: string;
}

export function useHistory() {
    const { address } = useAccount();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        if (!address) {
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
                            functionName: "getBountyData",
                            args: [BigInt(id)],
                        });

                        const [creator, description, amount, deadline, , , status] = bountyData as any;

                        if (creator.toLowerCase() === address.toLowerCase()) {
                            allTransactions.push({
                                id: `bounty-created-${id}`,
                                type: "bounty_created",
                                contractType: "Quinty",
                                itemId: id,
                                amount: amount,
                                timestamp: deadline, // Using deadline as proxy if createdAt not available
                                status: status === 3 ? "Resolved" : "Active",
                                description: description.split("\n")[0] || `Bounty #${id}`,
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
                                    timestamp: deadline,
                                    status: subData.revealed ? "Revealed" : "Submitted",
                                    description: description.split("\n")[0] || `Bounty #${id}`,
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

                        const [creator, title, , totalReward, , , , createdAt] = quest;

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
                    } catch (e) {
                        console.error(e);
                    }
                })();
            });

            await Promise.all([...bountyPromises, ...questPromises]);
            allTransactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
            setTransactions(allTransactions);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return { transactions, isLoading, refetch: loadHistory };
}
