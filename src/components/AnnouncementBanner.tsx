"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface AnnouncementBannerProps {
  onClick: () => void;
}

export function AnnouncementBanner({ onClick }: AnnouncementBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 sm:top-20 md:top-24 z-40 flex justify-center px-3">
      <motion.button
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, type: "spring", bounce: 0.3 }}
        onClick={onClick}
        className="pointer-events-auto group relative flex items-center gap-2 sm:gap-2.5 rounded-full border-2 border-[#0EA885]/30 bg-gradient-to-r from-[#0EA885]/95 to-teal-600/95 px-4 py-2 sm:px-5 sm:py-2.5 shadow-lg backdrop-blur-xl transition-all duration-300   hover:border-[#0EA885]/50 "
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 rounded-full bg-[#0EA885]/20 blur-md group-hover:blur-lg transition-all duration-300" />

        {/* Content */}
        <div className="relative flex items-center gap-2 sm:gap-2.5">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
            🎉 Now on Mantle Network
          </span>
          <span className="hidden sm:inline text-xs sm:text-sm text-white/90">
            — Click to learn more
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse sm:hidden" />
        </div>

        {/* Shine animation */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
        </div>
      </motion.button>
    </div>
  );
}
