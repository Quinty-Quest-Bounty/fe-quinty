"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight } from "lucide-react";
import ZKVerificationModal from "./ZKVerificationModal";

const WalletComponents = dynamic(
  () => import("./WalletComponents"),
  { ssr: false }
);

const navItems = [
  { name: "Dashboard", link: "/dashboard" },
  { name: "Bounties", link: "/bounties" },
  { name: "Disputes", link: "/disputes" },
  { name: "Reputation", link: "/reputation" },
  { name: "Funding", link: "/funding" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useAccount();
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
      <div className="fixed inset-x-0 top-0 z-[100] flex justify-center pt-4 sm:pt-6 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className={cn(
            "pointer-events-auto mx-4 w-full max-w-5xl rounded-full border transition-all duration-500",
            scrolled 
              ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-black/5 dark:border-white/10 shadow-lg shadow-black/5"
              : "bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 dark:border-white/5 shadow-sm"
          )}
        >
          <div className="flex h-14 items-center justify-between px-2 pl-4 pr-2">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 group mr-4"
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-full shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0 dark:brightness-100"
                  priority
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white hidden sm:block">
                Quinty
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.link === pathname;
                return (
                  <Link
                    key={item.name}
                    href={item.link}
                    onMouseEnter={() => setHoveredPath(item.link)}
                    onMouseLeave={() => setHoveredPath(pathname)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors duration-200 z-10",
                      isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.link === hoveredPath && (
                      <motion.div
                        layoutId="navbar-hover"
                        className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-2 lg:flex">
              {isConnected && (
                 <ZKVerificationModal />
              )}
              {isMounted && <WalletComponents />}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 lg:hidden ml-auto">
               {isConnected && <div className="scale-90"><ZKVerificationModal /></div>}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-full h-10 w-10 hover:bg-black/5"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
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
                className="overflow-hidden lg:hidden border-t border-black/5 dark:border-white/10 mx-4"
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
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all"
                    >
                      {item.name}
                      <ChevronRight className="h-4 w-4 opacity-30" />
                    </Link>
                    </motion.div>
                  ))}
                  {isMounted && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex flex-col gap-2 px-2">
                      <WalletComponents />
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
