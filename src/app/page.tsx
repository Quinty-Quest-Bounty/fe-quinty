"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Footer } from "../components/Footer";
import { Safari } from "../components/ui/safari";
import DotPattern from "../components/ui/dot-pattern";
import { LinkPreview } from "../components/ui/link-preview";
import {
  Target,
  Users,
  Coins,
  Network,
  BadgeCheck,
  Vote,
  Landmark,
  Mail,
} from "lucide-react";

const allFeatures = [
  {
    title: "On-Chain Bounties",
    description:
      "Post tasks, lock ETH in escrow, and reward the best work — no missed payments, no copycats.",
    icon: Target,
    status: "Live",
  },
  {
    title: "Soulbound Reputation",
    description:
      "Your wins become badges. Each milestone mints an immutable NFT that proves your contribution — forever.",
    icon: BadgeCheck,
    status: "Live",
  },
  {
    title: "Community Disputes",
    description:
      "No biased moderators. Disputes are resolved by stake-weighted community votes — justice written in Solidity.",
    icon: Vote,
    status: "Soon",
  },
  {
    title: "Grants Without Friction",
    description:
      "VCs and orgs can fund selected builders directly. Applicants claim verified grants with progress tracked on-chain.",
    icon: Coins,
    status: "Live",
  },
  {
    title: "Anti-Rug Crowdfunding",
    description:
      "Milestone-based funding ensures accountability. If goals aren't met, contributors get their ETH back automatically.",
    icon: Users,
    status: "Live",
  },
  {
    title: "ZK Identity Verification",
    description:
      "Link your social proof without doxxing yourself. Verify with zero-knowledge — privacy meets credibility.",
    icon: BadgeCheck,
    status: "Live",
  },
  {
    title: "Airdrop Bounties & LFG Mode",
    description:
      "Launch your campaign, grow your movement, or raise flexible startup funds. Everything transparent, everything Base-powered.",
    icon: Landmark,
    status: "Live",
  },
];

const bountyStackFeatures = [
  "ETH Escrow",
  "Blind Submissions",
  "Milestone Payouts",
  "Team Splits",
  "IPFS Storage",
  "Auto-Slash",
  "Dispute Resolution",
  "Soulbound Badges",
  "Grant Programs",
  "Crowdfunding",
  "ZK Verification",
  "On-Chain Governance",
];

const heroStats = [
  { label: "Builders", value: "2,300+", icon: Users },
  { label: "Escrow", value: "5k ETH", icon: Coins },
  { label: "Contracts", value: "9", icon: Network },
];

const contractReferences = [
  {
    label: "Quinty Core",
    address: "0x7169c907F80f95b20232F5B979B1Aac392bD282a",
  },
  {
    label: "Quinty Reputation",
    address: "0x2dc731f796Df125B282484E844485814B2DCd363",
  },
  {
    label: "Dispute Resolver",
    address: "0xF04b0Ec52bFe602D0D38bEA4f613ABb7cFA79FB5",
  },
  {
    label: "Quinty NFT (Soulbound)",
    address: "0x80edb4Aeb39913FaFfDAC2a86F3184508B57AAe2",
  },
  {
    label: "Grant Program",
    address: "0xf70fBEba52Cc2A6F1e511179A10BdB4B820c7879",
  },
  {
    label: "Crowdfunding",
    address: "0x64aC0a7A52f3E0a414D8344f6A4620b51dFfB6C2",
  },
];

// Custom hook for scroll-triggered animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return ref;
}

export default function Home() {
  const router = useRouter();
  const platformRef = useScrollAnimation();
  const bountyStackRef = useScrollAnimation();
  const contractsRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();

  // Create refs for each feature
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      featureRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-4 pb-32 pt-12 sm:px-6 lg:px-0">
        <div className="mx-auto w-full max-w-6xl">
          <section className="mx-auto mb-10 max-w-7xl px-6 md:mb-20 xl:px-0">
            <div className="relative flex flex-col items-center border border-gray-200 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl">
              {/* Dot Pattern Background */}
              <DotPattern width={5} height={5} className="fill-gray-300/30" />

              {/* Decorative corner dots */}
              <div className="absolute -left-1 -top-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />
              <div className="absolute -bottom-1 -left-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />
              <div className="absolute -right-1 -top-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />

              <div className="relative z-20 mx-auto max-w-7xl py-12 px-6 md:py-16 xl:py-24">
                <div className="text-center space-y-8">
                  <Badge
                    variant="outline"
                    className="rounded-full border-gray-300 bg-gray-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 animate-fade-in"
                  >
                    Live on Base Sepolia
                  </Badge>

                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl animate-slide-up">
                    <span className="block text-foreground">
                      Smart Contracts,
                    </span>
                    <span className="block text-[#0EA885]">
                      Smarter Collaboration.
                    </span>
                  </h1>

                  <div className="mx-auto max-w-2xl text-lg md:text-xl space-y-2 animate-slide-up animation-delay-200">
                    <p className="font-bold text-foreground">
                      "If You Don't Lock It, You Don't Mean It."
                    </p>
                    <p className="italic text-foreground/70">
                      Escrow separates the committed from the curious.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => router.push("/bounties")}
                    className="animate-slide-up animation-delay-300 hover:scale-105 transition-transform duration-200"
                  >
                    Explore bounties
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Preview - Safari Component */}
          <section
            ref={platformRef}
            className="mt-24 scroll-animate opacity-0 translate-y-10"
          >
            <div className="text-center mb-12">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              >
                Platform Preview
              </Badge>
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl text-foreground">
                Built for production
              </h2>
            </div>

            <div className="hover:scale-[1.01] transition-transform duration-500">
              <Safari url="quinty.xyz" className="w-full">
                <div className="relative h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 p-16">
                  <div className="relative flex flex-col items-center justify-center gap-8 h-full">
                    <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white backdrop-blur-sm shadow-2xl border border-gray-200 hover:shadow-3xl hover:scale-110 transition-all duration-300">
                      <Target className="h-20 w-20 text-[#0EA885] animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900">
                        Quinty Platform
                      </h3>
                      <p className="text-gray-600">
                        Complete bounty studio for ecosystems
                      </p>
                    </div>
                  </div>
                </div>
              </Safari>
            </div>
          </section>

          {/* All Features - Side by Side with Image Placeholders */}
          <section className="mt-24 space-y-20">
            {allFeatures.map((feature, index) => (
              <div
                key={feature.title}
                ref={(el) => {
                  featureRefs.current[index] = el;
                }}
                className={`grid gap-12 lg:grid-cols-2 lg:items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                } group scroll-animate opacity-0 translate-y-10`}
              >
                {/* Image Placeholder */}
                <div
                  className={`order-1 ${
                    index % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="relative w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-[#0EA885] transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                      <feature.icon className="h-16 w-16 text-gray-400 group-hover:text-[#0EA885] transition-all duration-300 group-hover:scale-110" />
                      <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {feature.title} Preview
                        </p>
                        <p className="text-xs text-gray-400">
                          Screenshot placeholder - Add your image here
                        </p>
                      </div>
                      {feature.status === "Soon" && (
                        <Badge className="bg-gray-800 text-white px-4 py-1.5 text-sm animate-pulse">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div
                  className={`order-2 space-y-6 ${
                    index % 2 === 1 ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="rounded-full border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  <h2 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-foreground hover:text-[#0EA885] transition-colors duration-300">
                    {feature.title}
                  </h2>
                  <p className="text-xl leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Bounty Stack */}
          <section
            ref={bountyStackRef}
            className="mt-24 scroll-animate opacity-0 translate-y-10"
          >
            <div className="text-center space-y-4 mb-8">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              >
                Full Stack
              </Badge>
              <h2 className="text-3xl font-semibold sm:text-4xl text-foreground">
                Everything you need
              </h2>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {bountyStackFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3 text-center text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#0EA885] hover:bg-gray-50 hover:shadow-md"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contracts */}
          <section
            ref={contractsRef}
            className="mt-24 scroll-animate opacity-0 translate-y-10"
          >
            <Card className="border border-gray-200 bg-white/90">
              <CardContent className="px-6 py-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground">
                        Deployed on Base Sepolia
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        9 contracts · 68 tests passing
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-fit border-gray-300 bg-gray-50 text-gray-600"
                    >
                      <Network className="mr-2 h-3 w-3" />
                      Chain ID 84532
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {contractReferences.map((reference) => (
                      <div
                        key={reference.address}
                        className="rounded-xl border border-gray-200 bg-background/50 p-3 hover:border-gray-300 transition-colors"
                      >
                        <p className="text-xs font-semibold text-gray-700">
                          {reference.label}
                        </p>
                        <code className="mt-1 block break-all text-[10px] text-gray-500">
                          {reference.address}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA with LinkPreview */}
          <section
            ref={ctaRef}
            className="mt-24 text-center rounded-3xl border border-gray-200 bg-white/90 px-8 py-16 hover:shadow-xl transition-all duration-500 scroll-animate opacity-0 translate-y-10"
          >
            <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl mb-6 text-foreground hover:text-[#0EA885] transition-colors duration-300">
              Ready to launch?
            </h2>
            <div className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              <p className="mb-4">
                Start building with{" "}
                <LinkPreview
                  url="https://quinty.xyz/bounties"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 transition-all duration-200 hover:underline"
                >
                  Quinty Bounties
                </LinkPreview>{" "}
                and launch your first on-chain program today.
              </p>
              <p>
                Need help getting started? Check out our{" "}
                <LinkPreview
                  url="https://quinty.xyz/docs"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 transition-all duration-200 hover:underline"
                >
                  Documentation
                </LinkPreview>{" "}
                or reach out to{" "}
                <LinkPreview
                  url="mailto:team@quinty.xyz"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 transition-all duration-200 hover:underline"
                >
                  our team
                </LinkPreview>
                .
              </p>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-base text-gray-500 hover:text-[#0EA885] transition-colors duration-300">
              <Mail className="h-5 w-5" />
              <a
                href="mailto:team@quinty.xyz"
                className="hover:text-[#0EA885] transition-colors duration-200"
              >
                team@quinty.xyz
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
