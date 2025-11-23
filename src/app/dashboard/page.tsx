"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import BountyManager from "../../components/BountyManager";
import AirdropManager from "../../components/AirdropManager";
import LookingForGrantManager from "../../components/LookingForGrantManager";
import GrantProgramManager from "../../components/GrantProgramManager";
import CrowdfundingManager from "../../components/CrowdfundingManager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  ChevronRight,
  Target,
  Gift,
  Rocket,
  Heart,
  Coins,
  LayoutDashboard
} from "lucide-react";

type DashboardSection = "all" | "bounties" | "airdrops" | "looking-for-grant" | "grant-program" | "crowdfunding";

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>("all");

  const sections = [
    { id: "all" as const, label: "All", icon: LayoutDashboard, color: "from-purple-500 to-pink-500" },
    { id: "bounties" as const, label: "Bounties", icon: Target, color: "from-orange-500 to-red-500" },
    { id: "airdrops" as const, label: "Airdrops", icon: Coins, color: "from-yellow-500 to-orange-500" },
    { id: "looking-for-grant" as const, label: "Looking for Grant", icon: Rocket, color: "from-blue-500 to-cyan-500" },
    { id: "grant-program" as const, label: "Grant Program", icon: Gift, color: "from-green-500 to-emerald-500" },
    { id: "crowdfunding" as const, label: "Crowdfunding", icon: Heart, color: "from-pink-500 to-rose-500" },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => router.push("/")}
                    className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium"
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-foreground/40" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold text-[#0EA885]">
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8 sm:mb-10 rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-6 sm:p-8 transition-all duration-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-[#0EA885]/20 to-[#0EA885]/10 rounded-[1.25rem]">
              <LayoutDashboard className="h-8 w-8 text-[#0EA885]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            View all bounties, airdrops, and funding opportunities in one place
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-2">
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <Button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    variant={isActive ? "default" : "ghost"}
                    className={`
                      flex items-center gap-2 rounded-[1rem] transition-all duration-300 flex-1 sm:flex-none
                      ${isActive
                        ? `bg-gradient-to-r ${section.color} text-white shadow-md hover:shadow-lg`
                        : "hover:bg-white/50"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                    <span className="sm:hidden">{section.label.split(' ')[0]}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Bounties Section */}
          {(activeSection === "all" || activeSection === "bounties") && (
            <div className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-[1.25rem] backdrop-blur-sm">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Bounties</h2>
                    <p className="text-white/90 text-sm sm:text-base">Task-based rewards for the community</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <BountyManager />
              </div>
            </div>
          )}

          {/* Airdrops Section */}
          {(activeSection === "all" || activeSection === "airdrops") && (
            <div className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-[1.25rem] backdrop-blur-sm">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Airdrops</h2>
                    <p className="text-white/90 text-sm sm:text-base">Token distributions and rewards</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <AirdropManager />
              </div>
            </div>
          )}

          {/* Looking for Grant Section */}
          {(activeSection === "all" || activeSection === "looking-for-grant") && (
            <div className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-[1.25rem] backdrop-blur-sm">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Looking for Grant</h2>
                    <p className="text-white/90 text-sm sm:text-base">Projects seeking funding</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <LookingForGrantManager />
              </div>
            </div>
          )}

          {/* Grant Program Section */}
          {(activeSection === "all" || activeSection === "grant-program") && (
            <div className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-[1.25rem] backdrop-blur-sm">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Grant Programs</h2>
                    <p className="text-white/90 text-sm sm:text-base">Available funding opportunities</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <GrantProgramManager />
              </div>
            </div>
          )}

          {/* Crowdfunding Section */}
          {(activeSection === "all" || activeSection === "crowdfunding") && (
            <div className="rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-[1.25rem] backdrop-blur-sm">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Crowdfunding</h2>
                    <p className="text-white/90 text-sm sm:text-base">Community-powered campaigns</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <CrowdfundingManager />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
