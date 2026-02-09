'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load auth token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('quinty_auth_token');
    if (stored) setAuthToken(stored);
  }, []);

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

      // Get username from various sources
      const username =
        privyUser.google?.name ||
        privyUser.twitter?.username ||
        email?.split('@')[0] ||
        'User';

      const fullName = privyUser.google?.name;

      const avatarUrl =
        (privyUser.google as any)?.picture ||
        privyUser.twitter?.profilePictureUrl;

      // Create profile object
      const profileData: UserProfile = {
        id: privyUser.id,
        email: email || undefined,
        username,
        full_name: fullName || undefined,
        avatar_url: avatarUrl || undefined,
        wallet_address: walletAddress || undefined,
        google_id: googleId || undefined,
        twitter_id: twitterId || undefined,
        twitter_username: twitterUsername || undefined,
      };

      console.log('Profile data prepared:', {
        id: profileData.id,
        email: profileData.email,
        username: profileData.username,
        hasWallet: !!profileData.wallet_address,
      });

      // Set profile locally first for immediate UI update
      setProfile(profileData);

      // Sync to backend database
      try {
        console.log('Syncing profile to backend...');

        // First check if backend already has this profile with a custom username
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

        // If backend already has values, don't overwrite with Privy-derived ones
        if (existingProfile?.username) {
          profileData.username = existingProfile.username;
        }
        if (existingProfile?.twitter_username) {
          profileData.twitter_username = existingProfile.twitter_username;
          profileData.twitter_id = existingProfile.twitter_id;
        }

        const response = await axios.post(
          `${apiUrl}/auth/sync-profile`,
          profileData,
          { withCredentials: true }
        );

        console.log('Profile synced to backend successfully:', response.data);

        // Store JWT token for subsequent authenticated requests
        if (response.data.access_token) {
          setAuthToken(response.data.access_token);
          localStorage.setItem('quinty_auth_token', response.data.access_token);
        }

        // Update profile with data from backend (source of truth)
        if (response.data.profile) {
          setProfile(response.data.profile);
        }
      } catch (error) {
        console.error('Failed to sync profile to backend:', error);
        // Don't block the UI if backend sync fails - profile still works locally
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
          username: profile?.username || 'User',
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
