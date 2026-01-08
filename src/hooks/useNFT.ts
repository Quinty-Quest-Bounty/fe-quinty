"use client";

import { useAccount, useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { QUINTY_NFT_ABI, getContractAddress } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export function useNFT() {
    const { address } = useAccount();
    const chainId = useChainId();
    const nftAddress = getContractAddress("QuintyNFT", chainId) as `0x${string}`;

    const getUserBadges = async (userAddress?: string) => {
        const target = (userAddress || address) as `0x${string}`;
        if (!target) return [];

        const badgeIds = await readContract(wagmiConfig, {
            address: nftAddress,
            abi: QUINTY_NFT_ABI,
            functionName: "getUserBadges",
            args: [target],
        }) as bigint[];

        const badges = [];
        for (const id of badgeIds) {
            const badgeData = await readContract(wagmiConfig, {
                address: nftAddress,
                abi: QUINTY_NFT_ABI,
                functionName: "badges",
                args: [id],
            });
            badges.push({ id, data: badgeData });
        }
        return badges;
    };

    return {
        getUserBadges,
    };
}
