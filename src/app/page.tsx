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
import {
  Target,
  Users,
  Coins,
  Network,
  BadgeCheck,
  ArrowRight,
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
    title: "Quests",
    description: "Launch your campaign, grow your movement, or complete tasks for rewards. Everything transparent.",
    icon: Rocket,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    colSpan: "col-span-1 md:col-span-1 lg:col-span-1",
  },
];

const contractReferences = [
  { label: "Quinty Core", address: "0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D" },
  { label: "Reputation", address: "0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e" },
  { label: "Soulbound NFT", address: "0xD49a54aFb982c0b76554e34f1A76851ed725405F" },
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
          {/* Sleek Minimal Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {/* Single elegant gradient mesh */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,168,133,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,168,133,0.12),rgba(0,0,0,0))]" />

            {/* Subtle noise texture for depth */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
            }} />

            {/* Minimal grid - very subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_100%_80%_at_50%_50%,#000_40%,transparent_80%)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]" />
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
              Escrow separates the committed from the curious.
              Quinty’s ensure funds are locked until work is verified—eliminating risk for both creators and funders.
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

          {/* Floating Elements (Parallax) - Sleek */}
          <motion.div style={{ y }} className="absolute top-40 left-[5%] lg:left-[15%] hidden lg:block pointer-events-none">
            <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-200/60 rotate-[-6deg] hover:rotate-0 transition-transform duration-500 dark:bg-black/40 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center dark:bg-green-500/10 border border-green-100/50 dark:border-green-500/20">
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
            <div className="bg-white/70 backdrop-blur-2xl p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-200/60 rotate-[6deg] hover:rotate-0 transition-transform duration-500 dark:bg-black/40 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center dark:bg-purple-500/10 border border-purple-100/50 dark:border-purple-500/20">
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
        <section className="min-h-screen flex flex-col items-center justify-center py-24 bg-gradient-to-b from-gray-50/50 to-white relative overflow-hidden perspective-1000 dark:from-gray-950/50 dark:to-black">

          {/* Minimal Elegant Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {/* Single soft gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(14,168,133,0.04),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(14,168,133,0.06),transparent)]" />

            {/* Minimal dot pattern */}
            <DotPattern className="absolute inset-0 h-full w-full fill-gray-200/20 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)] dark:fill-white/[0.02]" />
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
                The Future<br /> is Trustless.
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-medium dark:text-gray-400">
                See how Quinty replaces intermediaries with smart contracts.
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
                      <span className="text-[10px] font-medium text-gray-600 font-mono tracking-wide dark:text-gray-400">base.quinty.io</span>
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
        <section id="features" className="py-24 bg-white dark:bg-black relative overflow-hidden">
          {/* Enhanced Dramatic Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {/* Multi-layered gradient with animation */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(14,168,133,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(14,168,133,0.15),transparent_50%)] animate-pulse-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.05),transparent_40%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_40%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.04),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.07),transparent_40%)]" />

            {/* Animated grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)]" />

            {/* Floating orbs for depth */}
            <motion.div
              className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                x: [0, -50, 0],
                y: [0, -30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="container px-4 mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-200/60 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 mb-8 shadow-lg shadow-blue-500/10 dark:border-blue-500/30 dark:from-blue-500/10 dark:to-purple-500/10 dark:text-blue-400 dark:shadow-blue-500/20"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400 shadow-lg shadow-blue-500/50"></span>
                </span>
                <span className="text-xs font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Core Primitives</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 mb-6 tracking-tight drop-shadow-lg dark:from-white dark:via-gray-100 dark:to-white leading-tight"
              >
                Complete Tooling for <br className="hidden md:block" /> the On-Chain Economy.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium dark:text-gray-300"
              >
                Don't just transact—<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold dark:from-blue-400 dark:to-purple-400">collaborate</span>. Quinty provides the essential building blocks for DAOs, grants, and freelance work without intermediaries.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Feature 1: Bounties (Large) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="col-span-1 md:col-span-2 group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 p-8 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 dark:border-blue-500/20 dark:from-white/5 dark:to-blue-500/5 dark:hover:border-blue-500/60 dark:hover:shadow-blue-500/30 backdrop-blur-sm"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900 mb-2 dark:from-white dark:to-blue-300">Smart Escrow Bounties</h3>
                      <p className="text-sm text-slate-600 max-w-md leading-relaxed dark:text-gray-300">Funds are locked in contract. Released only upon verified delivery.</p>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 dark:shadow-blue-500/60 border-2 border-white/20"
                    >
                      <Target className="h-7 w-7" />
                    </motion.div>
                  </div>
                  {/* Mini UI */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 p-4 shadow-lg flex items-center gap-3 mt-4 group-hover:shadow-xl group-hover:border-blue-300 transition-all duration-300 dark:bg-black/60 dark:border-blue-500/30 dark:group-hover:border-blue-500/60">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50"
                    >
                      <Lock className="h-5 w-5 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-2 dark:text-gray-400">
                        <span>Status</span>
                        <span className="text-blue-600 dark:text-blue-400 animate-pulse">Escrow Locked</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-gray-800 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.7)]"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">2.5 ETH</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2: Reputation (Small) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="col-span-1 group relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-white to-purple-50/30 p-6 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 dark:border-purple-500/20 dark:from-white/5 dark:to-purple-500/5 dark:hover:border-purple-500/60 dark:hover:shadow-purple-500/30 backdrop-blur-sm"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="mb-4">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-500/40 dark:shadow-purple-500/60 border-2 border-white/20"
                    >
                      <BadgeCheck className="h-7 w-7" />
                    </motion.div>
                    <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-purple-900 mb-2 dark:from-white dark:to-purple-300">Soulbound Reputation</h3>
                    <p className="text-sm text-slate-600 leading-relaxed dark:text-gray-300">Immutable work history.</p>
                  </div>
                  {/* Mini UI */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 p-3 shadow-lg text-center group-hover:shadow-xl group-hover:border-purple-300 transition-all duration-300 dark:bg-black/60 dark:border-purple-500/30 dark:group-hover:border-purple-500/60">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[11px] font-bold text-white shadow-lg shadow-purple-500/50 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Level 5 Solver
                    </motion.span>
                  </div>
                </div>
              </motion.div>







              {/* Feature 3: Quest Bounties (Large) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="col-span-1 md:col-span-3 group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 p-8 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 dark:border-blue-500/20 dark:from-white/5 dark:to-blue-500/5 dark:hover:border-blue-500/60 dark:hover:shadow-blue-500/30 backdrop-blur-sm"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="mb-4">
                    <motion.div
                      whileHover={{ y: -5, scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/40 dark:shadow-blue-500/60 border-2 border-white/20"
                    >
                      <Rocket className="h-7 w-7" />
                    </motion.div>
                    <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900 mb-2 dark:from-white dark:to-blue-300">Quests</h3>
                    <p className="text-sm text-slate-600 leading-relaxed dark:text-gray-300">Launch your campaign, grow your movement, or complete tasks for rewards. Everything transparent and on-chain.</p>
                  </div>
                  {/* Mini UI */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 p-4 shadow-lg text-center group-hover:shadow-xl group-hover:border-blue-300 transition-all duration-300 dark:bg-black/60 dark:border-blue-500/30 dark:group-hover:border-blue-500/60">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/50 cursor-pointer"
                    >
                      <Zap className="h-4 w-4" /> Quest Live & Verified
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              {/* Social Verification - Full Width Panel */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                whileHover={{ y: -3 }}
                className="col-span-1 md:col-span-3 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-400/60 transition-all duration-500 dark:border-blue-500/20 dark:bg-gradient-to-br dark:from-white/5 dark:via-blue-500/5 dark:to-purple-500/5 dark:hover:border-blue-500/40 dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-sm relative overflow-hidden"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="max-w-lg relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Globe className="w-5 h-5 text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </motion.div>
                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 uppercase tracking-wide dark:from-blue-400 dark:to-purple-400">Social Verification</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900 mb-3 dark:from-white dark:to-blue-300">Proof you're really you.</h3>
                  <p className="text-sm text-slate-600 leading-relaxed dark:text-gray-300">
                    Link your X (Twitter) account to your on-chain identity.
                    Prove ownership without doxxing.
                  </p>
                </div>

                <div className="flex-shrink-0 relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 bg-white/90 backdrop-blur-sm pl-4 pr-6 py-4 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all duration-300 dark:bg-black/60 dark:border-blue-500/30 dark:hover:border-blue-500/60 dark:shadow-blue-500/10"
                  >
                    <div className="relative">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shadow-md dark:from-gray-800 dark:to-gray-700"
                      >
                        <Image src="/images/quinty-logo.png" alt="User" fill className="object-contain p-2" style={{ filter: 'brightness(0%)' }} />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 bg-gradient-to-br from-green-400 to-green-600 text-white p-1 rounded-full border-2 border-white shadow-lg shadow-green-500/50 dark:border-black"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-300">@QuintyLabs</div>
                      <div className="text-[10px] text-slate-500 font-mono dark:text-gray-400">Verified via X</div>
                    </div>
                    <div className="ml-4 h-10 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-white/10" />
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 text-xs h-auto py-2 px-4 font-bold rounded-full transition-all duration-300 dark:text-blue-400 dark:hover:text-white shadow-sm hover:shadow-md">
                      Connect
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Protocol Registry Section --- */}
        <section className="py-16 border-t border-gray-100 bg-gradient-to-b from-gray-50/30 to-white relative dark:border-white/5 dark:from-gray-950/30 dark:to-black overflow-hidden">
          {/* Minimal refined background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {/* Subtle centered gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(14,168,133,0.02),transparent)] dark:bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(14,168,133,0.04),transparent)]" />

            {/* Minimal dot pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#00000002_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[radial-gradient(circle_at_center,#ffffff02_1px,transparent_1px)]" />
          </div>

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
                if (contract.label.includes("NFT")) Icon = Coins;
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