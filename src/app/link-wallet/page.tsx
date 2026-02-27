'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Wallet, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { formatAddress } from '../../utils/format';
import { usePrivy } from '@privy-io/react-auth';

export default function LinkWalletPage() {
  const { profile, loading } = useAuth();
  const { linkWallet: privyLinkWallet, ready } = usePrivy();
  const router = useRouter();

  // Loading state
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Not authenticated state
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in before linking a wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - wallet already linked
  if (profile.wallet_address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Wallet Already Linked!</CardTitle>
            <CardDescription>
              Your wallet {formatAddress(profile.wallet_address)} is connected to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => router.push('/reputation')}
              className="w-full"
            >
              View Reputation
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main linking UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-slate-100">
            <Wallet className="h-8 w-8 text-slate-600" />
          </div>
          <CardTitle>Link Your Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to access on-chain features and view your reputation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User info */}
          <div className="bg-slate-50 p-4">
            <p className="text-sm text-slate-600 mb-1">Signed in as:</p>
            <p className="font-medium text-slate-900">{profile.username || profile.email}</p>
          </div>

          {/* Info box */}
          <div className="border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              Privy will help you create or connect a wallet. Your wallet will be automatically linked to your account.
            </p>
          </div>

          {/* Action buttons */}
          <Button
            onClick={privyLinkWallet}
            className="w-full h-12"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>

          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="w-full"
          >
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
