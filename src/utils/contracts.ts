// Contract addresses and ABIs for Quinty V2 on Base Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";
import AirdropBountyABI from "../../contracts/AirdropBounty.json";
import ZKVerificationABI from "../../contracts/ZKVerification.json";

export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Contract addresses on Base Sepolia
export const CONTRACT_ADDRESSES = {
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D",
    QuintyNFT: "0xD49a54aFb982c0b76554e34f1A76851ed725405F",
    QuintyReputation: "0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e",
    AirdropBounty: "0x71C5f5C66e72bBFC7266429cA48ba65c38AFc6A4",
    ZKVerification: "0x045Fb080d926f049db7597c99B56aEccc8977F36",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI;
export const QUINTY_NFT_ABI = QuintyNFTABI;
export const REPUTATION_ABI = QuintyReputationABI;
export const AIRDROP_ABI = AirdropBountyABI;
export const ZK_VERIFICATION_ABI = ZKVerificationABI;

// Enums from contracts
export enum BountyStatus {
  OPREC = 0,
  OPEN = 1,
  PENDING_REVEAL = 2,
  RESOLVED = 3,
  DISPUTED = 4,
  EXPIRED = 5,
}

export enum BadgeType {
  BountyCreator = 0,
  BountySolver = 1,
  TeamMember = 2,
}

// Constants
export const MIN_VOTING_STAKE = "0.0001";
export const BASE_SEPOLIA_EXPLORER = "https://sepolia-explorer.base.org";

// Helper function to get contract address
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES[typeof BASE_SEPOLIA_CHAIN_ID]): string {
  return CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID][contractName];
}

// Helper to get explorer URL
export function getExplorerUrl(addressOrTx: string, type: 'address' | 'tx' = 'address'): string {
  return `${BASE_SEPOLIA_EXPLORER}/${type}/${addressOrTx}`;
}

