import { ethers } from "ethers";

async function main() {
  try {
    // Create wallet from the private key without 0x prefix
    const privateKey = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey);
    
    console.log("\nWallet Information:");
    console.log("===========================================");
    console.log(`Address: ${wallet.address}`);
    console.log("===========================================");
    console.log("\nUse this address to request test MATIC tokens from the Polygon Amoy faucet:");
    console.log("- https://amoy.polygonscan.com/faucet");
    console.log("- https://www.alchemy.com/faucets/polygon-amoy");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
