"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, ShieldCheck } from "lucide-react";
import { CONTRACT_ADDRESSES, ZK_VERIFICATION_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";

const navItems = [
  {
    name: "Bounties",
    link: "/bounties",
  },
  {
    name: "Disputes",
    link: "/disputes",
  },
  {
    name: "Reputation",
    link: "/reputation",
  },
  {
    name: "Airdrops",
    link: "/airdrops",
  },
  {
    name: "Funding",
    link: "/funding",
  },
];

export default function Header() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    socialHandle: "",
    institutionName: "",
  });

  const zkVerificationAddress = CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].ZKVerification;

  // Check verification status
  useEffect(() => {
    async function checkVerification() {
      if (!address) {
        setIsVerified(false);
        return;
      }
      try {
        const result = await readContract(wagmiConfig, {
          address: zkVerificationAddress as `0x${string}`,
          abi: ZK_VERIFICATION_ABI,
          functionName: "getVerification",
          args: [address],
        });
        const [verified] = result as [boolean, bigint, string, string];
        setIsVerified(verified);
      } catch (error) {
        console.error("Error checking verification:", error);
        setIsVerified(false);
      }
    }
    checkVerification();
  }, [address, zkVerificationAddress, isConfirmed]);

  // Handle verification submission
  const handleVerify = async () => {
    if (!verifyForm.socialHandle) {
      alert("Please enter your social handle (e.g., Twitter/X username)");
      return;
    }

    try {
      // Call submitZKProof with placeholder proof
      const placeholderProof = new Uint8Array(32); // Empty proof for now

      writeContract({
        address: zkVerificationAddress as `0x${string}`,
        abi: ZK_VERIFICATION_ABI,
        functionName: "submitZKProof",
        args: [
          `0x${Array.from(placeholderProof).map(b => b.toString(16).padStart(2, '0')).join('')}`,
          verifyForm.socialHandle,
          verifyForm.institutionName,
        ],
      });

      setVerifyForm({ socialHandle: "", institutionName: "" });
      setShowVerifyModal(false);
    } catch (error) {
      console.error("Error verifying:", error);
      alert("Verification failed. Please try again.");
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4">
      <Navbar className="pointer-events-auto !fixed top-4 left-0 right-0 w-full px-4 sm:px-6">
        <NavBody className="mx-auto w-full border border-primary/20 bg-background/90 px-4 backdrop-blur-xl lg:flex">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-background"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Target className="h-4 w-4 text-primary" />
            </span>
            Quinty
          </button>
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
            className="text-foreground"
          />
          <div className="hidden items-center gap-3 lg:flex">
            {isConnected && (
              <Button
                variant={isVerified ? "outline" : "default"}
                size="sm"
                onClick={() => setShowVerifyModal(true)}
                className="gap-2"
              >
                <ShieldCheck className={`h-4 w-4 ${isVerified ? "text-green-600" : ""}`} />
                {isVerified ? "Verified" : "Verify Identity"}
              </Button>
            )}
            <div className="hidden sm:block">
              <ConnectButton
                accountStatus="avatar"
                chainStatus="icon"
                showBalance={false}
              />
            </div>
          </div>
        </NavBody>

        <MobileNav className="border border-primary/20 bg-background/95 backdrop-blur">
          <MobileNavHeader>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                <Target className="h-4 w-4 text-primary" />
              </span>
              Quinty
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative w-full rounded-xl px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                {item.name}
              </Link>
            ))}
            <div className="flex w-full flex-col gap-4">
              {isConnected && (
                <Button
                  variant={isVerified ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowVerifyModal(true)}
                  className="w-full gap-2"
                >
                  <ShieldCheck className={`h-4 w-4 ${isVerified ? "text-green-600" : ""}`} />
                  {isVerified ? "Verified" : "Verify Identity"}
                </Button>
              )}
              <div className="w-full rounded-lg border border-primary/25 bg-card/80 p-3">
                <ConnectButton
                  accountStatus="avatar"
                  chainStatus="icon"
                  showBalance={false}
                />
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              {isVerified
                ? "You are already verified! Update your information below if needed."
                : "Verify your identity to create funding requests, grants, and crowdfunding campaigns."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="socialHandle">
                Social Handle * <span className="text-xs text-muted-foreground">(e.g., Twitter/X username)</span>
              </Label>
              <Input
                id="socialHandle"
                placeholder="@yourhandle or yourhandle"
                value={verifyForm.socialHandle}
                onChange={(e) => setVerifyForm({ ...verifyForm, socialHandle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institutionName">
                Institution/Organization <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="institutionName"
                placeholder="Company or organization name"
                value={verifyForm.institutionName}
                onChange={(e) => setVerifyForm({ ...verifyForm, institutionName: e.target.value })}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> This is currently using placeholder ZK verification.
                In production, this will integrate with Reclaim Protocol or similar ZK proof systems
                to verify your social media accounts without revealing sensitive information.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={isPending}>
              {isPending ? "Verifying..." : isVerified ? "Update Verification" : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
