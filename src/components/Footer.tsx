"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, X, Mail } from "lucide-react";
import { Separator } from "./ui/separator";

const socialLinks = [
  { name: "X", href: "https://x.com/quinty", icon: X },
  { name: "GitHub", href: "https://github.com/quinty", icon: Github },
  { name: "Email", href: "mailto:team@quinty.xyz", icon: Mail },
];

export function Footer() {
  return (
    <footer className="relative mt-12 sm:mt-16 md:mt-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-0">
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 sm:p-12">
          {/* Logo and Description */}
          <div className="mb-8 sm:mb-10 flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
            <div className="flex max-w-md flex-col items-center space-y-4 text-center md:items-start md:text-left">
              <Link href="/" className="group flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] bg-gradient-to-br from-[#0EA885]/10 to-[#0EA885]/5 p-2 backdrop-blur-sm border border-[#0EA885]/20 group-hover:border-[#0EA885]/40 transition-all duration-300">
                  <Image
                    src="/images/quinty-logo.png"
                    alt="Quinty Logo"
                    fill
                    className="object-contain brightness-0 dark:brightness-100"
                  />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Quinty
                </span>
              </Link>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/70">
                The decentralized bounty studio built for serious ecosystems.
                Escrow replaces trust with truth — funds don't lie.
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
                  className="group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-[1rem] border border-white/60 bg-white/50 backdrop-blur-sm text-foreground/70 transition-all duration-300 hover:-translate-y-2 hover:border-[#0EA885]/40 hover:bg-[#0EA885]/10 hover:text-[#0EA885] hover:shadow-lg active:scale-95"
                >
                  <link.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="sr-only">{link.name}</span>
                </a>
              ))}
            </div>
          </div>

          <Separator className="mb-8 sm:mb-10 bg-white/60" />

          {/* Bottom Bar */}
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/60 md:flex-row">
            <p className="text-xs sm:text-sm">© {new Date().getFullYear()} Quinty. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#0EA885]/10 text-[#0EA885] border border-[#0EA885]/20 font-medium">Base Sepolia</span>
              <Separator orientation="vertical" className="h-4 bg-white/60" />
              <span className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 font-medium">Open source ethos</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-8" />
    </footer>
  );
}
