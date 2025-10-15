"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Footer } from "../components/Footer";
import { Safari } from "../components/ui/safari";
import DotPattern from "../components/ui/dot-pattern";
import { TextRotate } from "../components/ui/text-rotate";
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
    title: "Bounty",
    descriptions: [
      "Launch ETH-backed bounties",
      "Blind submissions system",
      "Milestone approvals",
      "Automatic enforcement",
    ],
    icon: Target,
    status: "Live",
  },
  {
    title: "Disputes",
    descriptions: [
      "Community-driven resolution",
      "Stake-weighted voting",
      "Transparent arbitration",
      "Fast verdict windows",
    ],
    icon: Vote,
    status: "Soon",
  },
  {
    title: "NFT Reputation",
    descriptions: [
      "Soulbound NFT badges",
      "Track achievements",
      "Season milestones",
      "On-chain proof",
    ],
    icon: BadgeCheck,
    status: "Live",
  },
  {
    title: "Funding",
    descriptions: [
      "Multi-purpose funding",
      "Flexible use cases",
      "Transparent management",
      "Community control",
    ],
    icon: Landmark,
    status: "Live",
  },
  {
    title: "Grant",
    descriptions: [
      "Structured programs",
      "Staged approvals",
      "Claim-based disbursement",
      "Progress tracking",
    ],
    icon: Coins,
    status: "Live",
  },
  {
    title: "Crowdfunding",
    descriptions: [
      "Milestone-based unlocks",
      "Community governance",
      "Refund protection",
      "Goal tracking",
    ],
    icon: Users,
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

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-4 pb-32 pt-12 sm:px-6 lg:px-0">
        <div className="mx-auto w-full max-w-6xl">
          <section className="mx-auto mb-10 max-w-7xl px-6 md:mb-20 xl:px-0">
            <div className="relative flex flex-col items-center border border-gray-200 rounded-3xl overflow-hidden">
              {/* Dot Pattern Background */}
              <DotPattern width={5} height={5} className="fill-gray-300/30" />

              {/* Decorative corner dots */}
              <div className="absolute -left-1 -top-1 h-2 w-2 bg-[#0EA885] z-10" />
              <div className="absolute -bottom-1 -left-1 h-2 w-2 bg-[#0EA885] z-10" />
              <div className="absolute -right-1 -top-1 h-2 w-2 bg-[#0EA885] z-10" />
              <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-[#0EA885] z-10" />

              <div className="relative z-20 mx-auto max-w-7xl py-12 px-6 md:py-16 xl:py-24">
                <div className="text-center space-y-8">
                  <Badge
                    variant="outline"
                    className="rounded-full border-gray-300 bg-gray-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
                  >
                    Live on Base Sepolia
                  </Badge>

                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                    <span className="block text-foreground">
                      Complete bounty
                    </span>
                    <span className="block text-[#0EA885]">
                      studio for ecosystems
                    </span>
                  </h1>

                  <p className="mx-auto max-w-2xl text-lg text-foreground/70 md:text-xl">
                    On-chain bounties, grants, reputation, and disputes—all in
                    one protocol.
                  </p>

                  <Button size="lg" onClick={() => router.push("/bounties")}>
                    Explore bounties
                  </Button>
                </div>

                <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-gray-200 bg-white/90 p-6 text-center shadow-lg backdrop-blur hover:scale-105 hover:border-gray-300 transition-all"
                    >
                      <stat.icon className="mx-auto h-6 w-6 text-gray-500 mb-2" />
                      <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Platform Preview - Safari Component */}
          <section className="mt-24">
            <div className="text-center mb-12">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] border-gray-300 bg-gray-50 text-gray-600"
              >
                Platform Preview
              </Badge>
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl text-foreground">
                Built for production
              </h2>
            </div>

            <Safari url="quinty.xyz" className="w-full">
              <div className="relative h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 p-16">
                <div className="relative flex flex-col items-center justify-center gap-8 h-full">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white backdrop-blur-sm shadow-2xl border border-gray-200">
                    <Target className="h-20 w-20 text-[#0EA885]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Quinty Platform</h3>
                    <p className="text-gray-600">Complete bounty studio for ecosystems</p>
                  </div>
                </div>
              </div>
            </Safari>
          </section>

          {/* All Features - Side by Side with Image Placeholders */}
          <section className="mt-24 space-y-20">
            {allFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`grid gap-12 lg:grid-cols-2 lg:items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image Placeholder */}
                <div
                  className={`order-1 ${
                    index % 2 === 1 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="relative w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden group hover:border-[#0EA885] transition-colors">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                      <feature.icon className="h-16 w-16 text-gray-400 group-hover:text-[#0EA885] transition-colors" />
                      <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {feature.title} Preview
                        </p>
                        <p className="text-xs text-gray-400">
                          Screenshot placeholder - Add your image here
                        </p>
                      </div>
                      {feature.status === "Soon" && (
                        <Badge className="bg-gray-800 text-white px-4 py-1.5 text-sm">
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
                      className="rounded-full border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  <h2 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-foreground">
                    {feature.title}
                  </h2>
                  <div className="text-xl leading-relaxed flex items-center gap-2">
                    <TextRotate
                      texts={feature.descriptions}
                      mainClassName="text-xl font-semibold text-gray-600"
                      rotationInterval={2500}
                      staggerFrom="last"
                      staggerDuration={0.02}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Bounty Stack */}
          <section className="mt-24">
            <div className="text-center space-y-4 mb-8">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] border-gray-300 bg-gray-50 text-gray-600"
              >
                Full Stack
              </Badge>
              <h2 className="text-3xl font-semibold sm:text-4xl text-foreground">
                Everything you need
              </h2>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white/90 p-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {bountyStackFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3 text-center text-sm font-medium backdrop-blur-sm transition-all hover:scale-105 hover:border-gray-300 hover:bg-gray-50"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contracts */}
          <section className="mt-24">
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
          <section className="mt-24 text-center rounded-3xl border border-gray-200 bg-white/90 px-8 py-16">
            <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl mb-6 text-foreground">
              Ready to launch?
            </h2>
            <div className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              <p className="mb-4">
                Start building with{" "}
                <LinkPreview
                  url="https://quinty.xyz/bounties"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 transition-colors"
                >
                  Quinty Bounties
                </LinkPreview>{" "}
                and launch your first on-chain program today.
              </p>
              <p>
                Need help getting started? Check out our{" "}
                <LinkPreview
                  url="https://quinty.xyz/docs"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 transition-colors"
                >
                  Documentation
                </LinkPreview>{" "}
                or reach out to{" "}
                <LinkPreview
                  url="mailto:team@quinty.xyz"
                  className="font-bold text-[#0EA885] hover:text-[#0EA885]/80 transition-colors"
                >
                  our team
                </LinkPreview>
                .
              </p>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-base text-gray-500">
              <Mail className="h-5 w-5" />
              <a
                href="mailto:team@quinty.xyz"
                className="hover:text-[#0EA885] transition-colors"
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
