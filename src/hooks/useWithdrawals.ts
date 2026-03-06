// V2 contracts use push-based payments (direct transfers), not pull-based withdrawals.
// This hook is a no-op stub that preserves the interface for any consumers.

export interface PendingBalance {
    token: string;
    symbol: string;
    decimals: number;
    amount: bigint;
}

export function useWithdrawals() {
    return {
        pendingBalances: [] as PendingBalance[],
        hasPendingBalance: false,
        isLoading: false,
        isWithdrawing: false,
        isConfirming: false,
        isConfirmed: false,
        withdrawAll: async (_tokenAddress: string) => {},
        withdrawETH: async (_contract: "Quinty" | "Quest") => {},
        withdrawToken: async (_contract: "Quinty" | "Quest", _tokenAddress: string) => {},
        refetch: async () => {},
    };
}
