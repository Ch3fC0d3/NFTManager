const { ethers, network, run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Deploying CryptoCanvas to ${network.name}...`);

  // Get the contract factory
  const CryptoCanvas = await ethers.getContractFactory("CryptoCanvas");
  
  // Set deployment parameters
  const name = "CryptoCanvas";
  const symbol = "CCAN";
  const maxSupply = 1000;
  const mintPrice = ethers.utils.parseEther("0.05"); // 0.05 ETH
  
  // Deploy the contract
  const cryptoCanvas = await CryptoCanvas.deploy(name, symbol, maxSupply, mintPrice);
  await cryptoCanvas.deployed();
  
  console.log(`CryptoCanvas deployed to: ${cryptoCanvas.address}`);
  
  // Save deployment info to a file
  saveDeploymentInfo(network.name, {
    contractAddress: cryptoCanvas.address,
    contractName: "CryptoCanvas",
    network: network.name,
    chainId: network.config.chainId,
    deploymentTime: new Date().toISOString(),
    parameters: {
      name,
      symbol,
      maxSupply,
      mintPrice: mintPrice.toString()
    }
  });
  
  // Verify on Etherscan if not on a local network
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("Waiting for 6 confirmations before verification...");
    await cryptoCanvas.deployTransaction.wait(6);
    
    try {
      await run("verify:verify", {
        address: cryptoCanvas.address,
        constructorArguments: [name, symbol, maxSupply, mintPrice],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }
}

function saveDeploymentInfo(networkName, deploymentInfo) {
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save network-specific deployment info
  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${filePath}`);
  
  // Also save to src directory for frontend access
  const srcFilePath = path.join(__dirname, "../src/deployments", `${networkName}.json`);
  if (!fs.existsSync(path.dirname(srcFilePath))) {
    fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
  }
  fs.writeFileSync(srcFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${srcFilePath} for frontend access`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });