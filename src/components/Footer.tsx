"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Mail } from "lucide-react";
import { Separator } from "./ui/separator";

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com/quinty", icon: Twitter },
  { name: "GitHub", href: "https://github.com/quinty", icon: Github },
  { name: "Email", href: "mailto:team@quinty.xyz", icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-0">
        {/* Logo and Description */}
        <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="flex max-w-md flex-col items-center space-y-4 text-center md:items-start md:text-left">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0 dark:brightness-100"
                />
              </div>
              <span className="text-xl font-semibold text-foreground">
                Quinty
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-foreground/70">
              The decentralized bounty studio built for serious ecosystems.
              Launch ETH-backed bounties, manage grants, and build
              reputation—all on-chain.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/50 text-foreground/70 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <link.icon className="h-4 w-4" />
                <span className="sr-only">{link.name}</span>
              </a>
            ))}
          </div>
        </div>

        <Separator className="mb-10" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/60 md:flex-row">
          <p>© {new Date().getFullYear()} Quinty. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider">
            <span>Base Sepolia</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Open source ethos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
