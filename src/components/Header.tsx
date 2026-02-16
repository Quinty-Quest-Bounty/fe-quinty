"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginButton from "./auth/LoginButton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/utils/format";
import UserMenu from "./auth/UserMenu";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

            {/* Nav — just Dashboard */}
            <nav className="hidden lg:flex items-center">
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
            </nav>
          </div>

          {/* Right: Profile avatar or Sign In */}
          <div className="hidden lg:flex items-center">
            {!loading && isMounted && (
              <>
                {profile ? (
                  <UserMenu />
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
