"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Target } from "lucide-react";

const navItems = [
  {
    name: "Bounties",
    link: "/bounties",
  },
  {
    name: "Disputes",
    link: "/disputes",
  },
  {
    name: "Reputation",
    link: "/reputation",
  },
  {
    name: "Airdrops",
    link: "/airdrops",
  },
];

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4">
      <Navbar className="pointer-events-auto !fixed top-4 left-0 right-0 w-full px-4 sm:px-6">
        <NavBody className="mx-auto w-full border border-primary/20 bg-background/90 px-4 backdrop-blur-xl lg:flex">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-background"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Target className="h-4 w-4 text-primary" />
            </span>
            Quinty
          </button>
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
            className="text-foreground"
          />
          <div className="hidden items-center gap-3 lg:flex">
            <div className="hidden sm:block">
              <ConnectButton
                accountStatus="avatar"
                chainStatus="icon"
                showBalance={false}
              />
            </div>
          </div>
        </NavBody>

        <MobileNav className="border border-primary/20 bg-background/95 backdrop-blur">
          <MobileNavHeader>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                <Target className="h-4 w-4 text-primary" />
              </span>
              Quinty
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative w-full rounded-xl px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                {item.name}
              </Link>
            ))}
            <div className="flex w-full flex-col gap-4">
              <div className="w-full rounded-lg border border-primary/25 bg-card/80 p-3">
                <ConnectButton
                  accountStatus="avatar"
                  chainStatus="icon"
                  showBalance={false}
                />
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
