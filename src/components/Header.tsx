"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
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
  { name: "Airdrops", link: "/airdrops" },
  { name: "Funding", link: "/funding" },
  { name: "History", link: "/history" },
];

export default function Header() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {/* Floating Navbar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-3 sm:pt-4 md:pt-6">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="pointer-events-auto mx-2 sm:mx-3 md:mx-4 w-full max-w-7xl rounded-[1.5rem] sm:rounded-[1.75rem] md:rounded-[2rem] border border-white/60 bg-white/70 dark:bg-background/80 dark:border-border/40 shadow-lg  backdrop-blur-xl transition-all duration-500"
        >
          <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 transition-all duration-300  "
            >
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#0EA885]/10 to-[#0EA885]/5 p-1 sm:p-1.5 md:p-2 backdrop-blur-sm border border-[#0EA885]/20">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0 dark:brightness-100"
                  priority
                />
              </div>
              <span className="hidden text-base sm:text-lg md:text-xl font-bold tracking-tight sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Quinty
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1.5 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className={cn(
                    "relative rounded-[1rem] px-3.5 py-2 text-sm font-medium transition-all duration-300",
                    "hover:text-[#0EA885] hover:bg-[#0EA885]/10  hover:shadow-md",
                    " backdrop-blur-sm border border-transparent hover:border-[#0EA885]/20"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-3 lg:flex">
              {isConnected && <ZKVerificationModal />}
              {isMounted && <WalletComponents />}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-3 lg:hidden">
              {isConnected && <ZKVerificationModal />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-9 w-9 p-0"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
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
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                className="overflow-hidden border-t border-white/40 dark:border-border/40 bg-white/50 dark:bg-background/50 backdrop-blur-lg lg:hidden rounded-b-[1.75rem] sm:rounded-b-[2rem]"
              >
                <nav className="flex flex-col gap-2 p-4">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.link}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block rounded-[1rem] px-4 py-3 text-base font-medium transition-all duration-300 hover:bg-[#0EA885]/10 hover:text-[#0EA885] hover:translate-x-2 hover:shadow-md  border border-transparent hover:border-[#0EA885]/20 backdrop-blur-sm"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  {isMounted && (
                    <div className="mt-2 border-t border-white/40 dark:border-border/40 pt-4">
                      <WalletComponents />
                    </div>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-20 sm:h-22 md:h-24" />
    </>
  );
}
