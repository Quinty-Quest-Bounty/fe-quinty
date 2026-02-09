import { useState, useCallback, useEffect } from "react";
import axios from "axios";

export interface XAccount {
  username: string;
  userId: string;
  verified: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'quinty_x_account';

// Generate a random code verifier for PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Generate code challenge from verifier using SHA256
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

// Base64 URL encode
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function useSocialVerification() {
  const [xAccount, setXAccount] = useState<XAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load X account from localStorage first, then try DB
  useEffect(() => {
    const loadXAccount = async () => {
      // First check localStorage (works offline/without backend)
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const account = JSON.parse(stored) as XAccount;
          setXAccount(account);
        }
      } catch (err) {
        console.log('No X account in localStorage');
      }

      // Then try to load from database (if backend is available)
      try {
        const response = await axios.get(`${apiUrl}/auth/me`, { 
          withCredentials: true,
          timeout: 3000, // 3 second timeout
        });
        if (response.data?.twitter_username) {
          const account: XAccount = {
            username: response.data.twitter_username.startsWith('@') 
              ? response.data.twitter_username 
              : `@${response.data.twitter_username}`,
            userId: response.data.twitter_id || '',
            verified: true,
          };
          setXAccount(account);
          // Sync to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
        }
      } catch (err) {
        // Backend not available or user not logged in - that's fine
        console.log('Backend not available or no X account in DB');
      } finally {
        setIsLoading(false);
      }
    };
    loadXAccount();
  }, []);

  // Save X account to localStorage and optionally to database
  const saveXAccount = useCallback(async (account: XAccount) => {
    // Always save to localStorage (works without backend)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));

    // Try to save to database (optional, may fail if backend is down)
    try {
      await axios.patch(
        `${apiUrl}/auth/profile`,
        { 
          twitter_username: account.username.replace('@', ''),
          twitter_id: account.userId,
        },
        { 
          withCredentials: true,
          timeout: 3000,
        }
      );
      console.log('X account saved to database');
    } catch (err) {
      // Backend not available - that's fine, we have localStorage
      console.log('Could not save X account to DB (backend may be offline)');
    }
  }, []);

  const buildXAuthUrl = useCallback(async (): Promise<string | null> => {
    const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;

    if (!clientId) return null;

    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = Math.random().toString(36).substring(7);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store for validation (use localStorage for cross-window access in popups)
    localStorage.setItem('oauth_state_twitter', state);
    localStorage.setItem('oauth_verifier_twitter', codeVerifier);
    localStorage.setItem('oauth_redirect_uri_twitter', redirectUri);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read',
      response_type: 'code',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }, []);

  const connectX = useCallback(async (): Promise<XAccount | null> => {
    setIsConnecting(true);
    setError(null);

    try {
      const authUrl = await buildXAuthUrl();

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

            // Received REAL verified data from Twitter
            const account: XAccount = {
              username: data.username.startsWith('@') ? data.username : `@${data.username}`,
              userId: data.userId,
              verified: true,
            };

            // Save to localStorage and optionally to database
            await saveXAccount(account);

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
  }, [buildXAuthUrl, isConnecting, saveXAccount]);

  const disconnectX = useCallback(() => {
    setXAccount(null);
    localStorage.removeItem(STORAGE_KEY);
    
    // Try to remove from database too (optional)
    axios.patch(
      `${apiUrl}/auth/profile`,
      { twitter_username: null, twitter_id: null },
      { withCredentials: true, timeout: 3000 }
    ).catch(() => {
      // Backend not available - that's fine
    });
  }, []);

  return {
    xAccount,
    connectX,
    disconnectX,
    isConnecting,
    isLoading,
    error,
    isConnected: !!xAccount,
  };
}
