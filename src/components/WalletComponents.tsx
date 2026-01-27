"use client";

import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { formatAddress } from '../utils/web3';

export default function WalletComponents() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <Button disabled className="bg-white border border-gray-200 text-gray-700 rounded-full px-5 h-10 font-medium">
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button 
        onClick={login}
        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full px-5 h-10 font-medium transition-colors"
      >
        Connect Wallet
      </Button>
    );
  }

  const walletAddress = user?.wallet?.address;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700">
        {walletAddress ? formatAddress(walletAddress) : 'Connected'}
      </div>
      <Button 
        onClick={logout}
        variant="ghost"
        className="rounded-full px-4 h-10 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        Disconnect
      </Button>
    </div>
  );
}
