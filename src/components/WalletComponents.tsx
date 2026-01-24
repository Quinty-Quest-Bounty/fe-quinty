"use client";

import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';

export default function WalletComponents() {
  return (
    <div className="flex justify-end">
      <Wallet>
        <ConnectWallet className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full px-5 h-10 font-medium transition-colors">
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <Avatar />
              <div className="flex flex-col">
                <Name />
                <Address className="text-xs text-gray-500" />
              </div>
            </div>
            <div className="mt-2">
              <EthBalance className="text-sm font-medium" />
            </div>
          </div>
          <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
