'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Global cache shared across all component instances
const nameCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

async function fetchUsername(address: string): Promise<string | null> {
  const key = address.toLowerCase();

  // Return cached result
  if (nameCache.has(key)) return nameCache.get(key)!;

  // Return pending request if one exists
  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  // Start new request
  const promise = axios
    .get(`${apiUrl}/users/wallet/${address}`, { timeout: 3000 })
    .then((res) => {
      const username = res.data?.username || null;
      nameCache.set(key, username);
      pendingRequests.delete(key);
      return username;
    })
    .catch(() => {
      nameCache.set(key, null);
      pendingRequests.delete(key);
      return null;
    });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Hook to resolve a wallet address to a display name.
 * Returns username if found in DB, otherwise the formatted address.
 */
export function useWalletName(address: string | undefined) {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const key = address.toLowerCase();

    // Check cache synchronously first
    if (nameCache.has(key)) {
      setDisplayName(nameCache.get(key)!);
      return;
    }

    fetchUsername(address).then((name) => {
      setDisplayName(name);
    });
  }, [address]);

  return displayName;
}
