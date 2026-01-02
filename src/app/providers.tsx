'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '../utils/web3';
import { AlertProvider } from '../hooks/useAlert';
import { AlertDialogProvider } from '../hooks/useAlertDialog';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
 return (
 <WagmiProvider config={wagmiConfig}>
 <QueryClientProvider client={queryClient}>
  <RainbowKitProvider
  theme={darkTheme({
   accentColor: '#0EA885',
   accentColorForeground: 'white',
   borderRadius: 'medium',
  })}
  >
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