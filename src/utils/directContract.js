// Direct contract initialization without any dynamic imports
// This file contains hardcoded contract information to avoid any build issues

import { ethers } from "ethers";

// Simplified contract ABI with just the functions we need
const CONTRACT_ABI = [
  // Read functions
  "function getMintPrice() view returns (uint256)",
  "function getCurrentSupply() view returns (uint256)",
  "function getMaxSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Write functions
  "function publicMint(string memory tokenURI) payable",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Hardcoded contract addresses for each network
const CONTRACT_ADDRESSES = {
  // Sepolia testnet (PREFERRED NETWORK)
  11155111: "0xd9145CCE52D386f254917e481eB44e9943F39138",
  
  // Polygon Amoy testnet
  80002: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  
  // Goerli testnet
  5: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  
  // Localhost
  1337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

// Get the current chain ID
export const getChainId = async () => {
  if (!window.ethereum) throw new Error("No Ethereum provider found");
  
  try {
    const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(hexChainId, 16);
  } catch (error) {
    console.error("Error getting chain ID:", error);
    throw error;
  }
};

// Get contract directly without any dynamic imports
export const getDirectContract = async (signerOrProvider) => {
  if (!signerOrProvider) throw new Error("No signer or provider available");
  
  try {
    // Get chain ID
    let chainId;
    
    if (signerOrProvider.provider?.network?.chainId) {
      // For signers
      chainId = signerOrProvider.provider.network.chainId;
    } else if (signerOrProvider.network?.chainId) {
      // For providers
      chainId = signerOrProvider.network.chainId;
    } else {
      // Try to get it from ethereum
      chainId = await getChainId();
    }
    
    console.log(`Current chain ID: ${chainId}`);
    
    // Get contract address for this network
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    if (!contractAddress) {
      console.warn(`No contract deployed on network with chain ID ${chainId}`);
      throw new Error(`This application is only supported on Sepolia (11155111) network. Please switch your wallet to Sepolia network to continue.`);
    }
    
    console.log(`Using contract address: ${contractAddress}`);
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signerOrProvider);
    
    // Verify contract exists by checking a simple read function
    try {
      await contract.provider.getCode(contractAddress);
      return contract;
    } catch (error) {
      console.error(`Failed to verify contract at address ${contractAddress}:`, error);
      throw new Error(`The contract at address ${contractAddress} is not available on this network. Please switch to Sepolia (11155111) network to continue.`);
    }
  } catch (error) {
    console.error("Error creating contract instance:", error);
    throw error;
  }
};

// Helper functions that work with the direct contract

export const getDirectMintPrice = async (contract) => {
  const price = await contract.getMintPrice();
  return ethers.utils.formatEther(price);
};

export const getDirectCurrentSupply = async (contract) => {
  const supply = await contract.getCurrentSupply();
  return supply.toNumber();
};

export const getDirectMaxSupply = async (contract) => {
  const maxSupply = await contract.getMaxSupply();
  return maxSupply.toNumber();
};

// Function to mint a new NFT
export const directMintNFT = async (contract, tokenURI) => {
  try {
    // Get the mint price from the contract
    const mintPrice = await contract.getMintPrice();
    console.log('Mint price:', ethers.utils.formatEther(mintPrice), 'ETH');
    
    // The smart contract's publicMint function only takes the URI as a parameter
    // and the value is sent as part of the transaction options
    const tx = await contract.publicMint(tokenURI, { 
      value: mintPrice,
      gasLimit: 250000 // Add a reasonable gas limit to avoid transaction failures
    });
    
    console.log('Mint transaction sent:', tx.hash);
    return tx;
  } catch (error) {
    console.error('Error in mintNFT function:', error);
    throw error; // Re-throw to allow component-level error handling
  }
};

// Function to get owned tokens
export const getDirectOwnedTokens = async (contract, owner) => {
  try {
    // Get the balance of the owner
    const balance = await contract.balanceOf(owner);
    const balanceNumber = balance.toNumber();
    
    if (balanceNumber === 0) {
      return [];
    }
    
    // Get all token IDs owned by the address
    const tokenPromises = [];
    for (let i = 0; i < balanceNumber; i++) {
      const tokenIdPromise = contract.tokenOfOwnerByIndex(owner, i)
        .then(async (tokenId) => {
          const uri = await contract.tokenURI(tokenId);
          return {
            id: tokenId.toNumber(),
            uri
          };
        });
      tokenPromises.push(tokenIdPromise);
    }
    
    return Promise.all(tokenPromises);
  } catch (error) {
    console.error("Error getting owned tokens:", error);
    throw error;
  }
};
