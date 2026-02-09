import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWatchContractEvent } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, QUINTY_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface Submission {
    submitter: string;
    ipfsCid: string;
    socialHandle: string;
    deposit: bigint;      // 1% deposit amount
    timestamp: bigint;
}

export interface Bounty {
    id: number;
    creator: string;
    title: string;
    description: string;
    amount: bigint;
    openDeadline: bigint;     // When submissions close
    judgingDeadline: bigint;  // When must select winner (or get slashed)
    slashPercent: bigint;     // 2500-5000 (25%-50% in basis points)
    status: number; // 0: OPEN, 1: JUDGING, 2: RESOLVED, 3: SLASHED
    selectedWinner: string;
    selectedSubmissionId: bigint;
    submissionCount: number;
    totalDeposits: bigint;
    submissions: Submission[];
    metadataCid?: string;
}

export function useBounties() {
    const [bounties, setBounties] = useState<Bounty[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { data: bountyCounter, refetch: refetchCounter } = useReadContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "bountyCounter",
    });

    const loadBounties = useCallback(async () => {
        if (!bountyCounter) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const loadedBounties: Bounty[] = [];
            const counter = Number(bountyCounter);

            // Fetch bounties in parallel
            const bountyPromises = Array.from({ length: counter }, (_, i) => {
                const id = i + 1;
                return (async () => {
                    try {
                        // Get bounty data
                        const bountyData = (await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getBounty",
                            args: [BigInt(id)],
                        })) as any[];

                        // Get all submissions
                        const submissions = (await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getAllSubmissions",
                            args: [BigInt(id)],
                        })) as Submission[];

                        const description = bountyData[2];
                        const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);

                        return {
                            id,
                            creator: bountyData[0],
                            title: bountyData[1],
                            description: description,
                            amount: bountyData[3],
                            openDeadline: bountyData[4],
                            judgingDeadline: bountyData[5],
                            slashPercent: bountyData[6],
                            status: Number(bountyData[7]),
                            selectedWinner: bountyData[8],
                            selectedSubmissionId: bountyData[9],
                            submissionCount: Number(bountyData[10]),
                            totalDeposits: bountyData[11],
                            submissions: submissions as Submission[],
                            metadataCid: metadataMatch ? metadataMatch[1] : undefined,
                        } as Bounty;
                    } catch (e) {
                        console.error(`Error loading bounty ${id}`, e);
                        return null;
                    }
                })();
            });

            const results = await Promise.all(bountyPromises);
            const validBounties = results.filter((b): b is Bounty => b !== null);
            setBounties(validBounties.reverse());
        } catch (error) {
            console.error("Error loading all bounties", error);
        } finally {
            setIsLoading(false);
        }
    }, [bountyCounter]);

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        eventName: "BountyCreated",
        onLogs() {
            refetchCounter();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        eventName: "SubmissionCreated",
        onLogs() {
            loadBounties();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        eventName: "WinnerSelected",
        onLogs() {
            loadBounties();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        eventName: "BountySlashed",
        onLogs() {
            loadBounties();
        },
    });

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        eventName: "BountyMovedToJudging",
        onLogs() {
            loadBounties();
        },
    });

    return { bounties, isLoading, refetch: loadBounties };
}
