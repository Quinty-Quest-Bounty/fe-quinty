'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../utils/web3';
import { AlertProvider } from '../hooks/useAlert';
import { AlertDialogProvider } from '../hooks/useAlertDialog';
import FarcasterProvider from '../components/FarcasterProvider';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const OnchainKitProvider = dynamic(
 () => import('@coinbase/onchainkit').then((mod) => mod.OnchainKitProvider),
 { ssr: false }
);

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
 return (
 <WagmiProvider config={wagmiConfig}>
 <QueryClientProvider client={queryClient}>
  <OnchainKitProvider
  apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
  chain={baseSepolia}
  config={{
  appearance: {
   name: 'Quinty',
   logo: '/images/quinty-logo.png',
   mode: 'light',
   theme: 'default',
  },
  }}
  >
  <FarcasterProvider>
   <AlertProvider>
    <AlertDialogProvider>
     {children}
    </AlertDialogProvider>
   </AlertProvider>
  </FarcasterProvider>
  </OnchainKitProvider>
 </QueryClientProvider>
 </WagmiProvider>
 );
}