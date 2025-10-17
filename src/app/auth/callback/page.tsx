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

    // Check Twitter state
    const storedState = sessionStorage.getItem('oauth_state_twitter');
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

    if (code && provider) {
      // In production, you'd exchange the code for access token on your backend
      // For now, we'll mock the user data

      // Clean up storage
      sessionStorage.removeItem(`oauth_state_${provider}`);
      sessionStorage.removeItem(`oauth_verifier_${provider}`);

      // Send success to parent window with mock data
      // In production, you'd call your backend API here
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "oauth_success",
            provider,
            data: {
              username: `${provider}_user_${Date.now()}`,
              userId: `${Date.now()}`,
              // In production, you'd get real user data from your backend
            },
          },
          window.location.origin
        );
      }

      window.close();
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p className="text-gray-600">Please wait while we complete the authentication.</p>
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
