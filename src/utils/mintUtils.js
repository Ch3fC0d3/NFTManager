// Utility functions for minting NFTs
import { ethers } from "ethers";
import { getContract } from "./contractData";

/**
 * Mint a new NFT with the given metadata
 * @param {Object} signer - Ethers.js signer object
 * @param {Object} metadata - NFT metadata (name, description, image)
 * @returns {Promise<Object>} Transaction receipt
 */
export const mintNFT = async (signer, metadata) => {
  try {
    if (!signer) {
      throw new Error("No signer provided. Please connect your wallet.");
    }

    // Get contract with signer
    const contract = await getContract(signer);
    
    // Get mint price
    const mintPriceWei = await contract.getMintPrice();
    console.log(`Mint price: ${ethers.utils.formatEther(mintPriceWei)} ETH`);
    
    // Create simplified metadata URI (in production, you'd store this on IPFS)
    const metadataURI = JSON.stringify(metadata);
    
    // Mint NFT with value equal to mint price
    const tx = await contract.publicMint(metadataURI, { 
      value: mintPriceWei,
      gasLimit: 500000 // Explicit gas limit to avoid estimation issues
    });
    
    console.log("Minting transaction submitted:", tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Minting complete:", receipt);
    
    // Find the Transfer event to get the token ID
    const transferEvent = receipt.events.find(event => event.event === "Transfer");
    const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : null;
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      tokenId
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
};

/**
 * Get all NFTs owned by the current user
 * @param {Object} provider - Ethers.js provider
 * @param {string} address - User's wallet address
 * @returns {Promise<Array>} Array of NFT objects
 */
export const getUserNFTs = async (provider, address) => {
  try {
    if (!provider || !address) {
      throw new Error("Provider and address are required");
    }
    
    // Get contract
    const contract = await getContract(provider);
    
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
    console.error("Error getting user NFTs:", error);
    throw error;
  }
};
