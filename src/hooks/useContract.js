import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getContract, getMintPrice, getCurrentSupply, getMaxSupply } from "../utils/sepoliaContract.js";
import contractAbi from "../../artifacts/contracts/CryptoCanvas.sol/CryptoCanvas.json";

const useContract = (signer, provider) => {
  const [state, setState] = useState({
    contract: null,
    mintPrice: "0",
    currentSupply: 0,
    maxSupply: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback contract addresses for different networks
  const FALLBACK_ADDRESSES = {
    // Sepolia testnet
    11155111: "0xd9145CCE52D386f254917e481eB44e9943F39138",
    // Goerli testnet
    5: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    // Polygon Amoy testnet
    80002: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    // Localhost
    1337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  };

  // Get contract with fallback mechanism
  const getContractWithFallback = async (signerOrProvider) => {
    try {
      // First try the normal way
      return await getContract(signerOrProvider);
    } catch (error) {
      console.log("Using fallback contract initialization due to error:", error.message);
      
      // If that fails, use fallback addresses
      if (!signerOrProvider) throw new Error("No signer or provider available");
      
      // Get the chain ID
      let chainId;
      if (signerOrProvider.provider?.network?.chainId) {
        // For signers
        chainId = signerOrProvider.provider.network.chainId;
      } else if (signerOrProvider.network?.chainId) {
        // For providers
        chainId = signerOrProvider.network.chainId;
      } else {
        // Try to get it from ethereum
        const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
        chainId = parseInt(hexChainId, 16);
      }
      
      // Check if we have a fallback address for this network
      const fallbackAddress = FALLBACK_ADDRESSES[chainId];
      if (!fallbackAddress) {
        throw new Error(`No contract deployed on network with chain ID ${chainId}`);
      }
      
      console.log(`Using fallback contract address for chain ID ${chainId}: ${fallbackAddress}`);
      
      // Create contract instance with fallback address
      return new ethers.Contract(fallbackAddress, contractAbi.abi, signerOrProvider);
    }
  };

  // Initialize contract
  const initContract = useCallback(async () => {
    if (!signer && !provider) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Initialize with signer if available, otherwise use provider
      const contract = await getContractWithFallback(signer || provider);
      
      // Get contract data
      const mintPrice = await getMintPrice(contract);
      const currentSupply = await getCurrentSupply(contract);
      const maxSupply = await getMaxSupply(contract);
      
      setState({
        contract,
        mintPrice,
        currentSupply,
        maxSupply
      });
    } catch (err) {
      console.error("Failed to initialize contract:", err);
      setError(err.message || "Failed to initialize contract");
    } finally {
      setIsLoading(false);
    }
  }, [signer, provider]);

  // Refresh contract data
  const refreshContractData = useCallback(async () => {
    if (!state.contract) return;
    
    try {
      const mintPrice = await getMintPrice(state.contract);
      const currentSupply = await getCurrentSupply(state.contract);
      const maxSupply = await getMaxSupply(state.contract);
      
      setState(prev => ({
        ...prev,
        mintPrice,
        currentSupply,
        maxSupply
      }));
    } catch (err) {
      console.error("Failed to refresh contract data:", err);
    }
  }, [state.contract]);

  // Initialize contract on mount or when signer/provider changes
  useEffect(() => {
    initContract();
  }, [initContract]);

  return {
    ...state,
    isLoading,
    error,
    refreshContractData
  };
};

export default useContract;
