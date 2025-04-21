import { useState, useEffect, useCallback } from "react";
// Import from our new sepoliaContract.js file
import { 
  getContract, 
  getMintPrice, 
  getCurrentSupply, 
  getMaxSupply,
  isSepoliaNetwork
} from "../utils/sepoliaContract.js";

const useDirectContract = (signer, provider) => {
  const [state, setState] = useState({
    contract: null,
    mintPrice: "0",
    currentSupply: 0,
    maxSupply: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize contract
  const initContract = useCallback(async () => {
    if (!signer && !provider) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get contract instance using our new contractData.js file
      const contractInstance = await getContract(signer || provider);
      
      // Get contract data
      const price = await getMintPrice(contractInstance);
      const supply = await getCurrentSupply(contractInstance);
      const max = await getMaxSupply(contractInstance);
      
      setState({
        contract: contractInstance,
        mintPrice: price,
        currentSupply: supply,
        maxSupply: max
      });
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [signer, provider]);

  // Refresh contract data
  const refreshContractData = useCallback(async () => {
    if (!state.contract) return;
    
    try {
      const mintPrice = await getDirectMintPrice(state.contract);
      const currentSupply = await getDirectCurrentSupply(state.contract);
      const maxSupply = await getDirectMaxSupply(state.contract);
      
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

export default useDirectContract;
