"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import Image from "next/image";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Announcement Card */}
      <Card className="relative w-full max-w-2xl mx-auto border-2 border-[#0EA885]/20 bg-white/95 backdrop-blur-xl shadow-2xl animate-zoom-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-1.5 sm:p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 z-10 bg-white/80"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <CardContent className="p-5 sm:p-8 md:p-10 lg:p-12">
          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center">
            {/* Logo */}
            <div className="flex justify-center pt-2">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                <Image
                  src="/images/quinty-logo.png"
                  alt="Quinty Logo"
                  fill
                  className="object-contain brightness-0"
                  priority
                />
              </div>
            </div>

            {/* Badge */}
            <div className="flex justify-center">
              <Badge className="bg-[#0EA885] text-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-[#0EA885]/90">
                🎉 Exciting News
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="space-y-2 sm:space-y-3 px-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Now on Mantle Network!
              </h2>
              <div className="mx-auto max-w-md">
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  We're thrilled to announce that{" "}
                  <span className="font-semibold text-[#0EA885]">Quinty</span> is now
                  deployed on{" "}
                  <span className="font-semibold text-foreground">
                    Mantle Network
                  </span>{" "}
                  for faster and cheaper transactions!
                </p>
              </div>
            </div>

            {/* Development Notice */}
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0EA885]/10 to-teal-50 p-4 sm:p-5 md:p-6 border border-[#0EA885]/20">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We're in{" "}
                <span className="font-semibold text-[#0EA885]">full-power building mode</span>{" "}
                shaping something big.{" "}
              </p>
              <span className="font-semibold">Stay tuned.</span>
            </div>

            {/* Social CTA */}
            <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
              <p className="text-xs sm:text-sm text-gray-600 font-medium px-2">
                Follow our journey and get the latest updates
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
                <Button
                  onClick={() => {
                    window.open("https://x.com/QuintyLabs", "_blank");
                    onClose();
                  }}
                  className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-300  w-full sm:w-auto"
                >
                  <svg
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Follow @QuintyLabs
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium w-full sm:w-auto"
                >
                  Continue to Site
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
