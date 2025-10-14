import { createConfig, http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Define Base Sepolia Testnet
const baseSepoliaChain = defineChain({
  id: 84532,
  name: "Base Sepolia",
  network: "base-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    public: { http: ["https://sepolia.base.org"] },
    default: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: {
      name: "Base Sepolia Explorer",
      url: "https://sepolia-explorer.base.org",
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Quinty V2",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [baseSepoliaChain],
  transports: {
    [baseSepoliaChain.id]: http(),
  },
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
