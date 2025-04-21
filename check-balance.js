import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Get private key and RPC URL from .env file
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.AMOY_URL;

    if (!privateKey || !rpcUrl) {
      console.error("Private key or RPC URL not found in .env file");
      process.exit(1);
    }

    // Create provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Get network information
    const network = await provider.getNetwork();
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInMatic = ethers.utils.formatEther(balance);
    
    console.log("\nWallet Information:");
    console.log("===========================================");
    console.log(`Address: ${wallet.address}`);
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Balance: ${balanceInMatic} MATIC`);
    console.log("===========================================");
    
    if (balance.eq(0)) {
      console.log("\nYour wallet has 0 MATIC. Please get test tokens from the Polygon Amoy faucet:");
      console.log("- https://amoy.polygonscan.com/faucet");
      console.log("- https://www.alchemy.com/faucets/polygon-amoy");
    } else {
      console.log("\nYou have MATIC tokens in your wallet. You should be able to deploy your contract.");
    }
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

main();
