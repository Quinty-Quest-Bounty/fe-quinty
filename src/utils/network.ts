// Network switching and adding utilities for Mantle Sepolia
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

export const addMantleSepoliaNetwork = async () => {
  try {
    await window.ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [MANTLE_SEPOLIA_PARAMS],
    });
    console.log('Mantle Sepolia added to wallet');
    return true;
  } catch (error) {
    console.error('Failed to add Mantle Sepolia:', error);
    return false;
  }
};

export const switchToMantleSepolia = async () => {
  try {
    await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MANTLE_SEPOLIA_PARAMS.chainId }],
    });
    console.log('Switched to Mantle Sepolia');
    return true;
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      console.log('Mantle Sepolia not found, adding it...');
      return await addMantleSepoliaNetwork();
    }
    console.error('Failed to switch to Mantle Sepolia:', error);
    return false;
  }
};

export const ensureMantleSepoliaNetwork = async () => {
  if (!window.ethereum) {
    alert('Please install MetaMask or another Web3 wallet');
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });

    if (chainId !== MANTLE_SEPOLIA_PARAMS.chainId) {
      console.log('Not on Mantle Sepolia, switching...');
      return await switchToMantleSepolia();
    }

    console.log('Already on Mantle Sepolia');
    return true;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};
