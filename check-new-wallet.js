import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Create wallet from the private key without 0x prefix
    const privateKey = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey);
    
    // Get RPC URL from .env file
    const rpcUrl = process.env.AMOY_URL;

    if (!rpcUrl) {
      console.error("RPC URL not found in .env file");
      process.exit(1);
    }

    // Create provider and connect wallet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const connectedWallet = wallet.connect(provider);
    
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
    } else if (balance.lt(ethers.utils.parseEther("0.1"))) {
      console.log("\nYour wallet has some MATIC, but it might not be enough for contract deployment.");
      console.log("Consider getting more test tokens from the faucet.");
    } else {
      console.log("\nYou have sufficient MATIC tokens in your wallet for basic transactions.");
    }
    
    // Also check the original address you provided
    const otherAddress = "0x73cC907F41964303eDCFF235d0D8FD2dBf5A909d";
    const otherBalance = await provider.getBalance(otherAddress);
    const otherBalanceInMatic = ethers.utils.formatEther(otherBalance);
    
    console.log("\nOther Wallet Information:");
    console.log("===========================================");
    console.log(`Address: ${otherAddress}`);
    console.log(`Balance: ${otherBalanceInMatic} MATIC`);
    console.log("===========================================");
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

main();
