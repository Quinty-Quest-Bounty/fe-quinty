import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, REPUTATION_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface UserStatsData {
    bountiesCreated: number;
    submissions: number;
    wins: number;
}

export interface UserAchievements {
    achievements: number[];
    tokenIds: number[];
}

export interface UserProfile {
    address: string;
    stats: UserStatsData;
    achievements: UserAchievements;
}

export function useReputation(targetAddress?: string) {
    const { address: connectedAddress, isConnected } = useAccount();
    const address = targetAddress || connectedAddress;

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { data: userStats, refetch: refetchStats } = useReadContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].QuintyReputation as `0x${string}`,
        abi: REPUTATION_ABI,
        functionName: "getUserStats",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const { data: userAchievements, refetch: refetchAchievements } = useReadContract({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].QuintyReputation as `0x${string}`,
        abi: REPUTATION_ABI,
        functionName: "getUserAchievements",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const loadProfile = useCallback(() => {
        if (address && userStats && userAchievements) {
            const achievementsArray = userAchievements as any[];
            const stats = {
                bountiesCreated: Number((userStats as any)?.totalBountiesCreated || 0),
                submissions: Number((userStats as any)?.totalSubmissions || 0),
                wins: Number((userStats as any)?.totalWins || 0),
            };

            const achievements = {
                achievements: achievementsArray[0] ? achievementsArray[0].map((a: any) => Number(a)) : [],
                tokenIds: achievementsArray[1] ? achievementsArray[1].map((t: any) => Number(t)) : [],
            };

            setUserProfile({ address, stats, achievements });
            setIsLoading(false);
        } else if (!address) {
            setIsLoading(false);
        }
    }, [address, userStats, userAchievements]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useWatchContractEvent({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].QuintyReputation as `0x${string}`,
        abi: REPUTATION_ABI,
        eventName: "AchievementUnlocked",
        onLogs() {
            refetchStats();
            refetchAchievements();
        },
    });

    return { userProfile, isLoading, refetch: () => { refetchStats(); refetchAchievements(); } };
}
