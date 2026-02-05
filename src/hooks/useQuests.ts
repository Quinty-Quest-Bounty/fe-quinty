import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWatchContractEvent } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface Quest {
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
    imageUrl: string;
}

export interface Entry {
    solver: string;
    ipfsProofCid: string;
    socialHandle: string;
    timestamp: number;
    status: number; // 0: Pending, 1: Approved, 2: Rejected
    feedback: string;
}

export function useQuests() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [entryCounts, setEntryCounts] = useState<{ [questId: number]: number }>({});
    const [isLoading, setIsLoading] = useState(true);

    const { data: questCounter, refetch: refetchCounter } = useReadContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
        abi: QUEST_ABI,
        functionName: "questCounter",
    });

    const loadQuests = useCallback(async () => {
        if (questCounter === undefined) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const counter = Number(questCounter);
            const questPromises = Array.from({ length: counter }, (_, i) => {
                const id = i + 1;
                return (async () => {
                    try {
                        const questData = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                            abi: QUEST_ABI,
                            functionName: "getQuest",
                            args: [BigInt(id)],
                        });

                        if (!questData) return null;

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
                        ] = questData as any;

                        const entryCount = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                            abi: QUEST_ABI,
                            functionName: "getEntryCount",
                            args: [BigInt(id)],
                        });

                        return {
                            quest: {
                                id,
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
                                    ? description.match(/ipfs:\/\/[^\s\n]+/)?.[0] || ""
                                    : "",
                            },
                            entryCount: Number(entryCount),
                        };
                    } catch (e) {
                        console.error(`Error loading quest ${id}`, e);
                        return null;
                    }
                })();
            });

            const results = await Promise.all(questPromises);
            const validResults = results.filter((r): r is { quest: Quest; entryCount: number } => r !== null);

            setQuests(validResults.map(r => r.quest).reverse());
            const counts: { [id: number]: number } = {};
            validResults.forEach(r => {
                counts[r.quest.id] = r.entryCount;
            });
            setEntryCounts(counts);
        } catch (error) {
            console.error("Error loading quests", error);
        } finally {
            setIsLoading(false);
        }
    }, [questCounter]);

    useEffect(() => {
        loadQuests();
    }, [loadQuests]);

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
        abi: QUEST_ABI,
        eventName: "QuestCreated",
        onLogs() {
            refetchCounter();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
        abi: QUEST_ABI,
        eventName: "EntrySubmitted",
        onLogs() {
            loadQuests();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
        abi: QUEST_ABI,
        eventName: "EntryVerified",
        onLogs() {
            loadQuests();
        },
    });

    return { quests, entryCounts, isLoading, refetch: loadQuests };
}
