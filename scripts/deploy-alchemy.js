// Deployment script using Alchemy SDK
import { Network, Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import { createRequire } from 'module';

// Setup for ES modules compatibility
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// ABI of CryptoCanvas contract
const contractABI = require('../artifacts/contracts/CryptoCanvas.sol/CryptoCanvas.json').abi;
const contractBytecode = require('../artifacts/contracts/CryptoCanvas.sol/CryptoCanvas.json').bytecode;

async function main() {
  console.log("Deploying CryptoCanvas to Sepolia...");
  
  // Setup Alchemy provider for Sepolia
  const settings = {
    apiKey: "99QNzS2y8XCVUFzePPzgl5W5mwm-FnyW", // Sepolia API key
    network: Network.ETH_SEPOLIA,
  };
  
  const alchemy = new Alchemy(settings);
  const provider = await alchemy.config.getProvider();
  
  // Setup wallet with private key from environment
  const wallet = new ethers.Wallet(
    "2d5a4ac1460b6a3e596269170c7410b2fc642fbcb3aaec2b8edfe31e37dcae33",
    provider
  );
  
  // Log wallet address for verification
  console.log(`Deploying with account: ${wallet.address}`);
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} MATIC`);
  
  console.log(`Deploying with account: ${wallet.address}`);
  
  // Create contract factory
  const factory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);
  
  // Deploy contract
  const contract = await factory.deploy(
    "CryptoCanvas", 
    "CCAN",
    ethers.utils.parseEther("0.01"), // 0.01 ETH mint price
    100 // Max supply
  );
  
  console.log(`Deployment transaction hash: ${contract.deployTransaction.hash}`);
  console.log("Waiting for deployment confirmation...");
  
  await contract.deployed();
  console.log(`CryptoCanvas deployed to: ${contract.address}`);
  
  // Get current block number
  const blockNumber = await alchemy.core.getBlockNumber();
  
  // Create deployment JSON
  const deployment = {
    contractAddress: contract.address,
    deploymentBlock: blockNumber,
    deploymentTimestamp: new Date().toISOString()
  };
  
  // Ensure the deployments directory exists
  const deploymentsDir = path.join(__dirname, "../src/deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Write deployment info to JSON file
  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia.json"),
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("Deployment information saved to src/deployments/sepolia.json");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
