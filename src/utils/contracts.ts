// Contract addresses and ABIs for Quintle on Mantle Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

// Contract addresses on Mantle Sepolia
// TODO: Update these addresses after deploying contracts to Mantle Sepolia
export const CONTRACT_ADDRESSES = {
  [MANTLE_SEPOLIA_CHAIN_ID]: {
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

// Constants
export const MANTLE_SEPOLIA_EXPLORER = "https://sepolia.mantlescan.xyz";

// Helper function to get contract address
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES[typeof MANTLE_SEPOLIA_CHAIN_ID]): string {
  return CONTRACT_ADDRESSES[MANTLE_SEPOLIA_CHAIN_ID][contractName];
}

// Helper to get explorer URL
export function getExplorerUrl(addressOrTx: string, type: 'address' | 'tx' = 'address'): string {
  return `${MANTLE_SEPOLIA_EXPLORER}/${type}/${addressOrTx}`;
}
