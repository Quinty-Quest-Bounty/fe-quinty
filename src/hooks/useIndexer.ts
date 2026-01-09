import { useQuery } from "@tanstack/react-query";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://127.0.0.1:42069";

async function fetchFromIndexer(query: string, variables?: any) {
  try {
    const response = await fetch(PONDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      console.error("Indexer GraphQL Errors:", result.errors);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error("Indexer Connection Error:", error);
    return null;
  }
}

export function useIndexerBounties() {
  return useQuery({
    queryKey: ["indexer-bounties"],
    queryFn: async () => {
      const data = await fetchFromIndexer(`
        query GetBounties {
          bountys(orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              creator
              amount
              deadline
              status
              description
              title
              requirements
              images
              timestamp
              hasOprec
              submissions {
                items {
                  id
                  solver
                  isWinner
                  isRevealed
                }
              }
            }
          }
        }
      `);
      return data?.bountys?.items || [];
    },
  });
}

export function useIndexerUser(address: string) {
  return useQuery({
    queryKey: ["indexer-user", address],
    enabled: !!address,
    queryFn: async () => {
      const data = await fetchFromIndexer(`
        query GetUser($id: String!) {
          user(id: $id) {
            id
            bountiesCreated
            bountiesWon
            totalVolumeCreated
            totalVolumeWon
          }
        }
      `, { id: address.toLowerCase() });
      return data?.user || null;
    },
  });
}

export function useIndexerUserHistory(address: string) {
  return useQuery({
    queryKey: ["indexer-user-history", address],
    enabled: !!address,
    queryFn: async () => {
      const data = await fetchFromIndexer(`
        query GetUserHistory($address: String!) {
          bountys(where: { creator: $address }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              amount
              status
              title
              description
              timestamp
            }
          }
          submissions(where: { solver: $address }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              bountyId
              ipfsCid
              timestamp
              isWinner
              isRevealed
              bounty {
                id
                title
                description
                amount
              }
            }
          }
        }
      `, { address: address.toLowerCase() });

      return {
        bounties: data?.bountys?.items || [],
        submissions: data?.submissions?.items || [],
      };
    },
  });
}

export function useIndexerLeaderboard() {
  return useQuery({
    queryKey: ["indexer-leaderboard"],
    queryFn: async () => {
      const data = await fetchFromIndexer(`
        query GetLeaderboard {
          topCreators: users(orderBy: "totalVolumeCreated", orderDirection: "desc", limit: 5) {
            items {
              id
              totalVolumeCreated
            }
          }
          topSolvers: users(orderBy: "totalVolumeWon", orderDirection: "desc", limit: 5) {
            items {
              id
              totalVolumeWon
            }
          }
        }
      `);
      return {
        topCreators: data?.topCreators?.items || [],
        topSolvers: data?.topSolvers?.items || [],
      };
    },
  });
}
