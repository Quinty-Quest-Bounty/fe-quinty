/**
 * Utility functions for fetching cryptocurrency prices
 */

interface PriceCache {
  value: number;
  timestamp: number;
}

let ethPriceCache: PriceCache | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetches the current ETH price in USD from CoinGecko API
 * Results are cached for 1 minute to avoid rate limiting
 */
export async function getEthPriceInUSD(): Promise<number> {
  // Return cached price if still valid
  if (ethPriceCache && Date.now() - ethPriceCache.timestamp < CACHE_DURATION) {
    return ethPriceCache.value;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch ETH price');
    }

    const data = await response.json();
    const price = data.ethereum?.usd;

    if (typeof price !== 'number') {
      throw new Error('Invalid price data received');
    }

    // Update cache
    ethPriceCache = {
      value: price,
      timestamp: Date.now(),
    };

    return price;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    // Return cached price if available, otherwise return 0
    return ethPriceCache?.value || 0;
  }
}

/**
 * Converts ETH amount (in wei or ETH) to USD
 */
export function convertEthToUSD(ethAmount: number, ethPriceUSD: number): number {
  return ethAmount * ethPriceUSD;
}

/**
 * Formats USD amount with proper formatting
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
