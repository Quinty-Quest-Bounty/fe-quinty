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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
        privyUser.google?.pictureUrl ||
        privyUser.twitter?.profilePictureUrl;

      // Create profile object
      const profileData: UserProfile = {
        id: privyUser.id,
        email,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        wallet_address: walletAddress,
        google_id: googleId,
        twitter_id: twitterId,
        twitter_username: twitterUsername,
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
        const response = await axios.post(
          `${apiUrl}/auth/sync-profile`,
          profileData,
          { withCredentials: true }
        );

        console.log('Profile synced to backend successfully:', response.data);

        // Update profile with any data from backend
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
