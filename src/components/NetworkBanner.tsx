"use client";

import { useChainId } from "wagmi";
import { MANTLE_SEPOLIA_CHAIN_ID } from "../utils/contracts";
import { ensureMantleSepoliaNetwork } from "../utils/network";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function NetworkBanner() {
  const chainId = useChainId();
  const isOnMantleSepolia = chainId === MANTLE_SEPOLIA_CHAIN_ID;

  const handleSwitchNetwork = async () => {
    const success = await ensureMantleSepoliaNetwork();
    if (success) {
      window.location.reload();
    }
  };

  if (isOnMantleSepolia) {
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
            Please switch to Mantle Sepolia to use Quintle
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSwitchNetwork}
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          Switch Network
        </Button>
      </AlertDescription>
    </Alert>
  );
}
