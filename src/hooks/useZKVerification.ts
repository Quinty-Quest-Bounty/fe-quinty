import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getContract } from 'viem';
import { ZK_VERIFICATION_ABI, getContractAddress } from '../utils/contracts';

export interface VerificationData {
  isVerified: boolean;
  verifiedAt: bigint;
  socialHandle: string;
  institutionName: string;
}

export function useZKVerification() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress('ZKVerification');

  // Fetch verification status
  useEffect(() => {
    async function fetchVerification() {
      if (!address || !publicClient) return;

      try {
        setLoading(true);
        const contract = getContract({
          address: contractAddress as `0x${string}`,
          abi: ZK_VERIFICATION_ABI,
          client: publicClient,
        });

        const result = await contract.read.getVerification([address]) as [boolean, bigint, string, string];

        setVerificationData({
          isVerified: result[0],
          verifiedAt: result[1],
          socialHandle: result[2],
          institutionName: result[3],
        });
        setError(null);
      } catch (err: any) {
        console.error('Error fetching verification:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVerification();
  }, [address, publicClient, contractAddress]);

  // Submit ZK proof for verification
  const submitProof = async (proof: string, socialHandle: string, institutionName: string = '') => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: ZK_VERIFICATION_ABI,
        client: walletClient,
      });

      const hash = await contract.write.submitZKProof([
        proof as `0x${string}`,
        socialHandle,
        institutionName,
      ]);

      // Wait for transaction
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Refresh verification data
      const updatedContract = getContract({
        address: contractAddress as `0x${string}`,
        abi: ZK_VERIFICATION_ABI,
        client: publicClient!,
      });

      const result = await updatedContract.read.getVerification([address]) as [boolean, bigint, string, string];

      setVerificationData({
        isVerified: result[0],
        verifiedAt: result[1],
        socialHandle: result[2],
        institutionName: result[3],
      });

      setError(null);
      return hash;
    } catch (err: any) {
      console.error('Error submitting proof:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if a specific address is verified
  const checkVerification = async (checkAddress: string): Promise<boolean> => {
    if (!publicClient) return false;

    try {
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: ZK_VERIFICATION_ABI,
        client: publicClient,
      });

      const isVerified = await contract.read.isVerified([checkAddress as `0x${string}`]);
      return isVerified as boolean;
    } catch (err) {
      console.error('Error checking verification:', err);
      return false;
    }
  };

  // Get address by social handle
  const getAddressBySocial = async (socialHandle: string): Promise<string | null> => {
    if (!publicClient) return null;

    try {
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: ZK_VERIFICATION_ABI,
        client: publicClient,
      });

      const address = await contract.read.getAddressBySocialHandle([socialHandle]);
      return address as string;
    } catch (err) {
      console.error('Error getting address by social:', err);
      return null;
    }
  };

  return {
    verificationData,
    loading,
    error,
    isVerified: verificationData?.isVerified ?? false,
    submitProof,
    checkVerification,
    getAddressBySocial,
  };
}
