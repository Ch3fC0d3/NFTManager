import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Get RPC URL from .env file
    const rpcUrl = process.env.AMOY_URL;
    
    if (!rpcUrl) {
      console.error("RPC URL not found in .env file");
      process.exit(1);
    }
    
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Wallet address to check
    const walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    
    // Get balance
    const balance = await provider.getBalance(walletAddress);
    const balanceInMatic = ethers.utils.formatEther(balance);
    
    console.log(`\nWallet ${walletAddress} has ${balanceInMatic} MATIC`);
    
    // Also check the other address
    const otherAddress = "0x73cC907F41964303eDCFF235d0D8FD2dBf5A909d";
    const otherBalance = await provider.getBalance(otherAddress);
    const otherBalanceInMatic = ethers.utils.formatEther(otherBalance);
    
    console.log(`Wallet ${otherAddress} has ${otherBalanceInMatic} MATIC`);
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

main();
