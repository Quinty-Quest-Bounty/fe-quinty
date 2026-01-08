// Network switching and adding utilities
export const MANTLE_SEPOLIA_PARAMS = {
  chainId: '0x138b', // 5003 in hex
  chainName: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
  blockExplorerUrls: ['https://sepolia.mantlescan.xyz'],
};

export const BASE_SEPOLIA_PARAMS = {
  chainId: '0x14a34', // 84532 in hex
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
};

export const addNetwork = async (params: any) => {
  try {
    await window.ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });
    return true;
  } catch (error) {
    console.error('Failed to add network:', error);
    return false;
  }
};

export const switchNetwork = async (chainIdHex: string) => {
  try {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      if (chainIdHex === MANTLE_SEPOLIA_PARAMS.chainId) return await addNetwork(MANTLE_SEPOLIA_PARAMS);
      if (chainIdHex === BASE_SEPOLIA_PARAMS.chainId) return await addNetwork(BASE_SEPOLIA_PARAMS);
    }
    console.error('Failed to switch network:', error);
    return false;
  }
};

export const ensureNetwork = async (chainIdHex: string) => {
  if (!window.ethereum) {
    alert('Please install MetaMask or another Web3 wallet');
    return false;
  }

  try {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

    if (currentChainId !== chainIdHex) {
      return await switchNetwork(chainIdHex);
    }

    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Legacy exports for compatibility
export const ensureMantleSepoliaNetwork = () => ensureNetwork(MANTLE_SEPOLIA_PARAMS.chainId);
export const ensureBaseSepoliaNetwork = () => ensureNetwork(BASE_SEPOLIA_PARAMS.chainId);

