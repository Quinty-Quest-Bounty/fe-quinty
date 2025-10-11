// Contract addresses and ABIs for Quinty V2 on Base Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";
import DisputeResolverABI from "../../contracts/DisputeResolver.json";
import AirdropBountyABI from "../../contracts/AirdropBounty.json";
import ZKVerificationABI from "../../contracts/ZKVerification.json";
import GrantProgramABI from "../../contracts/GrantProgram.json";
import LookingForGrantABI from "../../contracts/LookingForGrant.json";
import CrowdfundingABI from "../../contracts/Crowdfunding.json";

export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Contract addresses on Base Sepolia
export const CONTRACT_ADDRESSES = {
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x7169c907F80f95b20232F5B979B1Aac392bD282a",
    QuintyNFT: "0x80edb4Aeb39913FaFfDAC2a86F3184508B57AAe2",
    QuintyReputation: "0x2dc731f796Df125B282484E844485814B2DCd363",
    DisputeResolver: "0xF04b0Ec52bFe602D0D38bEA4f613ABb7cFA79FB5",
    AirdropBounty: "0x79dAe15C3612854F6bd025f7CDc6D4CDEE289049",
    ZKVerification: "0xe3cd834a963B3A6A550aed05ece2535B02C83E3a",
    GrantProgram: "0xf70fBEba52Cc2A6F1e511179A10BdB4B820c7879",
    LookingForGrant: "0x423fb3E158B8bA79Fabbd387dAEb844DC0709BeF",
    Crowdfunding: "0x64aC0a7A52f3E0a414D8344f6A4620b51dFfB6C2",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI;
export const QUINTY_NFT_ABI = QuintyNFTABI;
export const REPUTATION_ABI = QuintyReputationABI;
export const DISPUTE_ABI = DisputeResolverABI;
export const AIRDROP_ABI = AirdropBountyABI;
export const ZK_VERIFICATION_ABI = ZKVerificationABI;
export const GRANT_PROGRAM_ABI = GrantProgramABI;
export const LOOKING_FOR_GRANT_ABI = LookingForGrantABI;
export const CROWDFUNDING_ABI = CrowdfundingABI;

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
  GrantGiver = 3,
  GrantRecipient = 4,
  CrowdfundingDonor = 5,
  LookingForGrantSupporter = 6,
}

export enum GrantStatus {
  Open = 0,
  SelectionPhase = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum CampaignStatus {
  Active = 0,
  Successful = 1,
  Failed = 2,
  Completed = 3,
}

export enum RequestStatus {
  Active = 0,
  Funded = 1,
  Cancelled = 2,
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
