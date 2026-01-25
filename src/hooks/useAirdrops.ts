import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWatchContractEvent } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, AIRDROP_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface Airdrop {
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

export interface Entry {
    solver: string;
    ipfsProofCid: string;
    timestamp: number;
    status: number; // 0: Pending, 1: Approved, 2: Rejected
    feedback: string;
}

export function useAirdrops() {
    const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
    const [entryCounts, setEntryCounts] = useState<{ [airdropId: number]: number }>({});
    const [isLoading, setIsLoading] = useState(true);

    const { data: airdropCounter, refetch: refetchCounter } = useReadContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        functionName: "airdropCounter",
    });

    const loadAirdrops = useCallback(async () => {
        if (airdropCounter === undefined) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const counter = Number(airdropCounter);
            const airdropPromises = Array.from({ length: counter }, (_, i) => {
                const id = i + 1;
                return (async () => {
                    try {
                        const airdropData = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                            abi: AIRDROP_ABI,
                            functionName: "getAirdrop",
                            args: [BigInt(id)],
                        });

                        if (!airdropData) return null;

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

                        const entryCount = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
                            abi: AIRDROP_ABI,
                            functionName: "getEntryCount",
                            args: [BigInt(id)],
                        });

                        return {
                            airdrop: {
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
                                    ? description.match(/ipfs:\/\/[^\s\n]+/)?.[0]
                                    : undefined,
                            },
                            entryCount: Number(entryCount),
                        };
                    } catch (e) {
                        console.error(`Error loading airdrop ${id}`, e);
                        return null;
                    }
                })();
            });

            const results = await Promise.all(airdropPromises);
            const validResults = results.filter((r): r is { airdrop: Airdrop; entryCount: number } => r !== null);

            setAirdrops(validResults.map(r => r.airdrop).reverse());
            const counts: { [id: number]: number } = {};
            validResults.forEach(r => {
                counts[r.airdrop.id] = r.entryCount;
            });
            setEntryCounts(counts);
        } catch (error) {
            console.error("Error loading airdrops", error);
        } finally {
            setIsLoading(false);
        }
    }, [airdropCounter]);

    useEffect(() => {
        loadAirdrops();
    }, [loadAirdrops]);

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        eventName: "AirdropCreated",
        onLogs() {
            refetchCounter();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].AirdropBounty as `0x${string}`,
        abi: AIRDROP_ABI,
        eventName: "EntrySubmitted",
        onLogs() {
            loadAirdrops();
        },
    });

    return { airdrops, entryCounts, isLoading, refetch: loadAirdrops };
}
