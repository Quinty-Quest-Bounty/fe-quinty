"use client";

import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { formatAddress } from '../utils/web3';

export default function WalletComponents() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <Button disabled className="bg-white/50 text-white/50 h-8 px-3 font-medium text-xs tracking-wide border-0">
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button 
        onClick={login}
        className="bg-white/90 hover:bg-white text-[#0EA885] h-8 px-3 font-medium text-xs tracking-wide shadow-none border-0 transition-colors"
      >
        Connect Wallet
      </Button>
    );
  }

  const walletAddress = user?.wallet?.address;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-white/20 border border-white/30 px-2.5 py-1 text-xs font-medium text-white">
        {walletAddress ? formatAddress(walletAddress) : 'Connected'}
      </div>
      <Button 
        onClick={logout}
        variant="ghost"
        className="px-2.5 h-8 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 border-0"
      >
        Disconnect
      </Button>
    </div>
  );
}
