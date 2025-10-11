// Network switching and adding utilities for Base Sepolia
export const BASE_SEPOLIA_PARAMS = {
  chainId: '0x14a34', // 84532 in hex
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia-explorer.base.org'],
};

export const addBaseSepoliaNetwork = async () => {
  try {
    await window.ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [BASE_SEPOLIA_PARAMS],
    });
    console.log('Base Sepolia added to wallet');
    return true;
  } catch (error) {
    console.error('Failed to add Base Sepolia:', error);
    return false;
  }
};

export const switchToBaseSepolia = async () => {
  try {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_PARAMS.chainId }],
    });
    console.log('Switched to Base Sepolia');
    return true;
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      console.log('Base Sepolia not found, adding it...');
      return await addBaseSepoliaNetwork();
    }
    console.error('Failed to switch to Base Sepolia:', error);
    return false;
  }
};

export const ensureBaseSepoliaNetwork = async () => {
  if (!window.ethereum) {
    alert('Please install MetaMask or another Web3 wallet');
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });

    if (chainId !== BASE_SEPOLIA_PARAMS.chainId) {
      console.log('Not on Base Sepolia, switching...');
      return await switchToBaseSepolia();
    }

    console.log('Already on Base Sepolia');
    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};