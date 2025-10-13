'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '../utils/web3';
import { AlertProvider } from '../hooks/useAlert';
import { AlertDialogProvider } from '../hooks/useAlertDialog';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AlertProvider>
            <AlertDialogProvider>
              {children}
            </AlertDialogProvider>
          </AlertProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}