"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { QUINTY_ABI, getContractAddress, MANTLE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";
import { parseEther } from "viem";

export function useQuinty() {
    const { address } = useAccount();
    const chainId = useChainId();
    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const quintyAddress = getContractAddress("Quinty", chainId) as `0x${string}`;

    const createBounty = async (
        description: string,
        amount: string,
        deadline: number,
        allowMultipleWinners: boolean = false,
        winnerShares: number[] = [100],
        slashPercent: number = 10,
        hasOprec: boolean = false,
        oprecDeadline: number = 0
    ) => {
        return writeContract({
            address: quintyAddress,
            abi: QUINTY_ABI,
            functionName: "createBounty",
            args: [
                description,
                BigInt(deadline),
                allowMultipleWinners,
                winnerShares.map(s => BigInt(s)),
                BigInt(slashPercent),
                hasOprec,
                BigInt(oprecDeadline)
            ],
            value: parseEther(amount),
        });
    };

    const submitSolution = async (bountyId: number, ipfsCid: string, teamMembers: string[] = []) => {
        return writeContract({
            address: quintyAddress,
            abi: QUINTY_ABI,
            functionName: "submitSolution",
            args: [BigInt(bountyId), ipfsCid, teamMembers as `0x${string}`[]],
        });
    };

    const selectWinners = async (bountyId: number, winners: string[], submissionIds: number[]) => {
        return writeContract({
            address: quintyAddress,
            abi: QUINTY_ABI,
            functionName: "selectWinners",
            args: [BigInt(bountyId), winners as `0x${string}`[], submissionIds.map(id => BigInt(id))],
        });
    };

    const revealSolution = async (bountyId: number, subId: number, revealIpfsCid: string) => {
        return writeContract({
            address: quintyAddress,
            abi: QUINTY_ABI,
            functionName: "revealSolution",
            args: [BigInt(bountyId), BigInt(subId), revealIpfsCid],
        });
    };

    const getBounty = async (bountyId: number) => {
        return readContract(wagmiConfig, {
            address: quintyAddress,
            abi: QUINTY_ABI,
            functionName: "getBountyData",
            args: [BigInt(bountyId)],
        });
    };

    const getSubmissions = async (bountyId: number) => {
        const count = await readContract(wagmiConfig, {
            address: quintyAddress,
            abi: QUINTY_ABI,
            functionName: "getSubmissionCount",
            args: [BigInt(bountyId)],
        });

        const submissions = [];
        for (let i = 0; i < Number(count); i++) {
            const sub = await readContract(wagmiConfig, {
                address: quintyAddress,
                abi: QUINTY_ABI,
                functionName: "getSubmission",
                args: [BigInt(bountyId), BigInt(i)],
            });
            submissions.push(sub);
        }
        return submissions;
    };

    return {
        createBounty,
        submitSolution,
        selectWinners,
        revealSolution,
        getBounty,
        getSubmissions,
        isPending: isPending || isConfirming,
        isSuccess,
        error,
        hash,
    };
}
