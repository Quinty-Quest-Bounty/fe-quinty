"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { BountySidebar } from "../../components/BountySidebar";
import { Menu } from "lucide-react";

export default function BountiesLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const bountyId = params.id as string;
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Always show sidebar in the bounties section
    const isDetailPage = true;

    return (
        <div className="min-h-screen relative">
            {/* Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />

            {isDetailPage && (
                <>
                    <BountySidebar
                        currentBountyId={bountyId}
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="hidden lg:flex fixed top-20 left-4 z-40 p-2 border-2 border-gray-900 bg-white hover:bg-blue-50 hover:border-blue-500 transition-all shadow-lg"
                            title="Open sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}
                </>
            )}
            <div className={`${isDetailPage && sidebarOpen ? 'lg:ml-80' : ''} transition-all duration-300`}>
                {children}
            </div>
        </div>
    );
}
