"use client";

import React from "react";
import { useWithdrawals } from "../hooks/useWithdrawals";
import { formatTokenAmount } from "../utils/contracts";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export function WithdrawalBanner() {
    const { pendingBalances, hasPendingBalance, isWithdrawing, isConfirming, withdrawAll } = useWithdrawals();

    if (!hasPendingBalance) return null;

    return (
        <div className="bg-emerald-50 border-b border-emerald-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600 font-medium">Pending withdrawals:</span>
                    <div className="flex items-center gap-3">
                        {pendingBalances.map((bal) => (
                            <span key={bal.token} className="font-semibold text-emerald-800">
                                {formatTokenAmount(bal.amount, bal.token)} {bal.symbol}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pendingBalances.map((bal) => (
                        <Button
                            key={bal.token}
                            size="sm"
                            onClick={() => withdrawAll(bal.token)}
                            disabled={isWithdrawing || isConfirming}
                            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isWithdrawing || isConfirming ? (
                                <Loader2 className="size-3 animate-spin mr-1" />
                            ) : null}
                            Withdraw {bal.symbol}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
