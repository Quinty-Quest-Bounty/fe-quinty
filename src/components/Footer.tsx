"use client";

import Link from "next/link";
import { X, Github, ArrowUpRight, Code2, Shield, Zap } from "lucide-react";
import { useChainId } from "wagmi";
import { CONTRACT_ADDRESSES, MANTLE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, EXPLORERS } from "../utils/contracts";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const chainId = useChainId();
  const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
  const networkName = isBase ? "Base Sepolia" : "Mantle Sepolia";
  const networkLabel = isBase ? "Base" : "Mantle";
  const explorerUrl = EXPLORERS[chainId] || EXPLORERS[MANTLE_SEPOLIA_CHAIN_ID];

  return (
    <footer className="relative z-20 bg-black border-t border-white/10 py-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

          {/* Brand Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative h-10 w-10 border-2 border-blue-500 bg-black flex items-center justify-center">
                <span className="text-white font-black text-xl">Q</span>
              </div>
              <div>
                <div className="font-black text-white text-2xl tracking-tighter uppercase">
                  QUINTLE
                </div>
                <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest -mt-1">
                  Quest in Mantle
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6 font-mono leading-relaxed">
              Trustless bounty platform with escrow protection and soulbound reputation on {networkLabel}.
            </p>

            {/* Network Status */}
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-black/50">
              <div className="w-2 h-2 bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                Live on {networkName}
              </span>
            </div>
          </div>

          {/* Resources Column */}
          <div className="md:col-span-3">
            <h3 className="font-black text-white text-sm uppercase tracking-wider mb-6 border-l-2 border-blue-500 pl-3">
              Resources
            </h3>
            <nav className="space-y-3">
              <a
                href="https://quinty.gitbook.io/quinty-docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs uppercase transition-colors group"
              >
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Documentation
              </a>
              <Link
                href="/litepaper"
                className="flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs uppercase transition-colors group"
              >
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Litepaper
              </Link>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs uppercase transition-colors group"
              >
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Explorer
              </a>
            </nav>
          </div>

          {/* Features Column */}
          <div className="md:col-span-3">
            <h3 className="font-black text-white text-sm uppercase tracking-wider mb-6 border-l-2 border-blue-500 pl-3">
              Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                <Shield className="w-3 h-3 text-blue-500" />
                100% Escrow Protection
              </div>
              <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                <Zap className="w-3 h-3 text-blue-500" />
                Soulbound Reputation
              </div>
              <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                <Code2 className="w-3 h-3 text-blue-500" />
                Zero Platform Fees
              </div>
            </div>
          </div>

          {/* Social Column */}
          <div className="md:col-span-2">
            <h3 className="font-black text-white text-sm uppercase tracking-wider mb-6 border-l-2 border-blue-500 pl-3">
              Connect
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://x.com/QuintyLabs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 border border-white/10 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all">
                  <X className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs uppercase">Twitter</span>
              </a>
              <a
                href="https://github.com/Quinty-Quest-Bounty"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 border border-white/10 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all">
                  <Github className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs uppercase">GitHub</span>
              </a>
            </div>
          </div>
        </div>


        {/* Divider */}
        <div className="h-px w-full bg-white/10 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-mono text-xs text-gray-500 uppercase tracking-wider">
            &copy; {currentYear} Quintle Labs · MIT License
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
              Built on
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-blue-500/30 bg-blue-500/5">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span className="font-mono text-xs text-blue-400 uppercase tracking-wider font-bold">
                {networkLabel}
              </span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
