"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "./ui/button";
import {
  Target,
  Scale,
  Trophy,
  Gift,
} from "lucide-react";

export default function Header() {
  const router = useRouter();

  const navigationItems = [
    { id: "bounties", label: "Bounties", icon: Target, path: "/bounties" },
    { id: "disputes", label: "Disputes", icon: Scale, path: "/disputes" },
    { id: "reputation", label: "Reputation", icon: Trophy, path: "/reputation" },
    { id: "airdrops", label: "Airdrops", icon: Gift, path: "/airdrops" },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => router.push("/")}
              >
                <h1 className="text-xl font-bold tracking-tight">Quinty</h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex">
                <div className="flex items-center space-x-1">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(item.path)}
                      className="flex items-center space-x-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </div>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 py-3 overflow-x-auto">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => router.push(item.path)}
                className="flex-shrink-0 flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
