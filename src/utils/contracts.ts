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
    Quinty: "0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D",
    QuintyNFT: "0xD49a54aFb982c0b76554e34f1A76851ed725405F",
    QuintyReputation: "0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e",
    DisputeResolver: "0x961659d12E9dE91dC543A75911b3b0D269769E82",
    AirdropBounty: "0x71C5f5C66e72bBFC7266429cA48ba65c38AFc6A4",
    ZKVerification: "0x045Fb080d926f049db7597c99B56aEccc8977F36",
    GrantProgram: "0x8b0B50732CCfB6308d5A63C1F9D70166DF63b661",
    LookingForGrant: "0xcd01A6d3B8944080B3b1Bb79617415c0Ef895Cc6",
    Crowdfunding: "0x0bf8d6EB00b3C4cA6a9F1CFa6Cd40b4cE486F885",
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
