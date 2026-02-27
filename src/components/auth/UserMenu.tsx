'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatAddress, getInitials } from '../../utils/format';

export default function UserMenu() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  if (!profile) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = profile.username || profile.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 border border-white/60 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{displayName}</span>
            {profile.twitter_username && (
              <span className="text-xs text-slate-500">@{profile.twitter_username}</span>
            )}
            {profile.wallet_address && (
              <span className="text-xs text-slate-400">
                {formatAddress(profile.wallet_address)}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
