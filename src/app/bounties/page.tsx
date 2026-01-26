"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BountyManager from "../../components/BountyManager";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

export default function BountiesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
                {/* Bounty Manager Component */}
                <BountyManager />
            </div>
        </div>
    );
}
