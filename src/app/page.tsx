"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView, useSpring } from "framer-motion";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Footer } from "../components/Footer";
import { Safari } from "../components/ui/safari";
import DotPattern from "../components/ui/dot-pattern";
import { AnnouncementModal } from "../components/AnnouncementModal";
import { AnnouncementBanner } from "../components/AnnouncementBanner";
import { SmoothCursor } from "../components/ui/smooth-cursor";
import {
  Target,
  Users,
  Coins,
  Network,
  BadgeCheck,
  Vote,
  Landmark,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  Code2,
  Copy,
  Check,
  Terminal,
  Cpu,
  Github,
  Wallet,
  Lock,
  Rocket, // Added
  ExternalLink // Added
} from "lucide-react";

// Feature Data
const features = [
  {
    title: "On-Chain Bounties",
    description: "Lock ETH in smart contracts. Payments are guaranteed upon successful delivery. No more chasing invoices.",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-50",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
  },
  {
    title: "Soulbound Reputation",
    description: "Every completed task mints an immutable NFT. Build a verifiable CV that follows you across Web3.",
    icon: BadgeCheck,
    color: "text-purple-600",
    bg: "bg-purple-50",
    colSpan: "col-span-1 md:col-span-1 lg:col-span-1",
  },
  {
    title: "Community Disputes",
    description: "Disagreements are resolved by a decentralized court. Stakers vote on fair outcomes, enforcing justice in code.",
    icon: Vote,
    color: "text-orange-600",
    bg: "bg-orange-50",
    colSpan: "col-span-1 md:col-span-1 lg:col-span-1",
  },
  {
    title: "Frictionless Grants",
    description: "Streamlined funding for builders. Milestone-based payouts ensure capital efficiency and accountability.",
    icon: Coins,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
  },
];

const contractReferences = [
  { label: "Quinty Core", address: "0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D" },
  { label: "Reputation", address: "0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e" },
  { label: "Dispute Resolver", address: "0x961659d12E9dE91dC543A75911b3b0D269769E82" },
  { label: "Soulbound NFT", address: "0xD49a54aFb982c0b76554e34f1A76851ed725405F" },
  { label: "Grant Program", address: "0x8b0B50732CCfB6308d5A63C1F9D70166DF63b661" },
  { label: "Crowdfunding", address: "0x0bf8d6EB00b3C4cA6a9F1CFa6Cd40b4cE486F885" },
];

export default function Home() {
  const router = useRouter();
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -100]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const hasSeenAnnouncement = localStorage.getItem("hasSeenAnnouncement");
    if (!hasSeenAnnouncement) {
      const timer = setTimeout(() => setIsAnnouncementModalOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-black text-foreground relative selection:bg-[#0EA885]/20 overflow-x-hidden font-sans">
      <SmoothCursor />
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => {
          setIsAnnouncementModalOpen(false);
          localStorage.setItem("hasSeenAnnouncement", "true");
        }}
      />
      <AnnouncementBanner onClick={() => setIsAnnouncementModalOpen(true)} />

      <main className="relative z-10">
        {/* --- Hero Section --- */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
             <div className="absolute -top-[30%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-br from-[#0EA885]/20 to-blue-400/20 rounded-full blur-[120px] opacity-60 animate-blob mix-blend-multiply dark:from-[#0EA885]/10 dark:to-blue-400/10" />
             <div className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-300/20 to-purple-400/20 rounded-full blur-[100px] opacity-60 animate-blob animation-delay-2000 mix-blend-multiply dark:from-emerald-300/10 dark:to-purple-400/10" />
             <div className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] bg-gradient-to-t from-blue-300/20 to-[#0EA885]/20 rounded-full blur-[120px] opacity-60 animate-blob animation-delay-4000 mix-blend-multiply dark:from-blue-300/10 dark:to-[#0EA885]/10" />
             <DotPattern className="absolute inset-0 h-full w-full fill-gray-200/50 mask-radial-gradient dark:fill-white/5" />
          </div>

          <div className="container px-4 mx-auto text-center relative z-10 py-20 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-emerald-100/50 backdrop-blur-md mb-8 shadow-sm hover:shadow-md transition-all cursor-pointer group dark:bg-black/40 dark:border-gray-800"
              onClick={() => setIsAnnouncementModalOpen(true)}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0EA885] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0EA885]"></span>
              </span>
              <span className="text-xs font-semibold text-gray-600 tracking-wide uppercase group-hover:text-[#0EA885] transition-colors dark:text-gray-300">
                Live on Base Sepolia
              </span>
              <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-[#0EA885] transition-colors dark:text-gray-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
              className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[0.95]"
            >
              <span className="block text-gray-900 dark:text-white">If You Don't Lock It,</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0EA885] via-emerald-500 to-teal-600 animate-gradient bg-[length:200%_auto]">
                You Don't Mean It.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium dark:text-gray-400"
            >
              The trustless collaboration layer. 
              Escrow payments, build on-chain reputation, and resolve disputes without intermediaries.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="h-14 px-10 text-base md:text-lg bg-[#0EA885] hover:bg-[#0b8a6c] text-white rounded-full shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group relative overflow-hidden"
                onClick={() => router.push("/dashboard")}
              >
                <span className="relative z-10 flex items-center">
                  Launch App <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-10 text-base md:text-lg rounded-full border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-gray-300 transition-all dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How it works
              </Button>
            </motion.div>
          </div>

          {/* Floating Elements (Parallax) - Dark Mode */}
          <motion.div style={{ y }} className="absolute top-40 left-[5%] lg:left-[15%] hidden lg:block pointer-events-none">
            <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 rotate-[-6deg] hover:rotate-0 transition-transform duration-500 dark:bg-black/40 dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-500/20 border border-green-100 dark:border-green-500/20">
                    <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                 </div>
                 <div>
                    <div className="text-xs text-gray-500 font-medium dark:text-gray-400">Escrow Locked</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">12.5 ETH</div>
                 </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div style={{ y: useTransform(y, val => val * -0.8) }} className="absolute bottom-40 right-[5%] lg:right-[12%] hidden lg:block pointer-events-none">
            <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 rotate-[6deg] hover:rotate-0 transition-transform duration-500 dark:bg-black/40 dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-500/20 border border-purple-100 dark:border-purple-500/20">
                    <BadgeCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div>
                    <div className="text-xs text-gray-500 font-medium dark:text-gray-400">Reputation Minted</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Level 5 Solver</div>
                 </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Platform Preview - Cinematic Section */}
        <section className="min-h-screen flex flex-col items-center justify-center py-24 bg-gradient-to-b from-white via-slate-50 to-gray-100 relative overflow-hidden perspective-1000 dark:from-black dark:via-gray-950 dark:to-gray-900">
          
          {/* Ambient Background Effects */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
             {/* Dynamic gradient orbs */}
             <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-emerald-100/40 to-blue-100/40 rounded-full blur-[120px] animate-pulse-slow dark:from-emerald-500/10 dark:to-blue-500/10" />
             <DotPattern className="absolute inset-0 h-full w-full fill-gray-200/40 mask-radial-gradient dark:fill-white/5" />
          </div>

          <div className="container px-4 mx-auto relative z-20">
             <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
             >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 backdrop-blur-md mb-8 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                   <div className="w-2 h-2 rounded-full bg-[#0EA885] animate-pulse" />
                   <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Platform Walkthrough</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600 mb-8 tracking-tight drop-shadow-sm dark:from-white dark:to-gray-400">
                   The Future of Work <br /> is Trustless.
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-medium dark:text-gray-400">
                   See how Quinty replaces intermediaries with smart contracts. 
                   From bounty creation to dispute resolution.
                </p>
             </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 40, rotateX: 10 }}
               whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1, type: "spring", bounce: 0.2 }}
               className="max-w-5xl mx-auto relative"
            >
               {/* The "Glass" Window Frame - Fits Video Perfectly */}
               <div className="relative rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden ring-1 ring-black/5 group dark:border-white/10 dark:bg-black/40 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:ring-white/5">
                  
                  {/* Window Header - Compact Light */}
                  <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm dark:border-white/5 dark:bg-black/40">
                     <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] border border-black/5 dark:border-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] border border-black/5 dark:border-white/10" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840] border border-black/5 dark:border-white/10" />
                     </div>
                     <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-gray-200 shadow-sm transition-shadow group-hover:shadow-md dark:bg-black/50 dark:border-gray-700">
                           <Lock className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500" />
                           <span className="text-[10px] font-medium text-gray-600 font-mono tracking-wide dark:text-gray-400">quinty.xyz</span>
                        </div>
                     </div>
                     <div className="w-10" /> {/* Spacer */}
                  </div>

                  {/* Video Container */}
                  <div className="relative aspect-video w-full bg-gray-50 dark:bg-black">
                     <iframe
                        className="w-full h-full absolute inset-0"
                        src="https://www.youtube.com/embed/vTZMOdl3WVM?si=PegUg2l_zLAOeva3&autoplay=1&mute=1&loop=1&playlist=vTZMOdl3WVM&controls=0&showinfo=0&modestbranding=1"
                        title="Quinty Platform Demo"
                        style={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                     />
                  </div>
               </div>

               {/* Subtle Glow Reflection */}
               <div className="absolute -inset-4 -z-10 bg-gradient-to-b from-emerald-500/20 to-transparent blur-2xl opacity-40 rounded-[2rem] dark:from-emerald-500/10" />
            </motion.div>
          </div>
        </section>

        {/* --- Core Capabilities Section --- */}
        <section id="features" className="py-24 bg-white dark:bg-[#050505] relative overflow-hidden">
          <div className="container px-4 mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 mb-8 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
                 <span className="text-xs font-bold tracking-widest uppercase">Core Primitives</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500 mb-6 tracking-tight drop-shadow-sm dark:from-white dark:via-gray-200 dark:to-gray-500">
                Complete Tooling for <br className="hidden md:block" /> the On-Chain Economy.
              </h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium dark:text-gray-400">
                Don't just transact—collaborate. Quinty provides the essential building blocks for DAOs, grants, and freelance work without intermediaries.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {/* Feature 1: Bounties (Large) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="col-span-1 md:col-span-2 group relative overflow-hidden rounded-xl border border-slate-200 bg-white/50 p-6 hover:border-blue-200 transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-500/50 dark:hover:bg-white/[0.07]"
              >
                <div className="flex flex-col h-full justify-between">
                   <div className="flex items-start justify-between mb-4">
                      <div>
                         <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-white">Smart Escrow Bounties</h3>
                         <p className="text-sm text-slate-500 max-w-md dark:text-gray-400">Funds are locked in contract. Released only upon verified delivery.</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                         <Target className="h-5 w-5" />
                      </div>
                   </div>
                   {/* Mini UI */}
                   <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm flex items-center gap-3 mt-4 group-hover:shadow-md transition-shadow dark:bg-black/40 dark:border-white/5 dark:group-hover:border-blue-500/30">
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center dark:bg-blue-500/20">
                         <Lock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1 dark:text-gray-500">
                            <span>Status</span>
                            <span className="text-blue-600 dark:text-blue-400">Escrow Locked</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-gray-800">
                            <div className="h-full w-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-bold text-slate-900 dark:text-white">2.5 ETH</div>
                      </div>
                   </div>
                </div>
              </motion.div>

              {/* Feature 2: Reputation (Small) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="col-span-1 group relative overflow-hidden rounded-xl border border-slate-200 bg-white/50 p-6 hover:border-purple-200 transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-purple-500/50 dark:hover:bg-white/[0.07]"
              >
                 <div className="flex flex-col h-full justify-between">
                    <div className="mb-4">
                       <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-3 border border-purple-100 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/20">
                          <BadgeCheck className="h-5 w-5" />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-white">Soulbound Rep</h3>
                       <p className="text-sm text-slate-500 dark:text-gray-400">Immutable work history.</p>
                    </div>
                    {/* Mini UI */}
                    <div className="bg-white rounded-lg border border-slate-100 p-2 shadow-sm text-center dark:bg-black/40 dark:border-white/5 dark:group-hover:border-purple-500/30">
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-[10px] font-bold text-purple-600 border border-purple-100 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Level 5 Solver
                       </span>
                    </div>
                 </div>
              </motion.div>

              {/* Feature 3: Disputes (Small) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="col-span-1 group relative overflow-hidden rounded-xl border border-slate-200 bg-white/50 p-6 hover:border-orange-200 transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-orange-500/50 dark:hover:bg-white/[0.07]"
              >
                 <div className="flex flex-col h-full justify-between">
                    <div className="mb-4">
                       <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-3 border border-orange-100 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/20">
                          <Vote className="h-5 w-5" />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-white">Community Court</h3>
                       <p className="text-sm text-slate-500 dark:text-gray-400">Stake-weighted resolution.</p>
                    </div>
                    {/* Mini UI */}
                    <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm flex justify-center gap-1 dark:bg-black/40 dark:border-white/5 dark:group-hover:border-orange-500/30">
                       {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`h-4 w-1 rounded-full ${i === 3 ? 'bg-orange-500 h-6 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-orange-200 dark:bg-orange-900/40'}`} />
                       ))}
                    </div>
                 </div>
              </motion.div>

              {/* Feature 4: Grants (Large) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="col-span-1 md:col-span-2 group relative overflow-hidden rounded-xl border border-slate-200 bg-white/50 p-6 hover:border-emerald-200 transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/50 dark:hover:bg-white/[0.07]"
              >
                <div className="flex flex-col h-full justify-between">
                   <div className="flex items-start justify-between mb-4">
                      <div>
                         <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-white">Milestone-Based Grants</h3>
                         <p className="text-sm text-slate-500 max-w-md dark:text-gray-400">Automated payouts triggered by milestone completion. Capital efficiency.</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                         <Coins className="h-5 w-5" />
                      </div>
                   </div>
                   {/* Mini UI */}
                   <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm mt-4 group-hover:shadow-md transition-shadow dark:bg-black/40 dark:border-white/5 dark:group-hover:border-emerald-500/30">
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Grant #402 Active</span>
                         </div>
                         <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500">2/3 Milestones</span>
                      </div>
                      <div className="flex gap-1 h-2">
                         <div className="flex-1 bg-emerald-500 rounded-l-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                         <div className="flex-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                         <div className="flex-1 bg-slate-100 rounded-r-full dark:bg-gray-800" />
                      </div>
                   </div>
                </div>
              </motion.div>
              
              {/* Social Verification - Full Width Panel */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="col-span-1 md:col-span-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-500 dark:border-white/10 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.02] dark:hover:border-blue-500/30 dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                >
                  <div className="max-w-lg">
                     <div className="flex items-center gap-2 mb-3">
                       <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                       <span className="text-xs font-bold text-blue-500 uppercase tracking-wide dark:text-blue-400">ZK Identity</span>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2 dark:text-white">Connect your Socials. Privately.</h3>
                     <p className="text-sm text-slate-500 leading-relaxed dark:text-gray-400">
                       Link your X (Twitter) account to your on-chain identity using Zero-Knowledge proofs. 
                       Prove ownership without doxxing your wallet address history.
                     </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                     <div className="flex items-center gap-3 bg-white pl-4 pr-6 py-3 rounded-full border border-slate-200 shadow-sm group-hover:border-blue-200 transition-colors dark:bg-black/40 dark:border-white/10 dark:group-hover:border-blue-500/30">
                        <div className="relative">
                           <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden dark:bg-gray-800">
                              <Image src="/images/quinty-logo.png" alt="User" fill className="object-contain p-1.5" />
                           </div>
                           <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white dark:border-black">
                              <Check className="w-2.5 h-2.5" />
                           </div>
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-900 dark:text-white">@quinty_xyz</div>
                           <div className="text-[10px] text-slate-400 font-mono dark:text-gray-500">Verified via ZK-Snark</div>
                        </div>
                        <div className="ml-4 h-8 w-px bg-slate-100 dark:bg-white/10" />
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-auto py-1.5 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10">
                           Connect
                        </Button>
                     </div>
                  </div>
               </motion.div>
            </div>
          </div>
        </section>

        {/* --- Protocol Registry Section --- */}
        <section className="py-16 border-t border-slate-100 bg-white relative dark:border-white/5 dark:bg-[#050505]">
           <div className="container px-4 mx-auto max-w-6xl relative z-10">
              {/* Compact Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#0EA885] animate-pulse" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest dark:text-white">
                       Smart Contract
                    </h2>
                    <span className="hidden sm:inline-block w-px h-4 bg-slate-200 mx-2 dark:bg-white/10" />
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline-block dark:text-gray-500">v0.0.1</span>
                 </div>
                 
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 dark:bg-white/5 dark:border-white/10">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide dark:text-gray-300">Base Sepolia</span>
                    <span className="text-[10px] font-mono text-slate-400 border-l border-slate-200 pl-2 ml-1 dark:border-white/10 dark:text-gray-500">84532</span>
                 </div>
              </div>

              {/* High-Density Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {contractReferences.map((contract, idx) => {
                    let Icon = Code2;
                    if (contract.label.includes("Reputation")) Icon = BadgeCheck;
                    if (contract.label.includes("Dispute")) Icon = Shield;
                    if (contract.label.includes("NFT")) Icon = Coins;
                    if (contract.label.includes("Grant")) Icon = Rocket;
                    if (contract.label.includes("Crowd")) Icon = Users;
                    if (contract.label.includes("Core")) Icon = Cpu;

                    return (
                      <motion.div
                         key={contract.address}
                         initial={{ opacity: 0, y: 10 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.3, delay: idx * 0.05 }}
                         className="group flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-[#0EA885]/30 hover:shadow-lg hover:shadow-[#0EA885]/5 transition-all duration-300 cursor-default dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                      >
                         <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 h-9 w-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#0EA885] group-hover:bg-[#0EA885]/5 transition-colors dark:bg-black/40 dark:border-white/5">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors dark:text-gray-300 dark:group-hover:text-white">
                                  {contract.label}
                               </span>
                               <span className="text-[10px] font-mono text-slate-400 truncate group-hover:text-[#0EA885]/70 transition-colors dark:text-gray-600">
                                  {contract.address.substring(0, 6)}...{contract.address.substring(38)}
                               </span>
                            </div>
                         </div>

                         <div className="flex items-center gap-1 pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleCopy(contract.address)}
                               className="h-7 w-7 text-slate-400 hover:text-[#0EA885] hover:bg-[#0EA885]/10 rounded dark:text-gray-500 dark:hover:text-[#0EA885] dark:hover:bg-[#0EA885]/10"
                            >
                               {copiedAddress === contract.address ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => window.open(`https://sepolia.basescan.org/address/${contract.address}`, '_blank')}
                               className="h-7 w-7 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
                            >
                               <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                         </div>
                      </motion.div>
                    );
                 })}
              </div>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}