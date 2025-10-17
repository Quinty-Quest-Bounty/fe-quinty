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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => router.push("/")}
                className="cursor-pointer hover:text-foreground transition-colors"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Funding</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Funding Platform</h1>
          <p className="text-muted-foreground text-lg">
            Discover funding opportunities, create grant programs, or launch crowdfunding campaigns
          </p>
        </div>

        {/* Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className={`cursor-pointer rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${
              selectedType === "looking-for-grant"
                ? "ring-2 ring-primary"
                : "opacity-70"
            }`}
            onClick={() => setSelectedType("looking-for-grant")}
          >
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-blue-100 rounded-[1.25rem] transition-all duration-300 hover:scale-110">
                  <Rocket className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Looking for Grant</h3>
              <p className="text-sm text-muted-foreground">
                Showcase your project to attract VCs and investors. Flexible funding - withdraw anytime.
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${
              selectedType === "grant-program"
                ? "ring-2 ring-primary"
                : "opacity-70"
            }`}
            onClick={() => setSelectedType("grant-program")}
          >
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-green-100 rounded-[1.25rem] transition-all duration-300 hover:scale-110">
                  <Gift className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Offering a Grant</h3>
              <p className="text-sm text-muted-foreground">
                VCs and orgs create grant programs to fund promising projects. Review applications and distribute funds.
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer rounded-[1.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${
              selectedType === "crowdfunding"
                ? "ring-2 ring-primary"
                : "opacity-70"
            }`}
            onClick={() => setSelectedType("crowdfunding")}
          >
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-pink-100 rounded-[1.25rem] transition-all duration-300 hover:scale-110">
                  <Heart className="h-8 w-8 text-pink-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Crowdfunding</h3>
              <p className="text-sm text-muted-foreground">
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
