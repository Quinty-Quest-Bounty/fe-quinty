// Contract addresses and ABIs for Quinty V2
import quintyABI from "./abi/quinty.json";
import reputationABI from "./abi/reputation.json";
import disputeABI from "./abi/dispute.json";
import airdropABI from "./abi/airdrop.json";

export const SOMNIA_TESTNET_ID = 50312;

export const CONTRACT_ADDRESSES = {
  [SOMNIA_TESTNET_ID]: {
    Quinty: "0x530E104Dc25D641b9b619e5C1CC556961b470f4f",
    QuintyReputation: "0x0889De145E2c78f1534f357190e0Fe8406bAc135",
    DisputeResolver: "0x3CA26DD1dA114A7A706A9155C2417cA53812750E",
    AirdropBounty: "0xfA270eDBe41ba112bd21653B61ce67c07f06F0a8",
  },
};

// Export ABIs from JSON files
export const QUINTY_ABI = quintyABI;
export const REPUTATION_ABI = reputationABI;
export const DISPUTE_ABI = disputeABI;
export const AIRDROP_ABI = airdropABI;

// Constants
export const MIN_VOTING_STAKE = "0.0001";
