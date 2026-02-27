"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { SUPPORTED_TOKENS, ETH_ADDRESS } from "../../utils/contracts";

interface TokenSelectorProps {
    value: string;
    onChange: (tokenAddress: string) => void;
    disabled?: boolean;
}

export function TokenSelector({ value, onChange, disabled }: TokenSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className="border-slate-200 bg-white">
                <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
                {SUPPORTED_TOKENS.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                        <span className="flex items-center gap-2">
                            <span className="text-xs font-mono">
                                {token.symbol === "ETH" ? "⟠" : "🪙"}
                            </span>
                            {token.symbol}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
