"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Github, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Brand & Socials */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6">
                <Image 
                  src="/images/quinty-logo.png" 
                  alt="Quinty" 
                  fill 
                  className="object-contain" 
                  style={{ filter: 'brightness(0%)'}}

                />
              </div>
              <span className="font-bold text-lg tracking-tight text-gray-900">Quinty</span>
            </div>

            <div className="hidden sm:block h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
               <a href="https://x.com/QuintyLabs" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <X className="w-4 h-4" />
               </a>
               <a href="https://github.com/Quinty-Quest-Bounty" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <Github className="w-4 h-4" />
               </a>
            </div>
          </div>

          {/* Resources Links - Horizontal */}
          <nav className="flex flex-wrap justify-center gap-6 sm:gap-8">
             <a href="https://quinty.gitbook.io/quinty-docs/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-[#0EA885] transition-colors">
                Documentation
             </a>
             <Link href="/litepaper" className="text-sm font-medium text-gray-500 hover:text-[#0EA885] transition-colors">
                Litepaper
             </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-100 my-8" />

        {/* Bottom: Operational & Info */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
           <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <span className="font-medium text-gray-500">Operational on Base Sepolia</span>
           </div>
           
           <div className="font-medium">
              &copy; {new Date().getFullYear()} Quinty Labs
           </div>
        </div>

      </div>
    </footer>
  );
}