"use client";

import { useAccount, useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { REPUTATION_ABI, getContractAddress } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export function useReputation() {
    const { address } = useAccount();
    const chainId = useChainId();
    const reputationAddress = getContractAddress("QuintyReputation", chainId) as `0x${string}`;

    const getUserStats = async (userAddress?: string) => {
        const target = (userAddress || address) as `0x${string}`;
        if (!target) return null;

        return readContract(wagmiConfig, {
            address: reputationAddress,
            abi: REPUTATION_ABI,
            functionName: "getUserStats",
            args: [target],
        });
    };

    const getAchievements = async (userAddress?: string) => {
        const target = (userAddress || address) as `0x${string}`;
        if (!target) return [];

        return readContract(wagmiConfig, {
            address: reputationAddress,
            abi: REPUTATION_ABI,
            functionName: "getUserAchievements",
            args: [target],
        });
    };

    const getLeaderboard = async () => {
        return readContract(wagmiConfig, {
            address: reputationAddress,
            abi: REPUTATION_ABI,
            functionName: "getSeasonLeaderboard",
        });
    };

    return {
        getUserStats,
        getAchievements,
        getLeaderboard,
    };
}
