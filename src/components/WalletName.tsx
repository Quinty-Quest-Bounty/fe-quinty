'use client';

import { useWalletName } from '@/hooks/useWalletName';
import { formatAddress } from '@/utils/format';

interface WalletNameProps {
  address: string;
  chars?: number;
  className?: string;
}

/**
 * Displays a wallet address as a username (from DB) or formatted address (fallback).
 */
export function WalletName({ address, chars = 4, className }: WalletNameProps) {
  const username = useWalletName(address);

  return <span className={className}>{username || formatAddress(address, chars)}</span>;
}
