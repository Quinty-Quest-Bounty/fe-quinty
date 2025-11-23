"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";

const footerLinks = {
  resources: [
    { name: "Documentation", href: "https://quinty.gitbook.io/quinty-docs/" },
    { name: "GitHub", href: "https://github.com/Quinty-Quest-Bounty" },  
    { name: "Blog", href: "https://blog.quinty.io" },
  ],
  socials: [
    { name: "X.com", href: "https://x.com/QuintyLabs", icon: X },
  ],
};

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <footer className="relative mt-8 sm:mt-10 md:mt-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-0">
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg transition-all duration-500 p-6 sm:p-8">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-block">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0"
                />
              </div>
            </Link>
          </div>

          {/* Newsletter Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Title Left */}
              <h3 className="text-xl sm:text-2xl font-medium text-foreground/80">
                Stay updated
              </h3>

              {/* Email Input + Button Right on Desktop */}
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2 max-w-xl w-full sm:justify-end"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get the latest blog posts and updates from Quinty"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200/60 text-foreground/70 placeholder:text-foreground/40 focus:outline-none focus:border-[#0EA885]/40 focus:bg-white/80 transition-all duration-300 text-sm"
                />

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#0EA885]/10 hover:bg-[#0EA885]/20 text-[#0EA885] font-medium transition-all duration-300 text-sm whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>


          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {/* Resources */}
            <div>
              <h4 className="text-sm font-medium text-foreground/50 mb-3">
                Resources
              </h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/70 hover:text-[#0EA885] transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Socials */}
            <div>
              <h4 className="text-sm font-medium text-foreground/50 mb-3">
                Socials
              </h4>
              <ul className="space-y-2">
                {footerLinks.socials.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-foreground/70 hover:text-[#0EA885] transition-colors duration-200"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100/60 border border-yellow-300/60">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs font-medium text-foreground/70">
                Under Heavy Development
              </span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-4 border-t border-white/60 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-foreground/40">
              © Quinty {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-xs text-foreground/40 hover:text-[#0EA885] transition-colors duration-200"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-xs text-foreground/40 hover:text-[#0EA885] transition-colors duration-200"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="h-8" />
    </footer>
  );
}
