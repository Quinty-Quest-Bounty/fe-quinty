// Contract addresses and ABIs for Quinty V2 on Base Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";
import AirdropBountyABI from "../../contracts/AirdropBounty.json";


export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Contract addresses on Base Sepolia
export const CONTRACT_ADDRESSES = {
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x1c52AAc4f772E2eAbcAb6A0aC7a218d3d5661d85",
    QuintyNFT: "0x5f821a06cB7BBBbD3F470ebB6Cb1e43E84853B05",
    QuintyReputation: "0xeA6C17Bafa574f33f2ceCfD64E553A17444e5E94",
    AirdropBounty: "0x920c7eCC8A9AC48B0aEb5Ea91768964208b82938",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI;
export const QUINTY_NFT_ABI = QuintyNFTABI;
export const REPUTATION_ABI = QuintyReputationABI;
export const AIRDROP_ABI = AirdropBountyABI;

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
export const BASE_SEPOLIA_EXPLORER = "https://sepolia-explorer.base.org";

// Helper function to get contract address
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES[typeof BASE_SEPOLIA_CHAIN_ID]): string {
  return CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID][contractName];
}

// Helper to get explorer URL
export function getExplorerUrl(addressOrTx: string, type: 'address' | 'tx' = 'address'): string {
  return `${BASE_SEPOLIA_EXPLORER}/${type}/${addressOrTx}`;
}
