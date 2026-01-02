
// Auto-generated TypeScript definitions for Quintle contracts
// Network: Mantle Sepolia

export interface ContractAddresses {
  Quinty: string;
  QuintyReputation: string;
  QuintyNFT: string;
}

// TODO: Update these addresses after deploying contracts to Mantle Sepolia
export const MANTLE_SEPOLIA_ADDRESSES: ContractAddresses = {
  Quinty: "0x0000000000000000000000000000000000000000",
  QuintyReputation: "0x0000000000000000000000000000000000000000",
  QuintyNFT: "0x0000000000000000000000000000000000000000",
};

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";
export const MANTLE_SEPOLIA_EXPLORER = "https://sepolia.mantlescan.xyz";

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
}
