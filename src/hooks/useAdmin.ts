import { useMemo } from "react";
import { useAccount } from "wagmi";

export function useAdmin() {
  const { address } = useAccount();

  const isAdmin = useMemo(() => {
    if (!address) return false;
    const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    return adminWallets.includes(address.toLowerCase());
  }, [address]);

  return { isAdmin };
}
