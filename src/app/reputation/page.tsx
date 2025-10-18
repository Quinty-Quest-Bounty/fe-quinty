"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ReputationDisplay from "../../components/ReputationDisplay";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

export default function ReputationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen ">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-300">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => router.push("/")}
                    className="cursor-pointer hover:text-[#0EA885] transition-all duration-300 text-sm font-medium active:scale-95"
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-foreground/40" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold text-[#0EA885]">Reputation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Reputation Display Component */}
        <ReputationDisplay />
      </div>
    </div>
  );
}
