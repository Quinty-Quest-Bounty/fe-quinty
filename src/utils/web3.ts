import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantleSepoliaTestnet, baseSepolia, arbitrumSepolia } from "wagmi/chains";

// Fix for "indexedDB is not defined" during SSR
if (typeof window === 'undefined') {
  // @ts-ignore
  global.indexedDB = {
    open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null } as any),
  } as any;
}

export const wagmiConfig = getDefaultConfig({
  appName: "Quintle",
  // Fallback to a dummy ID to prevent build failure if env var is missing
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fcc6b4468bd933c2341d716d471ac0a",
  chains: [mantleSepoliaTestnet, baseSepolia, arbitrumSepolia],
  ssr: true,
});

// Utility functions
export const formatETH = (wei: bigint): string => {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
};

export const parseETH = (eth: string): bigint => {
  return BigInt(Math.floor(parseFloat(eth) * 1e18));
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimeLeft = (deadline: bigint): string => {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = Number(deadline) - now;

  if (timeLeft <= 0) return "Expired";

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
