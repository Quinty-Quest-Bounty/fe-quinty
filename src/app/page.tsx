"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import NetworkBanner from "../components/NetworkBanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Target,
  ShieldCheck,
  Users,
  Coins,
  Sparkles,
  ArrowUpRight,
  Trophy,
  Inbox,
  Workflow,
  Lock,
  Landmark,
  Vote,
  Rocket,
  Network,
  BadgeCheck,
} from "lucide-react";

const capabilityGroups = [
  {
    title: "Core bounty engine",
    description:
      "Launch ETH-backed bounties with blind submissions, milestone approvals, and automatic enforcement baked in.",
    icon: Target,
    bullets: [
      "Programmable escrow with milestone payouts and auto-slash on expiry",
      "Blind IPFS submissions that reveal only after selection",
      "Multiple winner splits for collaborative deliveries",
    ],
  },
  {
    title: "Oprec & contributor playbooks",
    description:
      "Qualify talent before the bounty starts. Applicants showcase work, build teams, and graduate straight into delivery.",
    icon: Workflow,
    bullets: [
      "Open recruitment funnels with portfolio drops via IPFS",
      "Team applications and approvals managed on-chain",
      "Seamless handoff into the live bounty once accepted",
    ],
  },
  {
    title: "Reputation & soulbound signals",
    description:
      "Reward sustained contribution with non-transferable achievements that actually mean something.",
    icon: BadgeCheck,
    bullets: [
      "Soulbound NFT badges covering 7 contributor archetypes",
      "Seasonal milestones (1 → 100) tracked automatically",
      "First-touch and latest-activity stats to prove consistency",
    ],
  },
];

const programModules = [
  {
    name: "Grant program orchestration",
    summary:
      "Run structured funding rounds with staged approvals, claims, and progress updates direct from the protocol.",
    icon: Landmark,
    bullets: [
      "Organizations publish grant briefs with IPFS context",
      "Applicants submit, reviewers approve per milestone",
      "Claim-based disbursement keeps every round accountable",
    ],
  },
  {
    name: "Looking for Grant (LFG)",
    summary:
      "Give founders a credible surface to court investors, social proof traction, and receive flexible contributions.",
    icon: Rocket,
    bullets: [
      "Anytime contributions without all-or-nothing pressure",
      "Creator-controlled withdrawals with transparent logs",
      "IPFS-driven updates to keep backers in the loop",
    ],
  },
  {
    name: "Crowdfunding with guardrails",
    summary:
      "Set milestone-based unlocks so funds only move when the community signs off on progress.",
    icon: Lock,
    bullets: [
      "All-or-nothing refunds if the campaign misses its goal",
      "Sequential milestone releases to avoid rug pulls",
      "Automatic refunds on failed checkpoints",
    ],
  },
  {
    name: "Airdrop & growth bounties",
    summary:
      "Reward promo squads without spreadsheets—verifiers review submissions, the vault handles the rest.",
    icon: Sparkles,
    bullets: [
      "Fixed reward pools with contributor caps",
      "Verifier roster with approval / rejection flows",
      "Cancellation lever for campaigns that shift direction",
    ],
  },
  {
    name: "ZK-enabled verification",
    summary:
      "Tie wallets to real social identity and institutional proofs through a Reclaim-ready verification layer.",
    icon: ShieldCheck,
    bullets: [
      "Manual & institutional verification hooks shipped",
      "Social handles linked on-chain for transparency",
      "Designed to plug directly into Reclaim Protocol",
    ],
  },
  {
    name: "Dispute resolution desk",
    summary:
      "Escalate stalled work to a community jury that stakes reputation to rule quickly and transparently.",
    icon: Vote,
    bullets: [
      "Stake-weighted voting with fast verdict windows",
      "Protocols can designate neutral arbitrators",
      "Coming to mainnet with governance dashboards",
    ],
  },
];

const heroStats = [
  {
    label: "Builders verified",
    value: "2,300+",
    caption: "Reputation-backed contributors in the network",
    icon: Users,
  },
  {
    label: "Escrow secured",
    value: "5k ETH",
    caption: "Rewards locked across missions and seasons",
    icon: Coins,
  },
  {
    label: "Contracts live",
    value: "9",
    caption: "Production deployments on Base Sepolia",
    icon: Network,
  },
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
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-4 pb-32 pt-12 sm:px-6 lg:px-0">
        <div className="mx-auto w-full max-w-6xl">
          <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-b from-background via-[#f1ecff] to-background px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(123,97,255,0.25),transparent_55%)] sm:block" />
            <div className="relative grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-10">
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                >
                  Live on Base Sepolia
                </Badge>
                <div className="space-y-6">
                  <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.5rem]">
                    A complete bounty studio for serious ecosystems.
                  </h1>
                  <p className="max-w-xl text-lg leading-relaxed text-foreground/80 sm:text-xl">
                    Quinty ships the entire on-chain stack you need to brief,
                    fund, and ship community work—from ETH escrow and blind
                    submissions to grants, disputes, soulbound reputation, and
                    ZK-powered verification anchored to Base.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button size="lg" onClick={() => router.push("/bounties")}>
                    Explore bounties
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-primary/15 bg-white/70 p-6 shadow-sm backdrop-blur"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-foreground/65">
                        <stat.icon className="h-4 w-4" />
                        {stat.label}
                      </div>
                      <p className="mt-3 text-3xl font-semibold">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-foreground/70">
                        {stat.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-12 hidden h-24 w-24 rounded-full bg-primary/20 blur-3xl sm:block" />
                <div className="absolute -right-16 top-0 hidden h-32 w-32 rounded-full bg-purple-500/15 blur-3xl sm:block" />
                <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-8 shadow-2xl backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-foreground/65">
                    <Sparkles className="h-3.5 w-3.5" />
                    Snapshot · Base x Builder DAO
                  </div>
                  <div className="mt-6 space-y-5">
                    <h3 className="text-2xl font-semibold">
                      Community launch sprint, run end-to-end in Quinty.
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/70">
                      Protocol founders post the bounty, escrow 5 ETH, and let
                      curated contributors deliver launch narrative assets.
                      Milestones are reviewed weekly, funds release
                      automatically, and disputes escalate to the jury when
                      needed.
                    </p>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Reward in escrow
                        </p>
                        <p className="mt-2 text-xl font-semibold">5 ETH</p>
                        <p className="text-xs text-foreground/60">
                          Released upon acceptance
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Timeline
                        </p>
                        <p className="mt-2 text-xl font-semibold">10 days</p>
                        <p className="text-xs text-foreground/60">
                          Milestones reviewed weekly
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        Deliverables locked in contract
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Launch narrative & product messaging
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Visual system for social rollout
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          Incentive breakdown for contributors
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-32 space-y-12">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em]"
              >
                Bounty Stack
              </Badge>
              <div className="max-w-3xl space-y-6">
                <h2 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
                  Every bounty touchpoint, from recruitment to delivery, already
                  automated.
                </h2>
                <p className="text-lg text-foreground/80">
                  We built nine production contracts so you can orchestrate
                  complex programs without duct tape. Spin up a bounty today,
                  layer in recruitment filters tomorrow, and keep reputation
                  sticky the whole way.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {capabilityGroups.map((item) => (
                <Card
                  key={item.title}
                  className="h-full border-primary/15 bg-white/85 shadow-sm"
                >
                  <CardHeader className="space-y-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-foreground/75">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-foreground/75">
                    {item.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3">
                        <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/60 bg-card/90">
              <CardContent className="grid gap-8 px-6 py-10 sm:px-12 lg:grid-cols-[0.6fr_1.4fr] lg:items-center">
                <div className="space-y-4">
                  <Badge
                    variant="secondary"
                    className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em]"
                  >
                    How it feels
                  </Badge>
                  <h3 className="text-2xl font-semibold sm:text-3xl">
                    Brief, approve, release, repeat. Everything else is defined
                    in the contract.
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/75">
                    A single flow carries work from open recruitment into bounty
                    delivery. Reviewers collaborate in private, contributors
                    focus on execution, and the protocol handles payouts the
                    moment milestones clear.
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4 rounded-2xl border border-border/60 bg-background/80 p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                      For bounty creators
                    </p>
                    <ul className="space-y-3 text-sm text-foreground/75">
                      <li>Scope the work with blind submission templates.</li>
                      <li>Lock ETH in escrow with fallback slashing.</li>
                      <li>Invite reviewers and escalate disputes instantly.</li>
                    </ul>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-border/60 bg-background/80 p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                      For contributors
                    </p>
                    <ul className="space-y-3 text-sm text-foreground/75">
                      <li>
                        Get discovered via Oprec funnels and team formation.
                      </li>
                      <li>Submit encrypted work, reveal only when selected.</li>
                      <li>
                        Earn soulbound milestones that stack across seasons.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-32 space-y-12">
            <div className="max-w-3xl space-y-6">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em]"
              >
                Program Modules
              </Badge>
              <h2 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
                More than bounties—run grants, crowdfunding, and growth ops from
                one surface.
              </h2>
              <p className="text-lg text-foreground/80">
                Each module ships with production-ready contracts,
                documentation, and ABIs. Mix and match to support your ecosystem
                without leaving the Quinty dashboard.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {programModules.map((module) => (
                <Card
                  key={module.name}
                  className="border-primary/15 bg-white/85 shadow-sm"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <module.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-foreground/75">
                      {module.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-foreground/75">
                    {module.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3">
                        <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-32 space-y-6">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em]"
            >
              On-Chain Proof
            </Badge>
            <Card className="border-primary/15 bg-white/85">
              <CardContent className="flex flex-col gap-8 px-6 py-8 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl space-y-4">
                  <h2 className="text-3xl font-semibold sm:text-4xl">
                    Fully deployed on Base Sepolia.
                  </h2>
                  <p className="text-sm leading-relaxed text-foreground/70 sm:text-base">
                    Nine verified contracts, 68 tests green, and ABIs waiting in{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      /contracts
                    </code>{" "}
                    so you can wire the frontend in minutes.
                  </p>
                  <ul className="grid gap-3 text-sm text-foreground/75 sm:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Base Sepolia · Chain ID 84532
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Tests · 68 / 68 passing
                    </li>
                    <li className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-primary" />
                      ABIs · fe-quinty/contracts
                    </li>
                  </ul>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:w-[420px]">
                  {contractReferences.map((reference) => (
                    <div
                      key={reference.address}
                      className="rounded-xl border border-primary/15 bg-background/80 p-4 text-xs text-foreground/75 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {reference.label}
                      </p>
                      <code className="mt-2 block break-all text-[11px] text-foreground/60">
                        {reference.address}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-32 rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-[#f3edff] to-white">
            <div className="grid gap-12 px-6 py-12 sm:px-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-6">
                <Badge
                  variant="secondary"
                  className="rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em]"
                >
                  Work With Us
                </Badge>
                <h2 className="text-3xl font-semibold sm:text-4xl">
                  Ready to run your first program end-to-end on-chain?
                </h2>
                <p className="text-lg text-foreground/80">
                  We’ll help you scope the bounty, configure governance
                  settings, and preflight contributor onboarding. From there,
                  Quinty automates the heavy lifting.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/75">
                  <div className="flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-primary" />
                    <a
                      href="mailto:team@quinty.xyz"
                      className="hover:text-primary"
                    >
                      team@quinty.xyz
                    </a>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="hidden h-4 sm:block"
                  />
                  <span>Next-day onboarding calls available</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => router.push("/bounties?create=true")}
                  >
                    Launch a bounty
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/docs")}
                  >
                    Browse the docs
                  </Button>
                </div>
              </div>
              <div className="space-y-6 rounded-2xl border border-primary/20 bg-background/75 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  Why teams choose Quinty
                </p>
                <ul className="space-y-4 text-sm text-foreground/80">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                      Designed with community governance in mind—no hidden
                      levers.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                      Reputation and soulbound badges keep talent accountable
                      over multiple seasons.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                      ZK, grants, crowdfunding, and disputes all ship as native
                      modules.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-foreground/80 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">
                Quinty
              </span>
            </div>
            <p className="max-w-md">
              The decentralized bounty studio looking after both sides of the
              table—funders and contributors alike.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide">
            <span>Base Sepolia</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Transparent governance</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Open source ethos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
