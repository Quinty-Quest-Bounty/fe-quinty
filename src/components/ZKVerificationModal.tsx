"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useZKVerification } from "../hooks/useZKVerification";
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
  ExternalLink
} from "lucide-react";
import { getExplorerUrl } from "../utils/contracts";

export default function ZKVerificationModal() {
  const { address } = useAccount();
  const { verificationData, loading, isVerified, submitProof } = useZKVerification();
  const [isOpen, setIsOpen] = useState(false);
  const [socialHandle, setSocialHandle] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [proofData, setProofData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!socialHandle.trim()) {
      setError("Social handle is required");
      return;
    }

    // For now, generate a dummy proof hash
    // In production, this would come from Reclaim Protocol
    const dummyProof = `0x${Buffer.from(
      `proof-${socialHandle}-${Date.now()}`
    ).toString('hex')}`;

    try {
      setSubmitting(true);
      setError(null);

      const hash = await submitProof(
        dummyProof,
        socialHandle,
        institutionName
      );

      setTxHash(hash);

      // Reset form
      setTimeout(() => {
        setSocialHandle("");
        setInstitutionName("");
        setProofData("");
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
        <Button variant={isVerified ? "outline" : "default"} size="sm">
          <ShieldCheck className="h-4 w-4 mr-2" />
          {isVerified ? "Verified" : "Verify Identity"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ZK Identity Verification</DialogTitle>
          <DialogDescription>
            Verify your identity using zero-knowledge proofs to link your wallet
            with social accounts without revealing sensitive information.
          </DialogDescription>
        </DialogHeader>

        {isVerified && verificationData ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Your identity is verified!
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm text-gray-600">Social Handle</Label>
                <p className="font-medium">{verificationData.socialHandle}</p>
              </div>

              {verificationData.institutionName && (
                <div>
                  <Label className="text-sm text-gray-600">Institution</Label>
                  <p className="font-medium">{verificationData.institutionName}</p>
                </div>
              )}

              <div>
                <Label className="text-sm text-gray-600">Verified At</Label>
                <p className="text-sm">
                  {new Date(Number(verificationData.verifiedAt) * 1000).toLocaleString()}
                </p>
              </div>

              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="socialHandle">
                Social Handle <span className="text-red-500">*</span>
              </Label>
              <Input
                id="socialHandle"
                placeholder="@username"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                disabled={submitting}
                required
              />
              <p className="text-xs text-gray-500">
                Your Twitter, GitHub, or other social platform handle
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution (Optional)</Label>
              <Input
                id="institution"
                placeholder="Organization or institution"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <Alert className="border-blue-500 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-xs">
                <strong>Demo Mode:</strong> In production, this would integrate with Reclaim Protocol
                for actual ZK proof generation. For now, a demo proof will be generated.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {txHash && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verification successful!</span>
                    <a
                      href={getExplorerUrl(txHash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
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
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !socialHandle.trim()}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <strong>About ZK Verification:</strong>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>Proves ownership without revealing private data</li>
            <li>Links wallet to social identity on-chain</li>
            <li>Required for creating grants and crowdfunding campaigns</li>
            <li>One-time verification per wallet</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
