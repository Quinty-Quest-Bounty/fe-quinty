"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useZKVerification } from "../hooks/useZKVerification";
import { useSocialVerification } from "../hooks/useSocialVerification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  X as XIcon,
} from "lucide-react";
import { getExplorerUrl } from "../utils/contracts";

export default function ZKVerificationModal({ iconOnly = false }: { iconOnly?: boolean }) {
  const { address } = useAccount();
  const { verificationData, isVerified, submitProof } = useZKVerification();
  const {
    xAccount,
    connectX,
    disconnectX,
    isConnecting,
    error: socialError,
    isConnected,
  } = useSocialVerification();

  const [isOpen, setIsOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnectX = async () => {
    await connectX();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !xAccount) {
      setError("Please connect your X account");
      return;
    }

    const dummyProof = `0x${Buffer.from(
      `proof-${xAccount.username}-${Date.now()}`
    ).toString("hex")}`;

    try {
      setSubmitting(true);
      setError(null);

      const hash = await submitProof(dummyProof, xAccount.username, institutionName);

      setTxHash(hash);

      // Reset form
      setTimeout(() => {
        setInstitutionName("");
        setIsOpen(false);
        setTxHash(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (!address) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <button 
            className={`h-9 w-9 flex items-center justify-center transition-colors ${
              isVerified 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-white/20 hover:bg-white/30 text-white"
            }`}
          >
            <ShieldCheck className={`h-4 w-4 ${isVerified ? "text-[#0EA885]" : ""}`} />
          </button>
        ) : (
          <Button 
            variant={isVerified ? "outline" : "default"} 
            size="sm"
            className="h-9 px-4 font-bold text-xs uppercase tracking-wider shadow-none border-0"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {isVerified ? "Verified" : "Verify Identity"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-2 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">X Verification</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Connect your X account to verify your identity on-chain.
          </DialogDescription>
        </DialogHeader>

        {isVerified && verificationData ? (
          <div className="space-y-4">
            <Alert className="border-2 border-[#0EA885] bg-[#0EA885]/5">
              <CheckCircle className="h-4 w-4 text-[#0EA885]" />
              <AlertDescription className="text-slate-900 font-bold">
                Your identity is verified!
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">X Account</Label>
                <div className="mt-2 flex items-center gap-2 p-3 bg-black border-2 border-black">
                  <XIcon className="h-5 w-5 text-white" />
                  <span className="font-bold text-white">{verificationData.socialHandle}</span>
                  <Badge
                    variant="outline"
                    className="ml-auto bg-[#0EA885] text-white border-0 font-bold text-[10px] uppercase tracking-wider"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>

              {verificationData.institutionName && (
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Institution</Label>
                  <p className="font-bold mt-1">{verificationData.institutionName}</p>
                </div>
              )}

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Verified At</Label>
                <p className="text-sm mt-1">
                  {new Date(Number(verificationData.verifiedAt) * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-wider">
                Connect X Account <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-slate-600">
                Connect your X account to verify your identity.
              </p>

              <div
                className={`flex items-center justify-between p-4 border-2 ${
                  isConnected ? "bg-black border-black" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <XIcon className={`h-6 w-6 ${isConnected ? "text-white" : "text-black"}`} />
                  <div>
                    <p className={`font-bold ${isConnected ? "text-white" : ""}`}>X</p>
                    {xAccount && (
                      <p className={`text-xs font-medium ${isConnected ? "text-gray-300" : "text-gray-600"}`}>
                        {xAccount.username}
                      </p>
                    )}
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-[#0EA885] text-white border-0 font-bold text-[10px] uppercase tracking-wider"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={disconnectX}
                      disabled={submitting}
                      className="text-white hover:bg-gray-800 h-8 px-3"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleConnectX}
                    disabled={isConnecting || submitting}
                    className="h-8 px-4 font-bold text-xs uppercase tracking-wider border-2 border-slate-900"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution" className="text-xs font-bold uppercase tracking-wider">Institution (Optional)</Label>
              <Input
                id="institution"
                placeholder="Organization or institution"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                disabled={submitting}
                className="border-2 border-slate-200 h-10"
              />
            </div>

            {socialError && (
              <Alert className="border-2 border-orange-500 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900 text-xs font-medium">
                  {socialError}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-2 border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 text-xs font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {txHash && (
              <Alert className="border-2 border-[#0EA885] bg-[#0EA885]/5">
                <CheckCircle className="h-4 w-4 text-[#0EA885]" />
                <AlertDescription className="text-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Verification successful!</span>
                    <a
                      href={getExplorerUrl(txHash, "tx")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-[#0EA885] hover:underline font-bold uppercase tracking-wider"
                    >
                      View TX <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={submitting}
                  className="flex-1 h-10 font-bold text-xs uppercase tracking-wider border-2 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !isConnected}
                  className="flex-1 h-10 bg-[#0EA885] hover:bg-[#0c8a6f] text-white font-bold text-xs uppercase tracking-wider shadow-none border-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Submit Verification
                    </>
                  )}
                </Button>
              </div>
          </form>
        )}

        <div className="mt-4 p-3 bg-slate-100 border border-slate-200 text-xs text-slate-700">
          <strong className="font-bold uppercase tracking-wider">About X Verification:</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Proves X account ownership via OAuth</li>
            <li>Your X username is stored on-chain</li>
            <li>Required for creating grants and crowdfunding campaigns</li>
            <li>One-time verification per wallet</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
