"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Footer } from "../components/Footer";
import { mockBounties, getMockMetadata } from "../utils/mockBounties";
import { formatETH, formatTimeLeft } from "../utils/web3";
import {
  Target,
  BadgeCheck,
  ArrowRight,
  Lock,
  Sparkles,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Cpu,
} from "lucide-react";

const contractReferences = [
  { label: "Quintle Core", address: "0x0000000000000000000000000000000000000000" },
  { label: "Reputation", address: "0x0000000000000000000000000000000000000000" },
  { label: "Soulbound NFT", address: "0x0000000000000000000000000000000000000000" },
];

export default function Home() {
  const router = useRouter();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Get a featured bounty (the first active one)
  const featuredBounty = mockBounties.find(b => b.status === 1) || mockBounties[0];
  const featuredMetadata = getMockMetadata(featuredBounty.metadataCid);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleCopy = (address: string, index: number) => {
    navigator.clipboard.writeText(address);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0A0A0A] text-white relative overflow-x-hidden">
      {/* Cursor Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`
        }}
      />

      {/* Grid Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
          {/* Floating Abstract Shapes */}
          <motion.div
            style={{ y: y1, rotate }}
            className="absolute top-20 right-[10%] w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-20 left-[5%] w-80 h-80 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl"
          />

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Brutalist Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 mb-12 border-2 border-blue-500 px-4 py-2 bg-black/50 backdrop-blur-sm"
            >
              <div className="relative">
                <div className="w-2 h-2 bg-blue-500 animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-blue-500 animate-ping" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400">
                Live on Mantle Sepolia
              </span>
              <div className="w-px h-4 bg-blue-500/30" />
              <span className="text-xs font-mono text-gray-400">5003</span>
            </motion.div>

            {/* Title - Brutalist Typography */}
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-7xl md:text-9xl font-black leading-[0.85] tracking-tighter"
              >
                <span className="block text-white">QUEST</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-[length:200%_auto] animate-gradient">
                  IN MANTLE
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-6 max-w-4xl"
              >
                {/* Vertical Accent Line */}
                <div className="hidden md:block w-1 h-32 bg-gradient-to-b from-blue-500 to-transparent" />

                <div className="space-y-4">
                  <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl leading-relaxed">
                    Trustless bounty platform where{" "}
                    <span className="text-blue-400 font-semibold border-b-2 border-blue-400/30">
                      funds are locked
                    </span>{" "}
                    until work is verified.{" "}
                    <span className="text-purple-400 font-semibold">Soulbound reputation</span>.{" "}
                    <span className="text-white font-semibold">On-chain verified</span>.
                  </p>

                  {/* Stats Bar */}
                  <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-white">100%</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Escrow</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-2xl font-bold text-white">NFT</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Badges</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold text-white">On-Chain</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Verified</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTA Buttons - Brutalist Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 pt-8"
              >
                <button
                  onClick={() => router.push("/dashboard")}
                  className="group relative px-8 py-4 bg-blue-500 text-white font-bold text-lg overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-white transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center gap-2">
                    LAUNCH APP
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 border-2 border-white/20 text-white font-bold text-lg hover:border-blue-400 hover:text-blue-400 transition-all hover:translate-x-1"
                >
                  EXPLORE FEATURES
                </button>
              </motion.div>
            </div>

            {/* Floating Card - Asymmetric */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="absolute top-32 right-0 hidden lg:block w-80 cursor-pointer"
              onClick={() => router.push(`/bounties/example`)}
            >
              <div className="bg-black border-2 border-blue-500 p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-mono uppercase">Live Bounty Example</div>
                    <div className="text-3xl font-black text-white">{formatETH(featuredBounty.amount)} MNT</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                </div>
                {featuredMetadata && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 line-clamp-2">{featuredMetadata.title}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="h-2 bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(featuredBounty.submissions.length / 5) * 100}%` }}
                      transition={{ delay: 1, duration: 1.5 }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono">{formatTimeLeft(featuredBounty.deadline)}</span>
                    <span className="text-blue-400 font-bold">{featuredBounty.submissions.length} SUBMISSIONS</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES SECTION - Grid Chaos */}
        <section id="features" className="py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            {/* Section Header - Deconstructed */}
            <div className="mb-20">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500" />
                  <div className="w-3 h-3 bg-purple-500" />
                </div>
                <span className="text-sm font-mono uppercase tracking-widest text-gray-400">
                  Core Features
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-black text-white leading-tight"
              >
                BOUNTIES &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  REPUTATION
                </span>
              </motion.h2>
            </div>

            {/* Feature Grid - Asymmetric Brutalist Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Bounty Feature - Large */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-8 group"
              >
                <div className="relative h-full border-2 border-white/10 bg-gradient-to-br from-blue-900/20 to-transparent p-8 hover:border-blue-500 transition-all duration-300">
                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 border-l-2 border-b-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">Feature 01</div>
                      <h3 className="text-4xl font-black text-white mb-4">
                        SMART ESCROW<br />BOUNTIES
                      </h3>
                      <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
                        Funds locked in contract. Released only upon verified delivery.
                        <span className="text-blue-400 font-semibold"> No trust required</span>.
                      </p>
                    </div>

                    <div className="hidden md:block w-20 h-20 border-2 border-blue-500 bg-black/50 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Target className="w-10 h-10 text-blue-400" />
                    </div>
                  </div>

                  {/* Live Demo Panel */}
                  <div className="bg-black/80 border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-mono">ESCROW STATUS</div>
                          <div className="text-sm font-bold text-blue-400">LOCKED & SECURED</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">2.5 MNT</div>
                        <div className="text-xs text-gray-400">≈ $4,250</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                        <span>PROGRESS</span>
                        <span className="text-blue-400">100%</span>
                      </div>
                      <div className="h-1 bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5, duration: 2 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Reputation Feature - Stacked */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-4 group"
              >
                <div className="relative h-full border-2 border-white/10 bg-gradient-to-br from-purple-900/20 to-transparent p-6 hover:border-purple-400 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">Feature 02</div>

                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BadgeCheck className="w-9 h-9 text-white" />
                  </div>

                  <h3 className="text-3xl font-black text-white mb-4">
                    SOULBOUND<br />REPUTATION
                  </h3>

                  <p className="text-gray-300 mb-8 leading-relaxed">
                    Immutable work history as NFT badges. Your reputation, forever on-chain.
                  </p>

                  {/* Badge Display */}
                  <div className="space-y-3">
                    <div className="bg-black/80 border border-purple-500/30 p-3 flex items-center gap-3 hover:border-purple-500 transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black">
                        5
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">Level 5 Solver</div>
                        <div className="text-xs text-gray-400 font-mono">25 bounties completed</div>
                      </div>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>

                    <div className="bg-black/80 border border-white/10 p-3 flex items-center gap-3 opacity-50">
                      <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                        <span className="text-xs text-gray-500">?</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-400">Locked</div>
                        <div className="text-xs text-gray-500 font-mono">Complete more tasks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Process Flow - Dual Path */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-12"
              >
                <div className="border-2 border-white/10 p-8 bg-black/40">
                  <div className="text-xs font-mono text-gray-400 mb-8 uppercase tracking-wider">How it works</div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bounty Creator Path */}
                    <div className="border-2 border-blue-500/30 p-6 bg-blue-900/10">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-500/30">
                        <div className="w-10 h-10 bg-blue-500 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">AS A CREATOR</h3>
                          <p className="text-xs text-gray-400 font-mono uppercase">Post & manage bounties</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { num: "01", title: "CREATE BOUNTY", desc: "Lock funds in smart contract escrow" },
                          { num: "02", title: "REVIEW WORK", desc: "Evaluate submissions from solvers" },
                          { num: "03", title: "SELECT WINNER", desc: "Award bounty & reputation badge" }
                        ].map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-10 h-10 border-2 border-blue-500 flex items-center justify-center text-sm font-black text-blue-400 flex-shrink-0">
                              {step.num}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight">{step.title}</h4>
                              <p className="text-sm text-gray-400">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bounty Hunter Path */}
                    <div className="border-2 border-purple-500/30 p-6 bg-purple-900/10">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-500/30">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">AS A HUNTER</h3>
                          <p className="text-xs text-gray-400 font-mono uppercase">Find & complete bounties</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { num: "01", title: "FIND BOUNTY", desc: "Browse available tasks & rewards" },
                          { num: "02", title: "SUBMIT WORK", desc: "Complete task & deliver solution" },
                          { num: "03", title: "EARN REWARD", desc: "Get paid + soulbound NFT badge" }
                        ].map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-10 h-10 border-2 border-purple-500 flex items-center justify-center text-sm font-black text-purple-400 flex-shrink-0">
                              {step.num}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight">{step.title}</h4>
                              <p className="text-sm text-gray-400">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CONTRACTS SECTION - Terminal Style */}
        <section className="py-20 px-4 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Smart Contracts</span>
                </div>
                <h3 className="text-3xl font-black text-white">ON-CHAIN REGISTRY</h3>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 border border-white/20 bg-black/50">
                <span className="text-xs font-mono text-gray-400">MANTLE SEPOLIA</span>
                <div className="w-px h-4 bg-white/20" />
                <span className="text-xs font-mono text-blue-400">5003</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contractReferences.map((contract, idx) => {
                let Icon = Code2;
                if (contract.label.includes("Reputation")) Icon = BadgeCheck;
                if (contract.label.includes("NFT")) Icon = BadgeCheck;
                if (contract.label.includes("Core")) Icon = Cpu;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-black border border-white/10 p-4 hover:border-blue-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all">
                          <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {contract.label}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            v1.0.0
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-mono text-gray-400 break-all">
                        {contract.address.substring(0, 12)}...{contract.address.substring(30)}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(contract.address);
                          }}
                          className="flex-1 px-3 py-1.5 border border-white/10 hover:border-white/30 transition-all text-xs font-mono flex items-center justify-center gap-2"
                        >
                          {copiedAddress === contract.address ? (
                            <>
                              <Check className="w-3 h-3" /> COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> COPY
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://sepolia.mantlescan.xyz/address/${contract.address}`, '_blank');
                          }}
                          className="px-3 py-1.5 border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section - Bold */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                READY TO BUILD<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  ON-CHAIN?
                </span>
              </h2>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Join the trustless work economy. No middlemen. Just pure,
                <span className="text-white font-semibold"> on-chain collaboration</span>.
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="group inline-flex items-center gap-3 px-12 py-5 bg-blue-500 text-white font-black text-xl hover:scale-105 transition-all"
              >
                GET STARTED
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
