import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getContract, getMintPrice, getCurrentSupply, getMaxSupply } from "../utils/sepoliaContract";
import type { CryptoCanvas } from "../types/contracts";

interface ContractState {
  contract: CryptoCanvas | null;
  mintPrice: string;
  currentSupply: number;
  maxSupply: number;
}

export const useContract = (
  signer: ethers.Signer | null,
  provider: ethers.providers.Provider | null
) => {
  const [state, setState] = useState<ContractState>({
    contract: null,
    mintPrice: "0",
    currentSupply: 0,
    maxSupply: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract
  const initContract = useCallback(async () => {
    if (!signer && !provider) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Initialize with signer if available, otherwise use provider
      const contract = await getContract(signer || provider!);
      
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("Failed to refresh contract data:", err);
    }
  }, [state.contract]);

  // Initialize contract when signer or provider changes
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