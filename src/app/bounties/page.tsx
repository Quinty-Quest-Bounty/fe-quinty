"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BountyManager from "../../components/BountyManager";
import { Target } from "lucide-react";

export default function BountiesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 relative z-10">
        {/* Page Header - Brutalist Style */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tight leading-none">
                BOUNTIES
              </h1>
              <p className="text-sm font-mono text-gray-600 mt-1 uppercase tracking-wider">
                ESCROWED WORK MARKETPLACE
              </p>
            </div>
          </div>

          {/* Horizontal accent line */}
          <div className="h-1 w-32 bg-blue-500" />
        </div>

        {/* Bounty Manager Component */}
        <BountyManager />
      </div>
    </div>
  );
}
