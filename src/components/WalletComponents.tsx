"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletComponents() {
  return (
    <div className="flex justify-end">
      <ConnectButton
        chainStatus="icon"
        showBalance={false}
      />
    </div>
  );
}
