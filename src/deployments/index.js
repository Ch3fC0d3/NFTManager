// Static deployment data with hardcoded values to avoid any dynamic imports

// Hardcoded Sepolia deployment data
const SEPOLIA_DATA = {
  contractAddress: "0xd9145CCE52D386f254917e481eB44e9943F39138",
  deploymentBlock: 4270321,
  deploymentTimestamp: "2025-04-21T13:54:00.000Z"
};

// Export deployment data directly
export const deployments = {
  // Sepolia testnet (PREFERRED NETWORK)
  11155111: {
    contractAddress: SEPOLIA_DATA.contractAddress,
    deploymentBlock: SEPOLIA_DATA.deploymentBlock,
    deploymentTimestamp: SEPOLIA_DATA.deploymentTimestamp,
    networkName: 'Sepolia'
  }
};

// Helper function to get deployment data
export const getDeploymentData = async (chainId) => {
  // Only return Sepolia deployment data
  if (chainId === 11155111) {
    return SEPOLIA_DATA;
  }
  
  // For other networks, throw a clear error
  throw new Error(`This application is only supported on Sepolia (11155111) network. Please switch your wallet to Sepolia network to continue.`);
};
