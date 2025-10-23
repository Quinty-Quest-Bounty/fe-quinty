import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "Quinty",
      preference: "smartWalletOnly",
    }),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
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
