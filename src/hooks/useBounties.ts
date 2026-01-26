import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWatchContractEvent } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, QUINTY_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface Reply {
    replier: string;
    content: string;
    timestamp: bigint;
}

export interface Submission {
    solver: string;
    blindedIpfsCid: string;
    revealIpfsCid: string;
    deposit: bigint;
    replies: readonly Reply[];
    revealed: boolean;
}

export interface Bounty {
    id: number;
    creator: string;
    description: string;
    amount: bigint;
    deadline: bigint;
    allowMultipleWinners: boolean;
    winnerShares: readonly bigint[];
    status: number;
    slashPercent: bigint;
    submissions: readonly Submission[];
    selectedWinners: readonly string[];
    selectedSubmissionIds: readonly bigint[];
    metadataCid?: string;
    hasOprec?: boolean;
    oprecDeadline?: bigint;
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

            // Fetch bounties in parallel for better performance
            const bountyPromises = Array.from({ length: counter }, (_, i) => {
                const id = i + 1;
                return (async () => {
                    try {
                        const bountyData = (await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getBountyData",
                            args: [BigInt(id)],
                        })) as any[];

                        const submissionCount = await readContract(wagmiConfig, {
                            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                            abi: QUINTY_ABI,
                            functionName: "getSubmissionCount",
                            args: [BigInt(id)],
                        });

                        const submissions: Submission[] = [];
                        // For submissions, we might still need a loop, but let's keep it simple for now
                        for (let j = 0; j < Number(submissionCount); j++) {
                            const sub = (await readContract(wagmiConfig, {
                                address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                                abi: QUINTY_ABI,
                                functionName: "getSubmissionStruct",
                                args: [BigInt(id), BigInt(j)],
                            })) as Submission;
                            submissions.push(sub);
                        }

                        const description = bountyData[1];
                        const metadataMatch = description.match(/Metadata: ipfs:\/\/([a-zA-Z0-9]+)/);

                        return {
                            id,
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
                        };
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

    return { bounties, isLoading, refetch: loadBounties };
}
