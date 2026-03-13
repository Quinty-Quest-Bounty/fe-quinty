"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Bell, Bot, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "wagmi";
import { useAdmin } from "@/hooks/useAdmin";
import { useNotifications } from "@/hooks/useNotifications";
import LoginButton from "./auth/LoginButton";
import { WithdrawalBanner } from "./WithdrawalBanner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/utils/format";
import UserMenu from "./auth/UserMenu";

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const { isConnected } = useAccount();
  const { isAdmin } = useAdmin();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications]);

  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/bounties") || pathname?.startsWith("/quests");

  return (
    <div className="fixed inset-x-0 top-0 z-[100] pointer-events-none">
      <header
        className={cn(
          "pointer-events-auto w-full transition-all duration-200",
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            : "bg-white border-b border-zinc-200"
        )}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2.5 flex-shrink-0"
            >
              <div className="relative h-7 w-7 overflow-hidden">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty"
                  fill
                  className="object-contain brightness-0"
                  priority
                />
              </div>
              <span className="font-semibold text-[17px] tracking-tight text-zinc-900 hidden sm:block">
                Quinty
              </span>
            </button>

            {/* Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={cn(
                  "text-[13px] font-medium transition-colors duration-150",
                  isDashboard
                    ? "text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Dashboard
              </Link>
              {profile && (
                <Link
                  href="/agent/drafts"
                  className={cn(
                    "text-[13px] font-medium transition-colors duration-150",
                    pathname?.startsWith("/agent")
                      ? "text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  Agents
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-[13px] font-medium transition-colors duration-150",
                    pathname === "/admin"
                      ? "text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Profile avatar or Sign In */}
          <div className="hidden lg:flex items-center">
            {!loading && isMounted && (
              <>
                {profile ? (
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={notifRef}>
                      <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        title="Notifications"
                      >
                        <Bell className="h-[18px] w-[18px]" />
                        {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-[#0EA885] text-white text-[10px] font-bold px-1">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Notification Dropdown */}
                      {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden z-[200]">
                          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="text-xs text-[#0EA885] font-medium">{unreadCount} unread</span>
                            )}
                          </div>
                          <div className="max-h-[360px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center">
                                <Bell className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                                <p className="text-sm text-zinc-400">No notifications yet</p>
                              </div>
                            ) : (
                              notifications.slice(0, 8).map((notif) => {
                                const timeAgo = getTimeAgo(notif.created_at);
                                return (
                                  <button
                                    key={notif.id}
                                    onClick={async () => {
                                      if (!notif.read) await markAsRead(notif.id);
                                      setShowNotifications(false);
                                      if (notif.metadata?.draftId) {
                                        router.push("/agent/drafts");
                                      }
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex items-start gap-3 border-b border-zinc-50 last:border-0",
                                      !notif.read && "bg-[#0EA885]/[0.03]"
                                    )}
                                  >
                                    {!notif.read && (
                                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0EA885] flex-shrink-0" />
                                    )}
                                    <div className={cn("flex-1 min-w-0", notif.read && "ml-5")}>
                                      <p className="text-sm text-zinc-800 font-medium truncate">{notif.title}</p>
                                      {notif.body && (
                                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{notif.body}</p>
                                      )}
                                      <p className="text-[11px] text-zinc-400 mt-1">{timeAgo}</p>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                          {notifications.length > 0 && (
                            <div className="border-t border-zinc-100">
                              <button
                                onClick={() => {
                                  setShowNotifications(false);
                                  router.push("/agent/drafts");
                                }}
                                className="w-full py-2.5 text-xs text-center text-[#0EA885] font-medium hover:bg-zinc-50 transition-colors"
                              >
                                View all drafts
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <UserMenu />
                  </div>
                ) : (
                  <LoginButton />
                )}
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-3 lg:hidden ml-auto">
            {!loading && isMounted && profile && (
              <UserMenu />
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Withdrawal Banner */}
      {isMounted && isConnected && <WithdrawalBanner />}

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto fixed inset-0 top-[57px] bg-black/10 z-[99]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto relative z-[100] bg-white border-b border-zinc-200 shadow-sm"
            >
              <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium transition-colors",
                    isDashboard ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === "/profile" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Profile
                </Link>
                {profile && (
                  <>
                    <Link
                      href="/agent/drafts"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname?.startsWith("/agent/drafts") ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      Agent Drafts
                    </Link>
                    <Link
                      href="/agent/setup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === "/agent/setup" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      Register Agent
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/admin" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    Admin
                  </Link>
                )}
                {isMounted && !loading && !profile && (
                  <div className="mt-2 pt-2 border-t border-zinc-100 px-3">
                    <LoginButton />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
