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
    
    // Source wallet (the one with 0.1 MATIC)
    // Replace this with the actual private key of the source wallet
    const sourcePrivateKey = "YOUR_SOURCE_WALLET_PRIVATE_KEY"; // Replace this!
    const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
    
    // Destination wallet (the one we want to fund)
    const destinationAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    
    // Check source wallet balance
    const sourceBalance = await provider.getBalance(sourceWallet.address);
    const sourceBalanceInMatic = ethers.utils.formatEther(sourceBalance);
    
    console.log(`Source wallet (${sourceWallet.address}) balance: ${sourceBalanceInMatic} MATIC`);
    
    if (sourceBalance.eq(0)) {
      console.error("Source wallet has no MATIC to transfer");
      process.exit(1);
    }
    
    // Calculate amount to transfer (leave some for gas)
    const gasPrice = await provider.getGasPrice();
    const gasLimit = 21000; // Standard gas limit for a simple transfer
    const gasCost = gasPrice.mul(gasLimit);
    
    // Transfer all but the gas cost
    const amountToTransfer = sourceBalance.sub(gasCost);
    
    if (amountToTransfer.lte(0)) {
      console.error("Not enough MATIC to cover gas costs");
      process.exit(1);
    }
    
    console.log(`Transferring ${ethers.utils.formatEther(amountToTransfer)} MATIC to ${destinationAddress}`);
    
    // Create and send the transaction
    const tx = await sourceWallet.sendTransaction({
      to: destinationAddress,
      value: amountToTransfer,
      gasLimit: gasLimit,
      gasPrice: gasPrice
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Successfully transferred ${ethers.utils.formatEther(amountToTransfer)} MATIC to ${destinationAddress}`);
    
    // Check new balances
    const newSourceBalance = await provider.getBalance(sourceWallet.address);
    const newDestBalance = await provider.getBalance(destinationAddress);
    
    console.log(`\nNew balances:`);
    console.log(`Source wallet (${sourceWallet.address}): ${ethers.utils.formatEther(newSourceBalance)} MATIC`);
    console.log(`Destination wallet (${destinationAddress}): ${ethers.utils.formatEther(newDestBalance)} MATIC`);
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
}

main();
