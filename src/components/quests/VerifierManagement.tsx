"use client";

import React, { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, QUEST_ABI, BASE_SEPOLIA_CHAIN_ID } from "../../utils/contracts";
import { WalletName } from "../WalletName";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Shield, Plus, Trash2, Loader2 } from "lucide-react";

interface VerifierManagementProps {
    questId: number;
    verifiers: string[];
    onUpdate: () => void;
}

function isValidAddress(addr: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function VerifierManagement({ questId, verifiers, onUpdate }: VerifierManagementProps) {
    const [newVerifier, setNewVerifier] = useState("");
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    React.useEffect(() => {
        if (isConfirmed) {
            setNewVerifier("");
            onUpdate();
        }
    }, [isConfirmed, onUpdate]);

    const handleAdd = () => {
        if (!isValidAddress(newVerifier)) return;
        writeContract({
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
            abi: QUEST_ABI,
            functionName: "addVerifier",
            args: [BigInt(questId), newVerifier as `0x${string}`],
        });
    };

    const handleRemove = (verifier: string) => {
        writeContract({
            address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quest as `0x${string}`,
            abi: QUEST_ABI,
            functionName: "removeVerifier",
            args: [BigInt(questId), verifier as `0x${string}`],
        });
    };

    return (
        <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 mb-3">
                <Shield className="size-4 text-violet-500" />
                Delegated Verifiers
            </h3>

            {/* Verifier List */}
            {verifiers.length > 0 ? (
                <div className="space-y-2 mb-3">
                    {verifiers.map((v) => (
                        <div key={v} className="flex items-center justify-between p-2 bg-stone-50 border border-stone-100">
                            <span className="text-sm text-stone-700">
                                <WalletName address={v} />
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(v)}
                                disabled={isPending || isConfirming}
                                className="size-7 text-stone-400 hover:text-red-500"
                            >
                                <Trash2 className="size-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-stone-400 mb-3">No delegated verifiers. Only you can verify entries.</p>
            )}

            {/* Add Verifier */}
            <div className="flex gap-2">
                <Input
                    placeholder="0x..."
                    value={newVerifier}
                    onChange={(e) => setNewVerifier(e.target.value)}
                    className="flex-1 h-9 text-sm border-stone-200"
                />
                <Button
                    onClick={handleAdd}
                    disabled={!isValidAddress(newVerifier) || isPending || isConfirming}
                    size="sm"
                    className="h-9 bg-violet-600 hover:bg-violet-700 text-white"
                >
                    {isPending || isConfirming ? (
                        <Loader2 className="size-3 animate-spin" />
                    ) : (
                        <Plus className="size-3" />
                    )}
                </Button>
            </div>
        </div>
    );
}
