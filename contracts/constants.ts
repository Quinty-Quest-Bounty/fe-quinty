
// Auto-generated TypeScript definitions for Quintle contracts
// Network: Mantle Sepolia

export interface ContractAddresses {
  Quinty: string;
  QuintyReputation: string;
  QuintyNFT: string;
}

// Mantle Sepolia
export const MANTLE_SEPOLIA_ADDRESSES: ContractAddresses = {
  Quinty: "0x0000000000000000000000000000000000000000",
  QuintyReputation: "0x0000000000000000000000000000000000000000",
  QuintyNFT: "0x0000000000000000000000000000000000000000",
};

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";
export const MANTLE_SEPOLIA_EXPLORER = "https://sepolia.mantlescan.xyz";

// Base Sepolia
export const BASE_SEPOLIA_ADDRESSES: ContractAddresses = {
  Quinty: "0xdB5e489C756D4D2028CCb3515c04DaD134AB03c7",
  QuintyReputation: "0xD4c6d0fBe9A1F11e7b6A23E5F857C020B89f0763",
  QuintyNFT: "0xAFbe103C60cE8317a1244d5cb374a065A7550F34",
};

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
export const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";

export const getAddresses = (chainId: number): ContractAddresses => {
  if (chainId === BASE_SEPOLIA_CHAIN_ID) return BASE_SEPOLIA_ADDRESSES;
  return MANTLE_SEPOLIA_ADDRESSES;
};

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
