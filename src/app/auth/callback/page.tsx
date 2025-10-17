"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Check X state
    const storedState = sessionStorage.getItem('oauth_state_twitter');
    const codeVerifier = sessionStorage.getItem('oauth_verifier_twitter');
    const provider = storedState === state ? 'twitter' : '';

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "oauth_error",
            provider,
            data: {
              error: errorDescription || error,
            },
          },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    if (code && provider && codeVerifier) {
      // Clean up storage immediately
      sessionStorage.removeItem(`oauth_state_${provider}`);
      sessionStorage.removeItem(`oauth_verifier_${provider}`);

      // Call backend to exchange code for REAL user data
      fetch('/api/x/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          codeVerifier,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Verification failed');
          }
          return res.json();
        })
        .then((data) => {
          // Send REAL verified data to parent window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "oauth_success",
                provider,
                data: {
                  username: data.username, // REAL username from X API
                  userId: data.userId,     // REAL user ID from X API
                  verified: true,
                },
              },
              window.location.origin
            );
          }
          window.close();
        })
        .catch((err) => {
          console.error('Verification error:', err);
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "oauth_error",
                provider,
                data: {
                  error: err.message || 'Failed to verify X account',
                },
              },
              window.location.origin
            );
          }
          window.close();
        });
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p className="text-gray-600">Please wait while we verify your X account.</p>
      </div>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
