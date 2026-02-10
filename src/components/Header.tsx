"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginButton from "./auth/LoginButton";
import UserMenu from "./auth/UserMenu";

const navItems = [
  { name: "Dashboard", link: "/dashboard" },
  { name: "Profile", link: "/profile" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[100] pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="pointer-events-auto w-full bg-gradient-to-r from-[#0EA885] to-[#0c8a6f] text-white"
        >
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 group mr-4"
            >
              <div className="relative h-8 w-8 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0 invert"
                  priority
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-white hidden sm:block">
                Quinty
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = item.link === pathname;
                return (
                  <Link
                    key={item.name}
                    href={item.link}
                    className={cn(
                      "relative text-sm font-bold transition-colors duration-200",
                      isActive ? "text-white" : "text-white/80 hover:text-white"
                    )}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute -bottom-5 left-0 right-0 h-0.5 bg-white"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-2 lg:flex">
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

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 lg:hidden ml-auto">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-10 w-10 flex items-center justify-center hover:bg-white/10 transition-colors text-white"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden lg:hidden border-t border-white/20 mx-4"
              >
                <nav className="flex flex-col gap-1 py-4">
                  {navItems.map((item, idx) => (
                    <motion.div
                      key={item.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={item.link}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
                      >
                        {item.name}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Link>
                    </motion.div>
                  ))}
                  {isMounted && (
                    <div className="mt-3 pt-3 border-t border-white/20 flex flex-col gap-2 px-2">
                      {!loading && (
                        <>
                          {profile ? (
                            <div className="flex items-center gap-2 justify-between px-2">
                              <span className="text-sm font-medium text-white">
                                {profile.username || profile.email?.split('@')[0]}
                              </span>
                              <UserMenu />
                            </div>
                          ) : (
                            <LoginButton />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed header */}
      {/* We don't strictly need a spacer if the hero has enough padding, but it's safe */}
    </>
  );
}
