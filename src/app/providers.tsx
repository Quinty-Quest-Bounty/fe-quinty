'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { baseSepolia } from 'wagmi/chains';
import { wagmiConfig } from '../utils/web3';
import { AlertProvider } from '../hooks/useAlert';
import { AlertDialogProvider } from '../hooks/useAlertDialog';
import FarcasterProvider from '../components/FarcasterProvider';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
 return (
  <PrivyProvider
   appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmkw1atlt00egla0cz3epb0eo'}
   config={{
    appearance: {
     theme: 'light',
     accentColor: '#0EA885',
     logo: '/images/quinty-logo.png',
    },
    defaultChain: baseSepolia,
    supportedChains: [baseSepolia],
   }}
  >
  <QueryClientProvider client={queryClient}>
   <WagmiProvider config={wagmiConfig}>
    <FarcasterProvider>
     <AlertProvider>
      <AlertDialogProvider>
       {children}
      </AlertDialogProvider>
     </AlertProvider>
    </FarcasterProvider>
   </WagmiProvider>
  </QueryClientProvider>
 </PrivyProvider>
 );
}