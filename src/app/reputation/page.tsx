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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-6 sm:pb-8">
                {/* Reputation Display Component */}
                <ReputationDisplay />
            </div>
        </div>
    );
}
