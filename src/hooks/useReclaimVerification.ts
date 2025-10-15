import { useState, useCallback } from "react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";

interface ReclaimVerificationResult {
  proof: string;
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
}

export function useReclaimVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID!;
  const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET!;

  const verifyTwitter = useCallback(async (): Promise<ReclaimVerificationResult | null> => {
    setIsVerifying(true);
    setError(null);

    try {
      console.log("Initializing Reclaim with APP_ID:", APP_ID);

      // Initialize Reclaim Proof Request with correct provider ID for Twitter
      // X Username provider ID from your Reclaim dashboard
      const TWITTER_PROVIDER_ID = "a09df809-ea2d-4413-ab2f-0d83689e388d";

      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        TWITTER_PROVIDER_ID
      );

      console.log("Reclaim initialized successfully");

      // Build the proof request URL
      const requestUrl = await reclaimProofRequest.getRequestUrl();

      console.log("Request URL generated:", requestUrl);

      // Open verification in new window with better dimensions
      const verificationWindow = window.open(
        requestUrl,
        "reclaimVerification",
        "width=500,height=600,left=100,top=100"
      );

      if (!verificationWindow) {
        throw new Error("Failed to open verification window. Please allow popups.");
      }

      // Wait for proof via session
      return new Promise((resolve, reject) => {
        console.log("Starting Reclaim session...");

        // Start session to listen for proofs
        reclaimProofRequest.startSession({
          onSuccess: (proofs: any) => {
            console.log("✅ Verification successful! Proofs received:", proofs);

            if (proofs && proofs.length > 0) {
              const proof = proofs[0];
              console.log("Proof details:", proof);

              // Extract Twitter username from the proof
              let twitterHandle = "";
              try {
                const claimData = proof.claimData || {};
                const context = claimData.context || "{}";
                const contextObj = typeof context === "string" ? JSON.parse(context) : context;
                twitterHandle = contextObj.extractedParameters?.username ||
                               contextObj.username ||
                               "";
              } catch (e) {
                console.error("Error parsing context:", e);
              }

              // Extract claim data
              const result: ReclaimVerificationResult = {
                proof: JSON.stringify(proof),
                claimData: {
                  provider: proof.provider || TWITTER_PROVIDER_ID,
                  parameters: twitterHandle,
                  context: JSON.stringify(proof.claimData || {}),
                },
              };

              console.log("Parsed result:", result);

              setIsVerifying(false);
              verificationWindow?.close();
              resolve(result);
            } else {
              console.error("No proofs in response");
              setError("No proof received from Reclaim");
              setIsVerifying(false);
              verificationWindow?.close();
              resolve(null);
            }
          },
          onError: (error: Error) => {
            console.error("❌ Verification error:", error);
            setError(error.message || "Verification failed");
            setIsVerifying(false);
            verificationWindow?.close();
            reject(error);
          },
        });

        // Handle window close with cleanup
        const checkWindowClosed = setInterval(() => {
          if (verificationWindow?.closed) {
            clearInterval(checkWindowClosed);
            if (isVerifying) {
              console.log("Verification window was closed by user");
              setError("Verification window closed");
              setIsVerifying(false);
              resolve(null);
            }
          }
        }, 1000);

        // Add timeout for safety (5 minutes)
        setTimeout(() => {
          if (isVerifying) {
            console.log("Verification timeout");
            clearInterval(checkWindowClosed);
            setError("Verification timed out");
            setIsVerifying(false);
            verificationWindow?.close();
            resolve(null);
          }
        }, 5 * 60 * 1000);
      });
    } catch (err) {
      console.error("❌ Error initializing Reclaim:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize verification";
      setError(errorMessage);
      setIsVerifying(false);
      return null;
    }
  }, [APP_ID, APP_SECRET]);

  return {
    verifyTwitter,
    isVerifying,
    error,
  };
}
