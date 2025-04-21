import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Get RPC URL from .env file
    const rpcUrl = process.env.AMOY_URL;
    const addressToCheck = "0x73cC907F41964303eDCFF235d0D8FD2dBf5A909d";

    if (!rpcUrl) {
      console.error("RPC URL not found in .env file");
      process.exit(1);
    }

    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Get network information
    const network = await provider.getNetwork();
    
    // Get balance
    const balance = await provider.getBalance(addressToCheck);
    const balanceInMatic = ethers.utils.formatEther(balance);
    
    console.log("\nWallet Information:");
    console.log("===========================================");
    console.log(`Address: ${addressToCheck}`);
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Balance: ${balanceInMatic} MATIC`);
    console.log("===========================================");
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

main();
