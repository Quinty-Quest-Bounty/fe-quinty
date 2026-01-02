import { BountyMetadata } from "./ipfs";

// Mock IPFS metadata for bounties
export const mockMetadata: { [key: string]: BountyMetadata } = {
  "QmExample1": {
    title: "Build a DeFi Dashboard with Real-time Charts",
    description: "Create a comprehensive DeFi dashboard that displays real-time cryptocurrency prices, portfolio tracking, and transaction history. The dashboard should be responsive and work on mobile devices.",
    requirements: [
      "Use React 18+ with TypeScript",
      "Integrate with CoinGecko API for price data",
      "Implement responsive design with Tailwind CSS",
      "Add dark mode support",
      "Include unit tests with Jest"
    ],
    deliverables: [
      "GitHub repository with complete source code",
      "Live demo deployed on Vercel or Netlify",
      "Documentation in README.md",
      "Video walkthrough (2-3 minutes)"
    ],
    skills: ["React", "TypeScript", "Tailwind CSS", "API Integration", "Testing"],
    images: ["/images/bounty-example.png"], // Local image path
    deadline: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
    bountyType: "development"
  }
};

// Mock bounty data - single example
export const mockBounties = [
  {
    id: 999, // Special ID for example bounty
    creator: "0x1234567890123456789012345678901234567890",
    description: "Build a DeFi Dashboard with Real-time Charts\n\nMetadata: ipfs://QmExample1",
    amount: BigInt("2500000000000000000"), // 2.5 MNT
    deadline: BigInt(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)), // 7 days from now
    allowMultipleWinners: false,
    winnerShares: [],
    status: 1, // OPEN
    slashPercent: BigInt(3000), // 30%
    submissions: [],
    selectedWinners: [],
    selectedSubmissionIds: [],
    metadataCid: "QmExample1",
    hasOprec: false,
    oprecDeadline: BigInt(0),
  }
];

// Helper function to get the example bounty
export function getExampleBounty() {
  return mockBounties[0];
}

// Helper function to get metadata for a bounty
export function getMockMetadata(cid: string | undefined): BountyMetadata | null {
  if (!cid) return null;
  return mockMetadata[cid] || null;
}

// Helper to check if using mock data (when not connected or no real bounties)
export function shouldUseMockData(isConnected: boolean, hasBounties: boolean): boolean {
  return !isConnected || !hasBounties;
}
