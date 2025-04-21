import { ethers } from "ethers";
import type { CryptoCanvas } from "../types/contracts";
// Updated import path to correctly resolve the contract ABI
import contractAbi from "../../artifacts/contracts/CryptoCanvas.sol/CryptoCanvas.json";

// Import ABI and contract addresses
// Hardcoded Sepolia deployment data
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

export const getNetworkConfig = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("Contract not deployed to this network. Please switch your wallet to Sepolia (11155111). ");
  }
  return {
    contractAddress: SEPOLIA_CONTRACT_ADDRESS,
    contractAbi: contractAbi.abi,
    chainId: SEPOLIA_CHAIN_ID
  };
};

export const getContract = async (
  signerOrProvider: ethers.Signer | ethers.providers.Provider
): Promise<CryptoCanvas> => {
  const config = await getNetworkConfig();
  return new ethers.Contract(
    config.contractAddress,
    config.contractAbi,
    signerOrProvider
  ) as unknown as CryptoCanvas;
};

export const getMintPrice = async (
  contract: CryptoCanvas
): Promise<string> => {
  const price = await contract.getMintPrice();
  return ethers.utils.formatEther(price);
};

export const getCurrentSupply = async (
  contract: CryptoCanvas
): Promise<number> => {
  const supply = await contract.getCurrentSupply();
  return supply.toNumber();
};

export const getMaxSupply = async (
  contract: CryptoCanvas
): Promise<number> => {
  const maxSupply = await contract.getMaxSupply();
  return maxSupply.toNumber();
};

// Function to mint a new NFT
export const mintNFT = async (
  contract: CryptoCanvas,
  tokenURI: string
): Promise<ethers.ContractTransaction> => {
  const mintPrice = await contract.getMintPrice();
  return contract.publicMint(tokenURI, { value: mintPrice });
};

// Function to get owned tokens
export const getOwnedTokens = async (
  contract: CryptoCanvas,
  owner: string
): Promise<{ id: number; uri: string }[]> => {
  const currentSupply = await getCurrentSupply(contract);
  const ownedTokens = [];

  // This is not efficient for large collections but works for demo
  for (let i = 0; i < currentSupply; i++) {
    try {
      const tokenOwner = await contract.ownerOf(i);
      if (tokenOwner.toLowerCase() === owner.toLowerCase()) {
        const uri = await contract.tokenURI(i);
        ownedTokens.push({ id: i, uri });
      }
    } catch (error) {
      console.error(`Error checking token ${i}:`, error);
    }
  }

  return ownedTokens;
};