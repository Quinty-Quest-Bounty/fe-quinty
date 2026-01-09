// Contract addresses and ABIs for Quintle on Mantle Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// Contract addresses on different networks
export const CONTRACT_ADDRESSES: Record<number, { Quinty: string; QuintyNFT: string; QuintyReputation: string }> = {
  [MANTLE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x0000000000000000000000000000000000000000",
    QuintyNFT: "0x0000000000000000000000000000000000000000",
    QuintyReputation: "0x0000000000000000000000000000000000000000",
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0xdB5e489C756D4D2028CCb3515c04DaD134AB03c7",
    QuintyNFT: "0xAFbe103C60cE8317a1244d5cb374a065A7550F34",
    QuintyReputation: "0xD4c6d0fBe9A1F11e7b6A23E5F857C020B89f0763",
  },
  [ARBITRUM_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x0000000000000000000000000000000000000000",
    QuintyNFT: "0x0000000000000000000000000000000000000000",
    QuintyReputation: "0x0000000000000000000000000000000000000000",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI;
export const QUINTY_NFT_ABI = QuintyNFTABI;
export const REPUTATION_ABI = QuintyReputationABI;

// Enums from contracts
export enum BountyStatus {
  OPREC = 0,
  OPEN = 1,
  PENDING_REVEAL = 2,
  RESOLVED = 3,
  EXPIRED = 4,
}

export enum BadgeType {
  BountyCreator = 0,
  BountySolver = 1,
  TeamMember = 2,
}

// Explorer URLs
export const EXPLORERS: Record<number, string> = {
  [MANTLE_SEPOLIA_CHAIN_ID]: "https://sepolia.mantlescan.xyz",
  [BASE_SEPOLIA_CHAIN_ID]: "https://sepolia.basescan.org",
  [ARBITRUM_SEPOLIA_CHAIN_ID]: "https://sepolia.arbiscan.io",
};

// Helper function to get contract address
export function getContractAddress(contractName: "Quinty" | "QuintyNFT" | "QuintyReputation", chainId: number = MANTLE_SEPOLIA_CHAIN_ID): string {
  return CONTRACT_ADDRESSES[chainId]?.[contractName] || CONTRACT_ADDRESSES[MANTLE_SEPOLIA_CHAIN_ID][contractName];
}

// Helper to get explorer URL
export function getExplorerUrl(addressOrTx: string, chainId: number = MANTLE_SEPOLIA_CHAIN_ID, type: 'address' | 'tx' = 'address'): string {
  const explorer = EXPLORERS[chainId] || EXPLORERS[MANTLE_SEPOLIA_CHAIN_ID];
  return `${explorer}/${type}/${addressOrTx}`;
}
