'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '../utils/web3';
import { AlertProvider } from '../hooks/useAlert';
import { AlertDialogProvider } from '../hooks/useAlertDialog';
import '@rainbow-me/rainbowkit/styles.css';

import { useState } from 'react';

// Fix for "indexedDB is not defined" during SSR
if (typeof window === 'undefined') {
    // @ts-ignore
    global.indexedDB = {
        open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null } as any),
    } as any;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
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