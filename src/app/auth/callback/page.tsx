'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for OAuth error
      if (error) {
        setStatus('error');
        setErrorMessage(error);
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth_error', provider: 'twitter', data: { error } },
            window.location.origin
          );
        }
        return;
      }

      // Validate state (use localStorage for cross-window access in popups)
      const storedState = localStorage.getItem('oauth_state_twitter');
      if (state !== storedState) {
        setStatus('error');
        setErrorMessage('Invalid state parameter');
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth_error', provider: 'twitter', data: { error: 'Invalid state' } },
            window.location.origin
          );
        }
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        if (window.opener) {
          window.opener.postMessage(
            { type: 'oauth_error', provider: 'twitter', data: { error: 'No code' } },
            window.location.origin
          );
        }
        return;
      }

      try {
        // Get stored PKCE values (use localStorage for cross-window access in popups)
        const codeVerifier = localStorage.getItem('oauth_verifier_twitter');
        const redirectUri = localStorage.getItem('oauth_redirect_uri_twitter');

        if (!codeVerifier || !redirectUri) {
          throw new Error('Missing PKCE values');
        }

        // Exchange code via our server-side API route (avoids CORS issues with Twitter API)
        const verifyResponse = await fetch('/api/x/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier, redirectUri }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.error || 'Failed to verify X account');
        }

        const { username, userId } = await verifyResponse.json();

        // Clear stored values
        localStorage.removeItem('oauth_state_twitter');
        localStorage.removeItem('oauth_verifier_twitter');
        localStorage.removeItem('oauth_redirect_uri_twitter');

        setStatus('success');

        // Send success message to opener
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: 'oauth_success', 
              provider: 'twitter', 
              data: { username, userId } 
            },
            window.location.origin
          );
        }

        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authenticate');
        
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: 'oauth_error', 
              provider: 'twitter', 
              data: { error: err.message } 
            },
            window.location.origin
          );
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center p-8 bg-white border border-slate-200 max-w-md">
        {status === 'loading' && (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-slate-100">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
            <h1 className="text-xl font-bold mb-2">Authenticating...</h1>
            <p className="text-slate-500 text-sm">Please wait while we verify your X account.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2 text-green-600">Success!</h1>
            <p className="text-slate-500 text-sm">Your X account has been verified. This window will close automatically.</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2 text-red-600">Authentication Failed</h1>
            <p className="text-slate-500 text-sm mb-4">{errorMessage}</p>
            <button 
              onClick={() => window.close()} 
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center p-8 bg-white border border-slate-200 max-w-md">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-slate-100">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
        <h1 className="text-xl font-bold mb-2">Loading...</h1>
        <p className="text-slate-500 text-sm">Please wait...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
