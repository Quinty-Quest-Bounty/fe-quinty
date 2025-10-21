"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Footer } from "../components/Footer";
import { Safari } from "../components/ui/safari";
import DotPattern from "../components/ui/dot-pattern";
import { LinkPreview } from "../components/ui/link-preview";
import { Gravity, MatterBody } from "../components/ui/gravity";
import {
  Target,
  Users,
  Coins,
  Network,
  BadgeCheck,
  Vote,
  Landmark,
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
  { text: "Token Escrow", color: "bg-pink-200" },
  { text: "Milestone Payouts", color: "bg-purple-200" },
  { text: "Funding", color: "bg-purple-200" },
  { text: "Team Splits", color: "bg-green-200" },
  { text: "IPFS Storage", color: "bg-yellow-200" },
  { text: "Auto-Slash", color: "bg-orange-200" },
  { text: "Dispute Resolution", color: "bg-teal-200" },
  { text: "Soulbound Badges", color: "bg-indigo-200" },
  { text: "Grant Programs", color: "bg-rose-200" },
  { text: "Crowdfunding", color: "bg-cyan-200" },
  { text: "ZK Verification", color: "bg-lime-200" },
  { text: "Governance", color: "bg-fuchsia-200" },
];

const contractReferences = [
  {
    label: "Quinty Core",
    address: "0x574bC7953bf4eD7Dd20987F4752C560f606Ebf1D",
  },
  {
    label: "Quinty Reputation",
    address: "0x7EbC0c18CF9B37076d326342Dba20e98A1F20c7e",
  },
  {
    label: "Dispute Resolver",
    address: "0x961659d12E9dE91dC543A75911b3b0D269769E82",
  },
  {
    label: "Quinty NFT (Soulbound)",
    address: "0xD49a54aFb982c0b76554e34f1A76851ed725405F",
  },
  {
    label: "Grant Program",
    address: "0x8b0B50732CCfB6308d5A63C1F9D70166DF63b661",
  },
  {
    label: "Crowdfunding",
    address: "0x0bf8d6EB00b3C4cA6a9F1CFa6Cd40b4cE486F885",
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

  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -80px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;

          // Add animation classes based on data attributes
          if (target.dataset.animation === "fade-scale") {
            target.classList.add("scroll-fade-scale");
          } else if (target.dataset.animation === "slide-left") {
            target.classList.add("scroll-slide-left");
          } else if (target.dataset.animation === "slide-right") {
            target.classList.add("scroll-slide-right");
          } else if (target.dataset.animation === "slide-bottom") {
            target.classList.add("scroll-slide-bottom");
          } else if (target.dataset.animation === "zoom-in") {
            target.classList.add("scroll-zoom-in");
          }

          observer.unobserve(target);
        }
      });
    }, observerOptions);

    // Observe all elements with data-animation attribute
    const animatedElements = document.querySelectorAll("[data-animation]");
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-foreground relative">
      <main className="relative px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-0 lg:pb-32">
        <div className="mx-auto w-full max-w-6xl">
          <section className="mx-auto mb-8 max-w-7xl px-4 sm:mb-10 sm:px-6 md:mb-20 xl:px-0">
            <div className="relative flex flex-col items-center rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-lg hover:shadow-2xl min-h-[70vh] sm:min-h-[75vh] md:min-h-[80vh] justify-center backdrop-blur-xl bg-white/70 border border-white/60 transition-all duration-500 hover:scale-[1.01]">
              {/* Dot Pattern Background */}
              <DotPattern width={10} height={10} className="fill-gray-400/40" />

              {/* Decorative corner dots */}
              <div className="absolute -left-1 -top-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />
              <div className="absolute -bottom-1 -left-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />
              <div className="absolute -right-1 -top-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-[#0EA885] z-10 animate-pulse" />

              <div className="relative z-20 mx-auto w-full max-w-7xl py-6 px-4 sm:py-8 sm:px-6 md:py-12 xl:py-16">
                <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
                  {/* Logo + Brand */}
                  <div className="flex flex-col items-center animate-fade-in">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                      <Image
                        src="/images/quinty-logo.png"
                        alt="Quinty Logo"
                        fill
                        className="object-contain brightness-0"
                        priority
                      />
                    </div>
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Quinty
                      </h2>
                      <Badge
                        variant="outline"
                        className="rounded-full border-gray-300 bg-gray-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600"
                      >
                        Live on Base Sepolia
                      </Badge>
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl animate-slide-up px-2">
                    <span className="block text-foreground">
                      Smart Contracts,
                    </span>
                    <span className="block text-[#0EA885]">
                      Smarter Collaboration.
                    </span>
                  </h1>

                  <div className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl space-y-1 sm:space-y-2 animate-slide-up animation-delay-200 px-4">
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
                    className="animate-slide-up animation-delay-300 hover:scale-105 transition-all duration-300 text-sm sm:text-base hover:shadow-xl"
                  >
                    Explore bounties
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Preview - Safari Component */}
          <section className="mt-12 sm:mt-16 md:mt-24">
            <div
              className="text-center mb-8 sm:mb-10 md:mb-12"
              data-animation="fade-scale"
            >
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-0.5 sm:px-4 sm:py-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-300 hover:scale-105"
              >
                Platform Preview
              </Badge>
              <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground px-4">
                Built for production
              </h2>
            </div>

            <div
              className="hover:scale-[1.01] transition-all duration-500"
              data-animation="zoom-in"
            >
              <Safari url="quinty.xyz" className="w-full">
                <div className="relative h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 p-8 sm:p-12 md:p-16">
                  <div className="relative flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 h-full">
                    <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-full bg-white backdrop-blur-sm shadow-2xl border border-gray-200 hover:shadow-3xl hover:scale-110 transition-all duration-500">
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                        <Image
                          src="/images/quinty-logo.png"
                          alt="Quinty Logo"
                          fill
                          className="object-contain brightness-0"
                        />
                      </div>
                    </div>
                    <div className="text-center space-y-1 sm:space-y-2">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                        Quinty Platform
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Complete bounty studio for ecosystems
                      </p>
                    </div>
                  </div>
                </div>
              </Safari>
            </div>
          </section>

          {/* All Features - Side by Side with Image Placeholders */}
          <section className="mt-12 sm:mt-16 md:mt-24 space-y-12 sm:space-y-16 md:space-y-20">
            {allFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`grid gap-6 sm:gap-8 md:gap-12 lg:grid-cols-2 lg:items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                } group`}
              >
                {/* Image Placeholder */}
                <div
                  className={`order-1 ${
                    index % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="relative w-full aspect-[16/10] rounded-[1.5rem] sm:rounded-[2rem] border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-[#0EA885] hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-4 p-4 sm:p-6 md:p-8">
                      <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 group-hover:text-[#0EA885] group-hover:scale-110 transition-all duration-500" />
                      <div className="text-center space-y-1 sm:space-y-2">
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {feature.title} Preview
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400">
                          Screenshot placeholder - Add your image here
                        </p>
                      </div>
                      {feature.status === "Soon" && (
                        <Badge className="bg-gray-800 text-white px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm animate-pulse">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div
                  className={`order-2 space-y-3 sm:space-y-4 md:space-y-6 ${
                    index % 2 === 1 ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className="rounded-full border-gray-300 bg-gray-50 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-foreground hover:text-[#0EA885] transition-colors duration-300">
                    {feature.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Bounty Stack */}
          <section className="mt-12 sm:mt-16 md:mt-24">
            <div
              className="text-center space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8"
              data-animation="fade-scale"
            >
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-0.5 sm:px-4 sm:py-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-300 hover:scale-105"
              >
                Full Stack
              </Badge>
              <h2 className="text-2xl font-semibold sm:text-3xl md:text-4xl text-foreground px-4">
                Everything you need
              </h2>
            </div>
            <div
              className="relative rounded-[2.5rem] sm:rounded-[3rem] border border-white/60 bg-white/70 backdrop-blur-xl p-4 sm:p-6 md:p-8 hover:shadow-2xl overflow-hidden h-[400px] sm:h-[500px] md:h-[600px] shadow-lg transition-all duration-500 hover:border-white/80"
              data-animation="slide-bottom"
            >
              <Gravity
                gravity={{ x: 0, y: 0.5 }}
                className="w-full h-full"
                grabCursor={true}
              >
                {bountyStackFeatures.map((feature, index) => (
                  <MatterBody
                    key={feature.text}
                    x={`${20 + (index % 6) * 15}%`}
                    y={`${20 + Math.floor(index / 6) * 20}%`}
                    angle={Math.random() * 20 - 10}
                    matterBodyOptions={{
                      restitution: 0.6,
                      friction: 0.1,
                      density: 0.002,
                    }}
                    isDraggable={false}
                  >
                    <div
                      className={`rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-gray-300 ${feature.color} px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-center text-sm sm:text-base md:text-lg font-bold shadow-lg select-none transition-all duration-300 hover:shadow-2xl hover:scale-105`}
                    >
                      {feature.text}
                    </div>
                  </MatterBody>
                ))}
              </Gravity>
            </div>
          </section>

          {/* Contracts */}
          <section className="mt-12 sm:mt-16 md:mt-24" data-animation="zoom-in">
            <Card className="border border-white/60 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
              <CardContent className="px-4 py-6 sm:px-6 sm:py-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
                        Deployed on Base Sepolia
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                        9 contracts · 68 tests passing
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-fit border-gray-300 bg-gray-50 text-gray-600 w-fit"
                    >
                      <Network className="mr-1.5 sm:mr-2 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-xs sm:text-sm">Chain ID 84532</span>
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {contractReferences.map((reference) => (
                      <div
                        key={reference.address}
                        className="rounded-[1rem] sm:rounded-[1.25rem] border border-gray-200 bg-background/50 p-2.5 sm:p-3 hover:border-gray-300 transition-all duration-300 hover:shadow-md hover:scale-105"
                      >
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-700">
                          {reference.label}
                        </p>
                        <code className="mt-0.5 sm:mt-1 block break-all text-[9px] sm:text-[10px] text-gray-500">
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
            className="mt-12 sm:mt-16 md:mt-24 text-center rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 bg-white/70 backdrop-blur-xl px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 hover:shadow-2xl shadow-lg transition-all duration-500 hover:scale-[1.01] hover:border-white/80"
            data-animation="fade-scale"
          >
            <h2 className="text-xl font-semibold sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl mb-4 sm:mb-6 text-foreground hover:text-[#0EA885] px-2 transition-colors duration-300">
              Where Smart Contracts Meet Smart Users.
            </h2>

            <div className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
              <p className="mb-3 sm:mb-4">
                Design, fund, and verify your first on-chain program — with
                reputation that can't be faked. Start building with{" "}
                <LinkPreview
                  url="https://quinty.xyz/bounties"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 hover:underline transition-all duration-300"
                >
                  Quinty
                </LinkPreview>{" "}
                and join the on-chain workforce.
              </p>
              <p>
                Need help getting started? Check out our{" "}
                <LinkPreview
                  url="https://quinty.xyz/docs"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 hover:underline transition-all duration-300"
                >
                  Documentation
                </LinkPreview>{" "}
                or reach out to{" "}
                <LinkPreview
                  url="mailto:team@quinty.xyz"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 hover:underline transition-all duration-300"
                >
                  our team
                </LinkPreview>
                .
              </p>
            </div>

            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-500 hover:text-[#0EA885] transition-colors duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 sm:h-5 sm:w-5"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.508 11.24H17.48l-5.245-6.864L6.216 21.75H2.906l7.732-8.847L2.426 2.25h5.135l4.713 6.173L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.116l11.967 15.644Z" />
              </svg>
              <a
                href="https://x.com/quintyxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0EA885] transition-colors duration-300"
              >
                @quintyxyz
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
