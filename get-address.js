import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get private key from .env file
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  console.error("Private key not found in .env file");
  process.exit(1);
}

// Create a wallet instance
const wallet = new ethers.Wallet(privateKey);

// Display the wallet address
console.log("\nWallet Address derived from your private key:");
console.log("===========================================");
console.log(wallet.address);
console.log("===========================================");
console.log("\nUse this address to request test MATIC tokens from the Polygon Amoy faucet.");
