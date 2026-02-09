'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Note: Privy has its own built-in login modal
// This component is just a wrapper that triggers it
// The modal will show all configured login methods: email, Google, Twitter, wallet

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();

  // When modal opens, trigger Privy's login
  React.useEffect(() => {
    if (open) {
      signInWithGoogle(); // This opens Privy's modal
      onOpenChange(false); // Close our trigger
    }
  }, [open]);

  // Privy handles the modal UI, so we don't render anything
  return null;
}
