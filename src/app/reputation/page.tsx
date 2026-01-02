"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ReputationDisplay from "../../components/ReputationDisplay";
import { BadgeCheck } from "lucide-react";

export default function ReputationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 relative z-10">
        {/* Page Header - Brutalist Style */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-gray-900 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tight leading-none">
                REPUTATION
              </h1>
              <p className="text-sm font-mono text-gray-600 mt-1 uppercase tracking-wider">
                SOULBOUND NFT ACHIEVEMENTS
              </p>
            </div>
          </div>

          {/* Horizontal accent line */}
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>

        {/* Reputation Display Component */}
        <ReputationDisplay />
      </div>
    </div>
  );
}
