"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
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
  Scale,
  Trophy,
  Gift,
  Users,
  Code,
  Coins,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const navigationItems = [
    { id: "bounties", label: "Bounties", icon: Target, path: "/bounties" },
    { id: "disputes", label: "Disputes", icon: Scale, path: "/disputes" },
    { id: "reputation", label: "Reputation", icon: Trophy, path: "/reputation" },
    { id: "airdrops", label: "Airdrops", icon: Gift, path: "/airdrops" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Network Banner */}
        {isConnected && <NetworkBanner />}

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <Target className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Welcome to Quinty
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Decentralized bounty platform with governance, reputation
                  NFTs, and transparent dispute resolution.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
              <Card className="text-left cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/bounties")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle>Create Bounties</CardTitle>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Post tasks with 100% STT escrow and transparent project
                    completion.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/disputes")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <Scale className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle>Disputes</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Soon</Badge>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Community voting with staking mechanisms ensures fair
                    resolution of conflicts and disputes.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/reputation")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <CardTitle>NFT Reputation</CardTitle>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Earn soulbound achievement badges that showcase your
                    successful participation and contributions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/airdrops")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Gift className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle>Airdrop Tasks</CardTitle>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Participate in transparent promotion campaigns with
                    verified rewards and community benefits.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Quinty </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Decentralized bounty platform with governance, reputation NFTs,
                and transparent dispute resolution.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <Shield className="h-3 w-3" />
                  <span>100% STT Escrow</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Code className="h-3 w-3" />
                  <span>Transparent System</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span> Voting & Disputes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Trophy className="h-3 w-3" />
                  <span>Soulbound NFT Badges</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Network</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Badge variant="outline" className="mr-2">
                    Somnia Testnet
                  </Badge>
                </li>
                <li>
                  <Badge variant="outline" className="mr-2">
                    Chain ID: 50312
                  </Badge>
                </li>
                <li className="flex items-center space-x-2">
                  <Coins className="h-3 w-3" />
                  <span>Native STT Token</span>
                </li>
                <li>Low-Cost Transactions</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Smart Contracts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <div className="flex flex-col">
                    <span className="font-medium">Quinty</span>
                    <code className="text-xs">
                      0x530E104Dc25D641b9b619e5C1CC556961b470f4f
                    </code>
                  </div>
                </li>
                <li>
                  <div className="flex flex-col">
                    <span className="font-medium">Reputation</span>
                    <code className="text-xs">
                      0x0889De145E2c78f1534f357190e0Fe8406bAc135
                    </code>
                  </div>
                </li>
                <li>
                  <div className="flex flex-col">
                    <span className="font-medium">Disputes</span>
                    <code className="text-xs">
                      0x3CA26DD1dA114A7A706A9155C2417cA53812750E
                    </code>
                  </div>
                </li>
                <li>
                  <div className="flex flex-col">
                    <span className="font-medium">Airdrops</span>
                    <code className="text-xs">
                      0xfA270eDBe41ba112bd21653B61ce67c07f06F0a8
                    </code>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for the Somnia ecosystem
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Open Source</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Decentralized</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
