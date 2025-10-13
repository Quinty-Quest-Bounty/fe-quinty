"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "@wagmi/core";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
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
import { Target, ShieldCheck, Menu, CheckCircle2, Sparkles, X } from "lucide-react";
import { CONTRACT_ADDRESSES, ZK_VERIFICATION_ABI, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { wagmiConfig } from "../utils/web3";
import { useAlertDialog } from "@/hooks/useAlertDialog";

const navItems = [
  { name: "Bounties", link: "/bounties" },
  { name: "Disputes", link: "/disputes" },
  { name: "Reputation", link: "/reputation" },
  { name: "Airdrops", link: "/airdrops" },
  { name: "Funding", link: "/funding" },
];

export default function Header() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { showAlert } = useAlertDialog();

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
      showAlert({
        title: "Missing Information",
        description: "Please enter your social handle (e.g., Twitter/X username)",
        variant: "warning",
      });
      return;
    }

    try {
      const placeholderProof = new Uint8Array(32);

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
      showAlert({
        title: "Verification Failed",
        description: "Unable to verify your identity. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Floating Navbar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto mx-4 w-full max-w-7xl rounded-2xl border border-border/40 bg-background/80 shadow-lg backdrop-blur-xl"
        >
          <div className="flex h-16 items-center justify-between px-6">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 transition-transform hover:scale-105"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/60 shadow-lg shadow-primary/30">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden text-xl font-bold tracking-tight sm:inline-block">
                Quinty
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className={cn(
                    "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    "hover:text-primary",
                    "group"
                  )}
                >
                  {item.name}
                  <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-3 lg:flex">
              {isConnected && (
                <Button
                  variant={isVerified ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowVerifyModal(true)}
                  className={cn(
                    "gap-2 transition-all",
                    isVerified && "border-green-600/50 bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-md hover:shadow-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
                  )}
                >
                  {isVerified ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {isVerified ? "Verified" : "Verify Identity"}
                </Button>
              )}
              <ConnectButton
                accountStatus="address"
                chainStatus="icon"
                showBalance={false}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-3 lg:hidden">
              {isConnected && (
                <Button
                  variant={isVerified ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setShowVerifyModal(true)}
                  className={cn(
                    "h-9 w-9 p-0",
                    isVerified && "border-green-600/50 bg-green-50 dark:bg-green-950"
                  )}
                >
                  {isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-9 w-9 p-0"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/40 lg:hidden"
              >
                <nav className="flex flex-col gap-1 p-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-border/40 pt-4">
                    <ConnectButton
                      accountStatus="full"
                      chainStatus="full"
                      showBalance={true}
                    />
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-24" />

      {/* Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Verify Your Identity
            </DialogTitle>
            <DialogDescription className="text-base">
              {isVerified
                ? "You're already verified! Update your information below if needed."
                : "Link your social identity to create funding requests, grants, and crowdfunding campaigns."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="socialHandle" className="text-sm font-medium">
                Social Handle <span className="text-destructive">*</span>
              </Label>
              <Input
                id="socialHandle"
                placeholder="@yourhandle"
                value={verifyForm.socialHandle}
                onChange={(e) => setVerifyForm({ ...verifyForm, socialHandle: e.target.value })}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Your Twitter/X username or other social handle
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institutionName" className="text-sm font-medium">
                Organization <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="institutionName"
                placeholder="Company or institution name"
                value={verifyForm.institutionName}
                onChange={(e) => setVerifyForm({ ...verifyForm, institutionName: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Privacy First</p>
                  <p className="text-xs text-muted-foreground">
                    Using placeholder ZK verification. In production, we'll integrate with Reclaim Protocol
                    to verify your social accounts without revealing credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowVerifyModal(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Verifying...
                </>
              ) : isVerified ? (
                "Update Verification"
              ) : (
                "Verify Identity"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
