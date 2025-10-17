import { useState, useCallback } from "react";

export interface XAccount {
  username: string;
  userId: string;
  verified: boolean;
}

export function useSocialVerification() {
  const [xAccount, setXAccount] = useState<XAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildXAuthUrl = useCallback((): string | null => {
    const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;

    if (!clientId) return null;

    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = Math.random().toString(36).substring(7);
    const codeVerifier = Math.random().toString(36).substring(2, 15);

    // Store for validation
    sessionStorage.setItem('oauth_state_twitter', state);
    sessionStorage.setItem('oauth_verifier_twitter', codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read',
      response_type: 'code',
      state,
      code_challenge: codeVerifier,
      code_challenge_method: 'plain',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }, []);

  const connectX = useCallback(async (): Promise<XAccount | null> => {
    setIsConnecting(true);
    setError(null);

    try {
      const authUrl = buildXAuthUrl();

      if (!authUrl) {
        throw new Error('X Client ID not configured. Please add NEXT_PUBLIC_TWITTER_CLIENT_ID to .env.local');
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'x_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Failed to open OAuth popup. Please allow popups.');
      }

      // Wait for OAuth callback with REAL data
      return new Promise((resolve, reject) => {
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          const { type, provider, data } = event.data;

          if (type === 'oauth_success' && provider === 'twitter') {
            window.removeEventListener('message', handleMessage);
            popup?.close();

            // Received REAL verified data from backend
            const account: XAccount = {
              username: `@${data.username}`, // Add @ prefix
              userId: data.userId,
              verified: true,
            };

            setXAccount(account);
            setIsConnecting(false);
            resolve(account);
          } else if (type === 'oauth_error' && provider === 'twitter') {
            window.removeEventListener('message', handleMessage);
            popup?.close();
            setError(data.error || 'OAuth failed');
            setIsConnecting(false);
            reject(new Error(data.error));
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);

            if (isConnecting) {
              setError('OAuth cancelled');
              setIsConnecting(false);
              resolve(null);
            }
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);

          if (popup && !popup.closed) {
            popup.close();
          }

          if (isConnecting) {
            setError('OAuth timed out');
            setIsConnecting(false);
            resolve(null);
          }
        }, 5 * 60 * 1000);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect X';
      setError(errorMessage);
      setIsConnecting(false);
      return null;
    }
  }, [buildXAuthUrl, isConnecting]);

  const disconnectX = useCallback(() => {
    setXAccount(null);
  }, []);

  return {
    xAccount,
    connectX,
    disconnectX,
    isConnecting,
    error,
    isConnected: !!xAccount,
  };
}
