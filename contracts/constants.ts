
// Auto-generated TypeScript definitions for Quinty V2 contracts
// Generated: 2025-10-11T07:56:09.659Z

export interface ContractAddresses {
  Quinty: string;
  QuintyReputation: string;
  DisputeResolver: string;
  QuintyNFT: string;
  AirdropBounty: string;
  ZKVerification: string;
  GrantProgram: string;
  LookingForGrant: string;
  Crowdfunding: string;
}

export const BASE_SEPOLIA_ADDRESSES: ContractAddresses = {
  Quinty: "0x1c52AAc4f772E2eAbcAb6A0aC7a218d3d5661d85",
  QuintyReputation: "0xeA6C17Bafa574f33f2ceCfD64E553A17444e5E94",
  DisputeResolver: "0x0000000000000000000000000000000000000000",
  QuintyNFT: "0x5f821a06cB7BBBbD3F470ebB6Cb1e43E84853B05",
  AirdropBounty: "0x920c7eCC8A9AC48B0aEb5Ea91768964208b82938",
  ZKVerification: "0x045Fb080d926f049db7597c99B56aEccc8977F36",
  GrantProgram: "0x8b0B50732CCfB6308d5A63C1F9D70166DF63b661",
  LookingForGrant: "0xcd01A6d3B8944080B3b1Bb79617415c0Ef895Cc6",
  Crowdfunding: "0x0bf8d6EB00b3C4cA6a9F1CFa6Cd40b4cE486F885"
};

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
export const BASE_SEPOLIA_EXPLORER = "https://sepolia-explorer.base.org";

export enum BountyStatus {
  OPREC = 0,
  OPEN = 1,
  PENDING_REVEAL = 2,
  RESOLVED = 3,
  EXPIRED = 4
}

export enum BadgeType {
  BountyCreator = 0,
  BountySolver = 1,
  TeamMember = 2,
  GrantGiver = 3,
  GrantRecipient = 4,
  CrowdfundingDonor = 5,
  LookingForGrantSupporter = 6
}

export enum GrantStatus {
  Open = 0,
  SelectionPhase = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4
}

export enum CampaignStatus {
  Active = 0,
  Successful = 1,
  Failed = 2,
  Completed = 3
}

export enum RequestStatus {
  Active = 0,
  Funded = 1,
  Cancelled = 2
}
