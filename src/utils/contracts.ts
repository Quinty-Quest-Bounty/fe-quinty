// Contract addresses and ABIs for Quinty V3 on Base Sepolia
import QuintyABI from "../../contracts/Quinty.json";
import QuintyNFTABI from "../../contracts/QuintyNFT.json";
import QuintyReputationABI from "../../contracts/QuintyReputation.json";
import QuestABI from "../../contracts/Quest.json";
import ZKVerificationABI from "../../contracts/ZKVerification.json";

export const BASE_SEPOLIA_CHAIN_ID = 84532;

// USDC on Base Sepolia (6 decimals)
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// address(0) sentinel for native ETH
export const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

// Minimal ERC-20 ABI for approve/allowance
export const ERC20_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract addresses on Base Sepolia
// Updated: 2026-02-25 - V3 deployment (multi-winner, ERC-20, pull withdrawals)
export const CONTRACT_ADDRESSES = {
  [BASE_SEPOLIA_CHAIN_ID]: {
    Quinty: "0x034cf0b72BcB1b529a2B0458275E0307CD6b5459",
    QuintyNFT: "0x6fcd78D8BB923E20B3C657C65f64A20a4a6b9884",
    QuintyReputation: "0x3Fc6d21B3AC4E419a2bEe6BeB40E00FfF2bF1014",
    Quest: "0x86cc170e725784812A31F548c434e425bc0181B1",
    ZKVerification: "0x045Fb080d926f049db7597c99B56aEccc8977F36",
  },
};

// Export ABIs
export const QUINTY_ABI = QuintyABI;
export const QUINTY_NFT_ABI = QuintyNFTABI;
export const REPUTATION_ABI = QuintyReputationABI;
export const QUEST_ABI = QuestABI;
export const ZK_VERIFICATION_ABI = ZKVerificationABI;

// Bounty Status Enum (V3 - phases)
export enum BountyStatus {
  OPEN = 0,      // Accepting submissions (before openDeadline)
  JUDGING = 1,   // Creator judging submissions (before judgingDeadline)
  RESOLVED = 2,  // Winners selected and paid
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

// Token config for UI
export const SUPPORTED_TOKENS = [
  { address: ETH_ADDRESS, symbol: "ETH", decimals: 18, name: "Ethereum" },
  { address: USDC_BASE_SEPOLIA, symbol: "USDC", decimals: 6, name: "USD Coin" },
] as const;

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

// Helper to get token info by address
export function getTokenInfo(tokenAddress: string) {
  return SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase()) || SUPPORTED_TOKENS[0];
}

// Helper to format token amount based on decimals
export function formatTokenAmount(amount: bigint, tokenAddress: string): string {
  const token = getTokenInfo(tokenAddress);
  const divisor = BigInt(10 ** token.decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(token.decimals, '0');
  // Trim trailing zeros but keep at least 2 decimal places for USDC, 4 for ETH
  const minDecimals = token.symbol === "USDC" ? 2 : 4;
  const trimmed = fractionStr.slice(0, Math.max(minDecimals, fractionStr.search(/0*$/) || minDecimals));
  return `${whole}.${trimmed}`;
}

// Helper to parse token amount string to bigint
export function parseTokenAmount(amount: string, tokenAddress: string): bigint {
  const token = getTokenInfo(tokenAddress);
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(token.decimals, "0").slice(0, token.decimals);
  return BigInt(whole || "0") * BigInt(10 ** token.decimals) + BigInt(paddedFraction);
}

// Calculate prize split for multi-winner bounties
export function calculatePrizeSplit(totalAmount: bigint, winnerCount: number): bigint[] {
  if (winnerCount <= 0) return [];
  if (winnerCount === 1) return [totalAmount];
  if (winnerCount === 2) {
    const first = totalAmount * 60n / 100n;
    return [first, totalAmount - first];
  }
  if (winnerCount === 3) {
    const first = totalAmount * 50n / 100n;
    const second = totalAmount * 30n / 100n;
    return [first, second, totalAmount - first - second];
  }
  // 4+ winners: proportional decrease, minimum 5% for last
  const shares: number[] = [];
  let remaining = 100;
  for (let i = 0; i < winnerCount; i++) {
    if (i === winnerCount - 1) {
      shares.push(remaining);
    } else {
      const share = Math.max(Math.floor(remaining * 0.4), 5);
      shares.push(share);
      remaining -= share;
    }
  }
  // Ensure minimum 5% for last
  if (shares[shares.length - 1] < 5) {
    const deficit = 5 - shares[shares.length - 1];
    shares[0] -= deficit;
    shares[shares.length - 1] = 5;
  }
  // Convert to bigint amounts
  let allocated = 0n;
  return shares.map((pct, i) => {
    if (i === shares.length - 1) return totalAmount - allocated;
    const amount = totalAmount * BigInt(pct) / 100n;
    allocated += amount;
    return amount;
  });
}
