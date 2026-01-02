"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const WalletComponents = dynamic(
  () => import("./WalletComponents"),
  { ssr: false }
);

const navItems = [
  { name: "Bounties", link: "/bounties" },
  { name: "Reputation", link: "/reputation" },
  { name: "History", link: "/history" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Brutalist Style */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-3 group"
            >
              <div className="relative h-8 w-8 border-2 border-blue-500 bg-black flex items-center justify-center overflow-hidden group-hover:bg-blue-500 transition-colors">
                <span className="text-white font-black text-lg group-hover:scale-110 transition-transform">Q</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-white text-xl tracking-tighter uppercase">
                  QUINTLE
                </div>
                <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest -mt-1">
                  Quest in Mantle
                </div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`
                    relative px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all
                    ${isActive(item.link)
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                    }
                  `}
                >
                  {item.name}
                  {isActive(item.link) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Network Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-black">
                <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                  Mantle
                </span>
              </div>

              {/* Wallet */}
              {isMounted && <WalletComponents />}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 border border-white/20 bg-black hover:border-blue-500 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu - Fullscreen Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute top-16 right-0 bottom-0 w-full max-w-sm bg-black border-l border-white/10 p-6 overflow-y-auto"
            >
              {/* Navigation Links */}
              <nav className="space-y-2 mb-8">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.link}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        block px-4 py-3 font-mono text-lg uppercase tracking-wider border-l-2 transition-all
                        ${isActive(item.link)
                          ? "border-blue-500 text-white bg-blue-500/10"
                          : "border-transparent text-gray-400 hover:border-white/20 hover:text-white"
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Mobile Network & Wallet */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between px-4 py-3 border border-white/10 bg-black">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 animate-pulse" />
                    <span className="text-xs font-mono text-gray-400 uppercase">Mantle Sepolia</span>
                  </div>
                  <span className="text-xs font-mono text-blue-400">5003</span>
                </div>

                {isMounted && (
                  <div className="px-4">
                    <WalletComponents />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
