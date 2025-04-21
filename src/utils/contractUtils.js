// ALL-IN-ONE CONTRACT UTILITIES FOR SEPOLIA ONLY
// This file contains all contract-related functions with NO dynamic imports
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

// Hardcoded Sepolia contract address and chain ID
export const SEPOLIA_CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

// Check if the current network is Sepolia
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

// Switch to Sepolia network
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

// Get network configuration - NO DYNAMIC IMPORTS
export const getNetworkConfig = async () => {
  try {
    // Get network from the connected provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    console.log(`Current chain ID: 0x${network.chainId.toString(16)}`);
    
    // Only allow Sepolia
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      throw new Error(`This application is only supported on Sepolia (${SEPOLIA_CHAIN_ID}) network. Please switch your wallet to Sepolia network to continue.`);
    }
    
    // Return hardcoded Sepolia data
    return { 
      contractAddress: SEPOLIA_CONTRACT_ADDRESS,
      contractAbi: CONTRACT_ABI,
      chainId: SEPOLIA_CHAIN_ID,
      networkName: 'Sepolia'
    };
  } catch (error) {
    console.error("Failed to get network config:", error);
    throw error;
  }
};

// Get contract instance
export const getContract = async (signerOrProvider) => {
  if (!signerOrProvider) {
    throw new Error("No signer or provider provided");
  }
  
  try {
    const config = await getNetworkConfig();
    return new ethers.Contract(
      config.contractAddress,
      config.contractAbi,
      signerOrProvider
    );
  } catch (error) {
    console.error("Error getting contract:", error);
    throw error;
  }
};

// Get mint price
export const getMintPrice = async (contract) => {
  try {
    const price = await contract.getMintPrice();
    return ethers.utils.formatEther(price);
  } catch (error) {
    console.error("Error getting mint price:", error);
    throw error;
  }
};

// Get current supply
export const getCurrentSupply = async (contract) => {
  try {
    const supply = await contract.getCurrentSupply();
    return supply.toString();
  } catch (error) {
    console.error("Error getting current supply:", error);
    throw error;
  }
};

// Get max supply
export const getMaxSupply = async (contract) => {
  try {
    const maxSupply = await contract.getMaxSupply();
    return maxSupply.toString();
  } catch (error) {
    console.error("Error getting max supply:", error);
    throw error;
  }
};

// Mint NFT
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

// Get NFTs owned by an address
export const getOwnedTokens = async (contract, address) => {
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

// Export everything as a default object for easier imports
export default {
  CONTRACT_ABI,
  SEPOLIA_CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  isSepoliaNetwork,
  switchToSepoliaNetwork,
  getNetworkConfig,
  getContract,
  getMintPrice,
  getCurrentSupply,
  getMaxSupply,
  mintNFT,
  getOwnedTokens
};
