'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import axios from 'axios';

interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  google_id?: string;
  twitter_id?: string;
  twitter_username?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  authenticated: boolean;
  signInWithEmail: () => void;
  signInWithGoogle: () => void;
  signInWithTwitter: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
  privyUser: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    ready,
    authenticated,
    user: privyUser,
    login,
    logout,
  } = usePrivy();

  const { address, isConnected } = useAccount();
  const wasConnectedRef = useRef(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load auth token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('quinty_auth_token');
    if (stored) setAuthToken(stored);
  }, []);

  // When wallet disconnects, sign out of Privy and clear profile
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current && !isConnected && authenticated) {
      // Wallet was connected and is now disconnected — sign out
      wasConnectedRef.current = false;
      setProfile(null);
      setAuthToken(null);
      localStorage.removeItem('quinty_auth_token');
      localStorage.removeItem('quinty_x_account');
      logout().catch(() => {});
    }
  }, [isConnected, authenticated]);

  // Sync profile with backend when Privy user changes
  useEffect(() => {
    if (!ready) {
      setLoading(true);
      return;
    }

    if (authenticated && privyUser) {
      syncProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [ready, authenticated, privyUser]);

  const syncProfile = async () => {
    try {
      if (!privyUser) {
        console.log('No Privy user to sync');
        return;
      }

      console.log('Syncing profile for Privy user:', privyUser.id);

      // Extract user data from Privy
      const email = privyUser.email?.address || privyUser.google?.email;
      const googleId = privyUser.google?.subject;
      const twitterUsername = privyUser.twitter?.username;
      const twitterId = privyUser.twitter?.subject;
      const walletAddress = privyUser.wallet?.address;

      // Get username from Privy — only real values, no fallback
      // We never want to send 'User' as a username to the backend
      const privyDerivedUsername =
        privyUser.google?.name ||
        privyUser.twitter?.username ||
        email?.split('@')[0] ||
        null;

      const fullName = privyUser.google?.name;

      const avatarUrl =
        (privyUser.google as any)?.picture ||
        privyUser.twitter?.profilePictureUrl;

      // Create profile object (without twitter fields - those are managed by X OAuth)
      // username is left undefined for now — resolved after checking backend
      const profileData: UserProfile = {
        id: privyUser.id,
        email: email || undefined,
        username: privyDerivedUsername || undefined,
        full_name: fullName || undefined,
        avatar_url: avatarUrl || undefined,
        wallet_address: walletAddress || undefined,
        google_id: googleId || undefined,
      };

      // Sync to backend database
      try {
        console.log('Syncing profile to backend...');

        // First check if backend already has this profile
        const token = localStorage.getItem('quinty_auth_token');
        let existingProfile: UserProfile | null = null;
        try {
          const meResponse = await axios.get(`${apiUrl}/auth/me`, {
            withCredentials: true,
            timeout: 3000,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          existingProfile = meResponse.data;
        } catch {
          // No existing profile or not authenticated yet — that's fine
        }

        // Backend username always wins over Privy-derived username.
        // If backend has no username yet, use the Privy-derived one (or omit entirely).
        if (existingProfile?.username) {
          profileData.username = existingProfile.username;
        }
        // If no backend username and no real Privy-derived value, omit username from payload
        // so we never overwrite a custom username with undefined/null
        if (!profileData.username) {
          delete profileData.username;
        }
        // Merge twitter data from backend (managed by our custom OAuth, not Privy)
        if (existingProfile?.twitter_username) {
          profileData.twitter_username = existingProfile.twitter_username;
          profileData.twitter_id = existingProfile.twitter_id;
        }

        // Set profile with merged data for immediate UI update
        setProfile({ ...profileData });

        // Send to sync-profile WITHOUT twitter fields to avoid overwriting
        const { twitter_username, twitter_id, ...syncPayload } = profileData;
        const response = await axios.post(
          `${apiUrl}/auth/sync-profile`,
          syncPayload,
          { withCredentials: true }
        );

        // Store JWT token for subsequent authenticated requests
        if (response.data.access_token) {
          setAuthToken(response.data.access_token);
          localStorage.setItem('quinty_auth_token', response.data.access_token);
        }

        // Update profile with data from backend (final source of truth)
        if (response.data.profile) {
          setProfile(response.data.profile);
        }
      } catch (error) {
        console.error('Failed to sync profile to backend:', error);
        // Backend unavailable — set Privy-only profile so UI still works
        setProfile(profileData);
        if (axios.isAxiosError(error)) {
          console.error('Backend error details:', {
            status: error.response?.status,
            data: error.response?.data,
          });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to sync profile:', error);
      setLoading(false);
    }
  };

  const signInWithEmail = () => {
    login();
  };

  const signInWithGoogle = () => {
    login();
  };

  const signInWithTwitter = () => {
    login();
  };

  const signOut = async () => {
    await logout();
    setProfile(null);
    setAuthToken(null);
    localStorage.removeItem('quinty_auth_token');

    // Clear backend session
    try {
      await axios.post(
        `${apiUrl}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Failed to clear backend session:', error);
    }
  };

  const refreshProfile = async () => {
    if (authenticated && privyUser) {
      await syncProfile();
    }
  };

  // Helper to get a valid auth token, refreshing via sync-profile if needed
  const getAuthToken = async (): Promise<string | null> => {
    const existing = authToken || localStorage.getItem('quinty_auth_token');
    if (existing) return existing;

    // No token stored — call sync-profile to get a fresh one
    if (!privyUser) return null;
    try {
      const email = privyUser.email?.address || privyUser.google?.email;
      const response = await axios.post(
        `${apiUrl}/auth/sync-profile`,
        {
          id: privyUser.id,
          email: email || undefined,
          ...(profile?.username ? { username: profile.username } : {}),
        },
        { withCredentials: true }
      );
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
        localStorage.setItem('quinty_auth_token', response.data.access_token);
        return response.data.access_token;
      }
    } catch (e) {
      console.error('Failed to refresh auth token:', e);
    }
    return null;
  };

  const updateUsername = async (username: string): Promise<boolean> => {
    if (!profile) return false;

    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available for profile update');
      return false;
    }

    try {
      const response = await axios.patch(
        `${apiUrl}/auth/profile`,
        { username },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        setProfile((prev) => prev ? { ...prev, username } : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update username:', error);
      if (axios.isAxiosError(error)) {
        console.error('Update error details:', {
          status: error.response?.status,
          data: error.response?.data,
        });
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        authenticated,
        signInWithEmail,
        signInWithGoogle,
        signInWithTwitter,
        signOut,
        refreshProfile,
        updateUsername,
        privyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
