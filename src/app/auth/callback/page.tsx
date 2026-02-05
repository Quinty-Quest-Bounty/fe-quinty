'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Privy handles OAuth callbacks automatically
// This page is kept for backwards compatibility with the old X OAuth flow

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home or dashboard after a short delay
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Authentication successful!</h1>
        <p className="text-slate-600">Redirecting...</p>
      </div>
    </div>
  );
}
