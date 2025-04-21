// All-in-one contract utility file with NO dynamic imports
// This file contains all the contract data and functions needed for the Sepolia network
import { ethers } from "ethers";

// Simplified ABI with just the functions we need
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

// Hardcoded Sepolia contract address
const SEPOLIA_CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

// Hardcoded Sepolia chain ID
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

/**
 * Check if the current network is Sepolia
 * @returns {Promise<boolean>}
 */
export const isSepoliaNetwork = async () => {
  if (typeof window.ethereum === 'undefined') {
    console.error("MetaMask not installed");
    return false;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log("Current chain ID:", chainId);
    return chainId === SEPOLIA_CHAIN_ID_HEX;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Switch to Sepolia network
 * @returns {Promise<void>}
 */
export const switchToSepoliaNetwork = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("MetaMask not installed");
  }
  
  try {
    // Try to switch to Sepolia
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
    });
    console.log("Switched to Sepolia network");
  } catch (error) {
    // If the network is not added, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
        console.log("Added and switched to Sepolia network");
      } catch (addError) {
        console.error("Error adding Sepolia network:", addError);
        throw addError;
      }
    } else {
      console.error("Error switching to Sepolia network:", error);
      throw error;
    }
  }
};

/**
 * Get a contract instance
 * @param {Object} signerOrProvider - Ethers.js signer or provider
 * @returns {Promise<Object>} Contract instance
 */
export const getContract = async (signerOrProvider) => {
  if (!signerOrProvider) {
    throw new Error("No signer or provider provided");
  }
  
  // Check if we're on Sepolia
  if (signerOrProvider.provider) {
    const network = await signerOrProvider.provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      console.warn(`Connected to chain ID ${network.chainId}, but Sepolia (${SEPOLIA_CHAIN_ID}) is required`);
    }
  }
  
  // Create and return contract instance
  return new ethers.Contract(
    SEPOLIA_CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signerOrProvider
  );
};

/**
 * Get the mint price
 * @param {Object} contract - Contract instance
 * @returns {Promise<string>} Mint price in ETH
 */
export const getMintPrice = async (contract) => {
  try {
    const price = await contract.getMintPrice();
    return ethers.utils.formatEther(price);
  } catch (error) {
    console.error("Error getting mint price:", error);
    throw error;
  }
};

/**
 * Get the current supply
 * @param {Object} contract - Contract instance
 * @returns {Promise<string>} Current supply
 */
export const getCurrentSupply = async (contract) => {
  try {
    const supply = await contract.getCurrentSupply();
    return supply.toString();
  } catch (error) {
    console.error("Error getting current supply:", error);
    throw error;
  }
};

/**
 * Get the max supply
 * @param {Object} contract - Contract instance
 * @returns {Promise<string>} Max supply
 */
export const getMaxSupply = async (contract) => {
  try {
    const maxSupply = await contract.getMaxSupply();
    return maxSupply.toString();
  } catch (error) {
    console.error("Error getting max supply:", error);
    throw error;
  }
};

/**
 * Mint a new NFT
 * @param {Object} contract - Contract instance
 * @param {string} tokenURI - Token URI
 * @returns {Promise<Object>} Transaction
 */
export const mintNFT = async (contract, tokenURI) => {
  try {
    // Get mint price
    const mintPriceWei = await contract.getMintPrice();
    console.log('Mint price:', ethers.utils.formatEther(mintPriceWei), 'ETH');
    
    // Mint NFT with value equal to mint price
    const tx = await contract.publicMint(tokenURI, { 
      value: mintPriceWei,
      gasLimit: 500000 // Explicit gas limit to avoid estimation issues
    });
    console.log('Mint transaction sent:', tx.hash);
    return tx;
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
};

/**
 * Get all NFTs owned by an address
 * @param {Object} contract - Contract instance
 * @param {string} address - Owner address
 * @returns {Promise<Array>} Array of NFTs
 */
export const getNFTsByOwner = async (contract, address) => {
  try {
    // Get balance
    const balance = await contract.balanceOf(address);
    const balanceNumber = balance.toNumber();
    
    // Get all tokens
    const tokens = [];
    for (let i = 0; i < balanceNumber; i++) {
      // Get token ID
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      
      // Get token URI
      const tokenURI = await contract.tokenURI(tokenId);
      
      // Parse metadata
      let metadata;
      try {
        metadata = JSON.parse(tokenURI);
      } catch (e) {
        metadata = { name: `NFT #${tokenId}`, description: "Metadata unavailable" };
      }
      
      tokens.push({
        id: tokenId.toString(),
        ...metadata
      });
    }
    
    return tokens;
  } catch (error) {
    console.error("Error getting NFTs by owner:", error);
    throw error;
  }
};

// Export a default object with all functions for easier imports
export default {
  isSepoliaNetwork,
  switchToSepoliaNetwork,
  getContract,
  getMintPrice,
  getCurrentSupply,
  getMaxSupply,
  mintNFT,
  getNFTsByOwner,
  SEPOLIA_CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  CONTRACT_ABI
};
