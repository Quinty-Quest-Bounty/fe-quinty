// Contract addresses and ABIs for Quinty V2 on Base Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";
import QuestABI from "../../contracts/Quest.json";
import ZKVerificationABI from "../../contracts/ZKVerification.json";

// Legacy import for backward compatibility
import AirdropBountyABI from "../../contracts/AirdropBounty.json";

export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Contract addresses on Base Sepolia
// NOTE: These will be updated after new deployment
export const CONTRACT_ADDRESSES = {
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0xdB6511DC9869a10Ed00C3706Ff9332820db87463",
    QuintyNFT: "0xDe5eB0e3232B40ED445E94f33708dc7E425E84F8",
    QuintyReputation: "0xE84dA988177707e9e8371894C082049D2C4F5e5e",
    Quest: "0xFeFAB11BA3Bc2d74B8B4804044f39A12E55BE4ae",
    AirdropBounty: "0xFeFAB11BA3Bc2d74B8B4804044f39A12E55BE4ae", // Legacy alias
    ZKVerification: "0x045Fb080d926f049db7597c99B56aEccc8977F36",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI;
export const QUINTY_NFT_ABI = QuintyNFTABI;
export const REPUTATION_ABI = QuintyReputationABI;
export const QUEST_ABI = QuestABI;
export const AIRDROP_ABI = AirdropBountyABI; // Legacy
export const ZK_VERIFICATION_ABI = ZKVerificationABI;

// Bounty Status Enum (incuBase milestone - phases)
export enum BountyStatus {
  OPEN = 0,      // Accepting submissions (before openDeadline)
  JUDGING = 1,   // Creator judging submissions (before judgingDeadline)
  RESOLVED = 2,  // Winner selected and paid
  SLASHED = 3,   // Creator slashed for not selecting winner
}

// Quest Entry Status Enum
export enum QuestEntryStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
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
