"use client";

import { useChainId } from "wagmi";
import { MANTLE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { ensureMantleSepoliaNetwork, ensureBaseSepoliaNetwork } from "../utils/network";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function NetworkBanner() {
  const chainId = useChainId();
  const isSupportedNetwork = chainId === MANTLE_SEPOLIA_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID;

  const handleSwitchToMantle = async () => {
    const success = await ensureMantleSepoliaNetwork();
    if (success) {
      window.location.reload();
    }
  };

  const handleSwitchToBase = async () => {
    const success = await ensureBaseSepoliaNetwork();
    if (success) {
      window.location.reload();
    }
  };

  if (isSupportedNetwork) {
    return null;
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 border-yellow-200">
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Wrong Network
          </Badge>
          <span className="text-yellow-800 text-sm">
            Please switch to a supported network to use Quintle
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSwitchToMantle}
            className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
          >
            Switch to Mantle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSwitchToBase}
            className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
          >
            Switch to Base
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
