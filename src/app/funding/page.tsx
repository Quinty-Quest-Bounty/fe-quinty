"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ChevronRight, Rocket, Gift, Heart } from "lucide-react";

type FundingType = "looking-for-grant" | "grant-program" | "crowdfunding";

export default function FundingPage() {
 const router = useRouter();
 const [selectedType, setSelectedType] = useState<FundingType>("looking-for-grant");

 return (
 <div className="min-h-screen ">
 <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-6 sm:pb-8">
  {/* Breadcrumb Navigation */}
  <div className="mb-6 sm:mb-8">
  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300">
  <Breadcrumb>
   <BreadcrumbList>
   <BreadcrumbItem>
   <BreadcrumbLink
    onClick={() => router.push("/")}
    className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium "
   >
    Home
   </BreadcrumbLink>
   </BreadcrumbItem>
   <BreadcrumbSeparator>
   <ChevronRight className="h-4 w-4 text-foreground/40" />
   </BreadcrumbSeparator>
   <BreadcrumbItem>
   <BreadcrumbPage className="text-sm font-semibold text-[#0EA885]">Funding</BreadcrumbPage>
   </BreadcrumbItem>
   </BreadcrumbList>
  </Breadcrumb>
  </div>
  </div>

  {/* Page Header */}
  <div className="mb-8 sm:mb-10 rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg p-6 sm:p-8 transition-all duration-500">
  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Funding Platform</h1>
  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
  Discover funding opportunities, create grant programs, or launch crowdfunding campaigns
  </p>
  </div>

  {/* Type Selection Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
  <Card
  className={`group cursor-pointer rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 ${
   selectedType === "looking-for-grant"
   ? "ring-2 ring-[#0EA885] border-[#0EA885]/40 bg-[#0EA885]/5 backdrop-blur-xl shadow-xl"
   : "border-white/60 bg-white/70 backdrop-blur-xl shadow-lg opacity-70 hover:opacity-100"
  }`}
  onClick={() => setSelectedType("looking-for-grant")}
  >
  <CardContent className="pt-6 text-center">
   <div className="mb-4 flex justify-center">
   <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-[1.25rem] transition-all duration-300 shadow-md">
   <Rocket className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
   </div>
   </div>
   <h3 className="text-lg sm:text-xl font-bold mb-2">Looking for Grant</h3>
   <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
   Showcase your project to attract VCs and investors. Flexible funding - withdraw anytime.
   </p>
  </CardContent>
  </Card>

  <Card
  className={`group cursor-pointer rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 ${
   selectedType === "grant-program"
   ? "ring-2 ring-[#0EA885] border-[#0EA885]/40 bg-[#0EA885]/5 backdrop-blur-xl shadow-xl"
   : "border-white/60 bg-white/70 backdrop-blur-xl shadow-lg opacity-70 hover:opacity-100"
  }`}
  onClick={() => setSelectedType("grant-program")}
  >
  <CardContent className="pt-6 text-center">
   <div className="mb-4 flex justify-center">
   <div className="p-3 sm:p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-[1.25rem] transition-all duration-300 shadow-md">
   <Gift className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
   </div>
   </div>
   <h3 className="text-lg sm:text-xl font-bold mb-2">Offering a Grant</h3>
   <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
   VCs and orgs create grant programs to fund promising projects. Review applications and distribute funds.
   </p>
  </CardContent>
  </Card>

  <Card
  className={`group cursor-pointer rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 ${
   selectedType === "crowdfunding"
   ? "ring-2 ring-[#0EA885] border-[#0EA885]/40 bg-[#0EA885]/5 backdrop-blur-xl shadow-xl"
   : "border-white/60 bg-white/70 backdrop-blur-xl shadow-lg opacity-70 hover:opacity-100"
  }`}
  onClick={() => setSelectedType("crowdfunding")}
  >
  <CardContent className="pt-6 text-center">
   <div className="mb-4 flex justify-center">
   <div className="p-3 sm:p-4 bg-gradient-to-br from-pink-100 to-pink-50 rounded-[1.25rem] transition-all duration-300 shadow-md">
   <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-pink-600" />
   </div>
   </div>
   <h3 className="text-lg sm:text-xl font-bold mb-2">Crowdfunding</h3>
   <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
   All-or-nothing funding for social movements. Milestone-based fund release with transparent tracking.
   </p>
  </CardContent>
  </Card>
  </div>

  {/* Content Area */}
  <div className="mt-8">
  {selectedType === "looking-for-grant" && <LookingForGrantManager />}
  {selectedType === "grant-program" && <GrantProgramManager />}
  {selectedType === "crowdfunding" && <CrowdfundingManager />}
  </div>
 </div>
 </div>
 );
}
