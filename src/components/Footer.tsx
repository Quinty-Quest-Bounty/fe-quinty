"use client";

import Link from "next/link";
import { Target, Github, Twitter, Mail } from "lucide-react";
import { Separator } from "./ui/separator";

const navigation = {
  product: [
    { name: "Bounties", href: "/bounties" },
    { name: "Grants", href: "/grants" },
    { name: "Crowdfunding", href: "/crowdfunding" },
    { name: "Documentation", href: "/docs" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  resources: [
    { name: "Getting Started", href: "/docs/getting-started" },
    { name: "Smart Contracts", href: "/docs/contracts" },
    { name: "API Reference", href: "/docs/api" },
    { name: "Community", href: "/community" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

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
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-semibold text-foreground">Quinty</span>
            </Link>
            <p className="text-sm leading-relaxed text-foreground/70">
              The decentralized bounty studio built for serious ecosystems. Launch ETH-backed
              bounties, manage grants, and build reputation—all on-chain.
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

        {/* Navigation Grid */}
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Product
            </h3>
            <ul className="space-y-3">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/60 md:flex-row">
          <p>© {new Date().getFullYear()} Quinty. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider">
            <span>Base Sepolia</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Transparent governance</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Open source ethos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
