import { useCallback, useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import {
    CONTRACT_ADDRESSES,
    QUINTY_ABI,
    QUEST_ABI,
    BASE_SEPOLIA_CHAIN_ID,
    ETH_ADDRESS,
    USDC_BASE_SEPOLIA,
} from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

export interface PendingBalance {
    token: string;
    symbol: string;
    decimals: number;
    amount: bigint;
}

export function useWithdrawals() {
    const { address } = useAccount();
    const [pendingBalances, setPendingBalances] = useState<PendingBalance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { writeContract, data: hash, isPending: isWithdrawing } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const loadBalances = useCallback(async () => {
        if (!address) {
            setPendingBalances([]);
            return;
        }

        setIsLoading(true);
        try {
            const tokens = [
                { address: ETH_ADDRESS, symbol: "ETH", decimals: 18 },
                { address: USDC_BASE_SEPOLIA, symbol: "USDC", decimals: 6 },
            ];

            const balances: PendingBalance[] = [];

            for (const token of tokens) {
                let total = 0n;

                // Check Quinty contract
                try {
                    const quintyBalance = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                        abi: QUINTY_ABI,
                        functionName: "pendingBalance",
                        args: [token.address as `0x${string}`, address],
                    }) as bigint;
                    total += quintyBalance;
                } catch {}

                // Check Quest contract
                try {
                    const questBalance = await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
                        abi: QUEST_ABI,
                        functionName: "pendingBalance",
                        args: [token.address as `0x${string}`, address],
                    }) as bigint;
                    total += questBalance;
                } catch {}

                if (total > 0n) {
                    balances.push({
                        token: token.address,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        amount: total,
                    });
                }
            }

            setPendingBalances(balances);
        } catch (error) {
            console.error("Error loading withdrawal balances:", error);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        loadBalances();
        const interval = setInterval(loadBalances, 15000);
        return () => clearInterval(interval);
    }, [loadBalances]);

    // Refresh after successful withdrawal
    useEffect(() => {
        if (isConfirmed) {
            loadBalances();
        }
    }, [isConfirmed, loadBalances]);

    const withdrawETH = useCallback(async (contract: "Quinty" | "Quest") => {
        const abi = contract === "Quinty" ? QUINTY_ABI : QUEST_ABI;
        writeContract({
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID][contract] as `0x${string}`,
            abi,
            functionName: "withdrawETH",
        });
    }, [writeContract]);

    const withdrawToken = useCallback(async (contract: "Quinty" | "Quest", tokenAddress: string) => {
        const abi = contract === "Quinty" ? QUINTY_ABI : QUEST_ABI;
        writeContract({
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID][contract] as `0x${string}`,
            abi,
            functionName: "withdrawToken",
            args: [tokenAddress as `0x${string}`],
        });
    }, [writeContract]);

    // Convenience: withdraw all of a given token from both contracts
    const withdrawAll = useCallback(async (tokenAddress: string) => {
        if (tokenAddress === ETH_ADDRESS) {
            // Try Quinty first
            try {
                const quintyBal = await readContract(wagmiConfig, {
                    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                    abi: QUINTY_ABI,
                    functionName: "pendingBalance",
                    args: [ETH_ADDRESS as `0x${string}`, address!],
                }) as bigint;
                if (quintyBal > 0n) {
                    withdrawETH("Quinty");
                    return;
                }
            } catch {}
            // Then Quest
            withdrawETH("Quest");
        } else {
            try {
                const quintyBal = await readContract(wagmiConfig, {
                    address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
                    abi: QUINTY_ABI,
                    functionName: "pendingBalance",
                    args: [tokenAddress as `0x${string}`, address!],
                }) as bigint;
                if (quintyBal > 0n) {
                    withdrawToken("Quinty", tokenAddress);
                    return;
                }
            } catch {}
            withdrawToken("Quest", tokenAddress);
        }
    }, [address, withdrawETH, withdrawToken]);

    const hasPendingBalance = pendingBalances.length > 0;

    return {
        pendingBalances,
        hasPendingBalance,
        isLoading,
        isWithdrawing,
        isConfirming,
        isConfirmed,
        withdrawAll,
        withdrawETH,
        withdrawToken,
        refetch: loadBalances,
    };
}
