"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import ZKVerificationModal from "./ZKVerificationModal";

const navItems = [
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

  return (
    <>
      {/* Floating Navbar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto mx-4 w-full max-w-7xl rounded-2xl border border-border/40 bg-background/80 shadow-lg backdrop-blur-xl"
        >
          <div className="flex h-16 items-center justify-between px-6">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-3 transition-transform hover:scale-105"
            >
              <div className="relative h-9 w-9">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0 dark:brightness-100"
                  priority
                />
              </div>
              <span className="hidden text-xl font-bold tracking-tight sm:inline-block">
                Quinty
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className={cn(
                    "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                    "hover:text-primary hover:bg-primary/10 hover:scale-105 hover:shadow-md"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-3 lg:flex">
              {isConnected && <ZKVerificationModal />}
              <ConnectButton
                accountStatus="address"
                chainStatus="icon"
                showBalance={false}
              />
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
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/40 lg:hidden"
              >
                <nav className="flex flex-col gap-1 p-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-base font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:translate-x-2 hover:shadow-md hover:scale-[1.02]"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-border/40 pt-4">
                    <ConnectButton
                      accountStatus="full"
                      chainStatus="full"
                      showBalance={true}
                    />
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-24" />
    </>
  );
}
