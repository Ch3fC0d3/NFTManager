// Global variables
let provider = null;
let signer = null;
let contract = null;
let walletAddress = null;

// DOM Elements
const networkSelect = document.getElementById('network-select');
const connectBtn = document.getElementById('connect-btn');
const mintBtn = document.getElementById('mint-btn');
const refreshBtn = document.getElementById('refresh-btn');
const walletAddressEl = document.getElementById('wallet-address');
const contractAddressEl = document.getElementById('contract-address');
const mintPriceEl = document.getElementById('mint-price');
const nftContainerEl = document.getElementById('nft-container');
const statusContainerEl = document.getElementById('status-container');
const statusMessageEl = document.getElementById('status-message');

// Initialize the application
async function init() {
  // Set contract address in the UI
  contractAddressEl.textContent = CONFIG.CONTRACT_ADDRESS;
  
  // Check if Hardhat node is running
  const isHardhatRunning = await checkHardhatNode();
  
  // Set default network based on Hardhat availability
  if (isHardhatRunning) {
    networkSelect.value = 'localhost';
    showStatus('Hardhat node detected, using localhost network', 'info');
    console.log('Hardhat node detected, using localhost network');
  } else {
    networkSelect.value = 'sepolia';
    showStatus('Hardhat node not detected, using Sepolia network', 'info');
    console.log('Hardhat node not detected, using Sepolia network');
  }
  
  // Check for MetaMask
  detectProvider();
}

// Detect Ethereum provider (MetaMask)
function detectProvider() {
  if (window.ethereum) {
    console.log('MetaMask detected immediately');
    
    // Handle account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Account changed:', accounts);
      if (accounts.length === 0) {
        resetWalletConnection('Wallet disconnected. Please reconnect.');
      } else {
        // Reconnect with the new account
        connectWallet().catch(error => {
          console.error('Error reconnecting wallet:', error);
          showStatus(`Error reconnecting wallet: ${error.message}`, 'danger');
        });
      }
    });
    
    // Handle chain/network changes
    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Network changed to chainId:', chainId);
      // Reload the page on network change
      window.location.reload();
    });
  } else {
    showStatus('MetaMask not detected. Please install MetaMask to use this application.', 'warning');
    console.log('MetaMask not detected');
  }
}

// Check if Hardhat node is running
async function checkHardhatNode() {
  try {
    const response = await fetch(CONFIG.LOCALHOST_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: []
      })
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.log('Hardhat node not detected, error details:', error);
    return false;
  }
}

// Show status message
function showStatus(msg, type = 'info') {
  statusMessageEl.textContent = msg;
  statusMessageEl.className = `status-message ${type}`;
  statusContainerEl.style.display = 'block';
}

// Hide status message
function hideStatus() {
  statusContainerEl.style.display = 'none';
}

// Switch to the selected network
async function switchNetwork(networkName) {
  if (!window.ethereum) {
    showStatus('MetaMask not detected. Please install MetaMask to switch networks.', 'warning');
    return false;
  }
  
  console.log(`Switching to network: ${networkName}`);
  
  let chainId;
  let rpcUrl;
  let network;
  
  if (networkName === 'localhost') {
    chainId = '0x7a69'; // Hardhat's default chainId (31337 in decimal)
    rpcUrl = CONFIG.LOCALHOST_RPC_URL;
    network = {
      chainId: chainId,
      chainName: 'Hardhat Local',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: [rpcUrl],
      blockExplorerUrls: []
    };
  } else if (networkName === 'sepolia') {
    chainId = '0xaa36a7'; // Sepolia's chainId (11155111 in decimal)
    rpcUrl = CONFIG.SEPOLIA_RPC_URL;
    network = {
      chainId: chainId,
      chainName: 'Sepolia Test Network',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: [rpcUrl],
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    };
  } else {
    showStatus(`Unknown network: ${networkName}`, 'danger');
    return false;
  }
  
  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }
    
    // Get current chain ID
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log(`Current chain ID: ${currentChainId}, Target chain ID: ${chainId}`);
    
    // If already on the correct network, no need to switch
    if (currentChainId === chainId) {
      console.log(`Already on network: ${network.chainName}`);
      return true;
    }
    
    // Try to switch to the network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }]
      });
      console.log(`Successfully switched to network: ${network.chainName}`);
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network]
          });
          console.log(`Successfully added and switched to network: ${network.chainName}`);
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          showStatus(`Could not add ${network.chainName} to wallet. ${addError.message}`, 'danger');
          return false;
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        console.log('User rejected network switch');
        showStatus(`Network switch to ${network.chainName} was rejected. Please try again.`, 'warning');
        return false;
      } else {
        console.error('Other network switch error:', switchError);
        showStatus(`Could not switch to ${network.chainName}: ${switchError.message}`, 'danger');
        return false;
      }
    }
  } catch (error) {
    console.error('Error switching network:', error);
    showStatus(`Error switching network: ${error.message}`, 'danger');
    return false;
  }
}

// Function to reset wallet connection state
function resetWalletConnection(message = 'Wallet disconnected. Please reconnect.') {
  // Reset UI elements - safely check if elements exist first
  const safeSetText = (id, text) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  };
  
  const safeSetProperty = (id, property, value) => {
    const element = document.getElementById(id);
    if (element) element[property] = value;
  };
  
  safeSetText('wallet-address', 'Not connected');
  safeSetText('contract-address', CONFIG.CONTRACT_ADDRESS);
  safeSetText('mint-price', 'Unknown');
  safeSetText('connect-btn', 'Connect Wallet');
  safeSetProperty('mint-btn', 'disabled', true);
  
  const nftContainer = document.getElementById('nft-container');
  if (nftContainer) nftContainer.innerHTML = '';
  
  // Reset global variables
  provider = null;
  signer = null;
  contract = null;
  walletAddress = null;
  
  // Show status message
  showStatus(message, 'info');
  
  console.log('Wallet connection reset');
}

// Handle network selection change
networkSelect.onchange = function() {
  // Reset wallet connection when network changes
  resetWalletConnection('Network changed. Please reconnect your wallet.');
  
  // Update UI based on selected network
  const selectedNetwork = this.value;
  console.log(`Network changed to: ${selectedNetwork}`);
  
  // If Hardhat is selected, check if it's running
  if (selectedNetwork === 'localhost') {
    checkHardhatNode().then(isRunning => {
      if (!isRunning) {
        showStatus('Warning: Hardhat node does not appear to be running. You may want to switch to Sepolia.', 'warning');
      }
    });
  }
};

// Connect wallet function
async function connectWallet() {
  try {
    console.log('Attempting to connect wallet...');
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
      showStatus('MetaMask not detected. Please install MetaMask to connect your wallet.', 'warning');
      return;
    }
    
    // Switch to the selected network
    const networkName = networkSelect.value;
    const networkSwitched = await switchNetwork(networkName);
    if (!networkSwitched) {
      return;
    }
    
    // Request account access
    console.log('Requesting accounts...');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Accounts requested successfully');
    
    if (accounts.length === 0) {
      showStatus('No accounts found. Please unlock your MetaMask.', 'warning');
      return;
    }
    
    // Setup provider and signer
    console.log('Setting up provider and signer...');
    
    if (networkName === 'localhost') {
      // For localhost, use JsonRpcProvider
      console.log('Using JsonRpcProvider for localhost');
      provider = new ethers.providers.JsonRpcProvider(CONFIG.LOCALHOST_RPC_URL);
    } else {
      // For remote networks like Sepolia, use Web3Provider with MetaMask
      console.log('Using BrowserProvider for remote network');
      provider = new ethers.providers.Web3Provider(window.ethereum);
    }
    
    signer = provider.getSigner();
    console.log('Signer obtained successfully');
    
    // Create contract instance
    walletAddress = accounts[0];
    console.log('Connected wallet address:', walletAddress);
    console.log('Creating contract instance with address:', CONFIG.CONTRACT_ADDRESS);
    contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, signer);
    console.log('Contract instance created successfully');
    
    // Check if connected wallet is the contract owner
    try {
      const contractOwner = await contract.owner();
      console.log('Contract owner:', contractOwner);
      console.log('Connected wallet:', walletAddress);
      
      // Update UI based on ownership
      if (contractOwner.toLowerCase() === walletAddress.toLowerCase()) {
        showStatus('Connected as contract owner', 'success');
      }
    } catch (error) {
      console.error('Error checking owner:', error);
    }
    
    // Fetch mint price
    try {
      console.log('Fetching mint price...');
      const mintPrice = await contract.getMintPrice();
      const mintPriceEth = ethers.utils.formatEther(mintPrice);
      mintPriceEl.textContent = mintPriceEth;
      console.log('Mint price:', mintPriceEth, 'ETH');
    } catch (error) {
      console.error('Error fetching mint price:', error);
      mintPriceEl.textContent = 'Error';
    }
    
    // Update UI
    walletAddressEl.textContent = walletAddress;
    connectBtn.textContent = 'Wallet Connected';
    mintBtn.disabled = false;
    
    // Show success message
    showStatus('Wallet connected successfully', 'success');
    
    // Refresh NFTs
    refreshNFTs();
    
  } catch (error) {
    console.error('Error connecting wallet:', error);
    showStatus(`Error connecting wallet: ${error.message}`, 'danger');
  }
}

// Mint NFT function
async function mintNFT() {
  try {
    if (!contract || !signer) {
      showStatus('Please connect your wallet first', 'warning');
      return;
    }
    
    showStatus('Minting NFT...', 'info');
    
    // Get mint price
    const mintPrice = await contract.getMintPrice();
    console.log('Mint price:', ethers.utils.formatEther(mintPrice), 'ETH');
    
    // Send transaction to mint NFT
    const tx = await contract.mint(walletAddress, { value: mintPrice });
    console.log('Transaction sent:', tx.hash);
    
    showStatus('Transaction submitted. Waiting for confirmation...', 'info');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    // Find the token ID from the event logs
    let tokenId = null;
    for (const event of receipt.events) {
      if (event.event === 'Transfer') {
        tokenId = event.args.tokenId.toString();
        break;
      }
    }
    
    if (tokenId) {
      showStatus(`NFT minted successfully! Token ID: ${tokenId}`, 'success');
    } else {
      showStatus('NFT minted successfully!', 'success');
    }
    
    // Refresh NFTs
    refreshNFTs();
    
  } catch (error) {
    console.error('Error minting NFT:', error);
    showStatus(`Error minting NFT: ${error.message}`, 'danger');
  }
}

// Refresh NFTs function
async function refreshNFTs() {
  try {
    if (!contract || !walletAddress) {
      console.log('Wallet not connected');
      return;
    }
    
    console.log('Connected wallet address:', walletAddress);
    console.log('Contract address:', CONFIG.CONTRACT_ADDRESS);
    
    // Clear NFT container
    nftContainerEl.innerHTML = '';
    
    // Get balance of NFTs
    console.log('Calling balanceOf for address:', walletAddress);
    const balance = await contract.balanceOf(walletAddress);
    console.log('NFT balance:', balance.toString());
    
    if (balance.toNumber() === 0) {
      nftContainerEl.innerHTML = '<p>You don\'t own any NFTs yet.</p>';
      return;
    }
    
    // For each NFT, get the token ID and metadata
    for (let i = 0; i < balance.toNumber(); i++) {
      try {
        // Get token ID at index i
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
        console.log('Token ID:', tokenId.toString());
        
        // Get token URI
        const tokenURI = await contract.tokenURI(tokenId);
        console.log('Token URI:', tokenURI);
        
        // Create NFT card
        const nftCard = document.createElement('div');
        nftCard.className = 'nft-card';
        
        // Try to fetch metadata if tokenURI is a valid URL
        let metadata = null;
        try {
          if (tokenURI.startsWith('http')) {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          }
        } catch (metadataError) {
          console.error('Error fetching metadata:', metadataError);
        }
        
        // Create NFT card content
        let imageUrl = 'https://via.placeholder.com/150?text=NFT';
        let name = `NFT #${tokenId}`;
        
        if (metadata) {
          if (metadata.image) {
            imageUrl = metadata.image;
            // If IPFS URL, convert to HTTP gateway
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
          }
          
          if (metadata.name) {
            name = metadata.name;
          }
        }
        
        nftCard.innerHTML = `
          <img src="${imageUrl}" alt="${name}" class="nft-image">
          <h5>${name}</h5>
          <p>Token ID: ${tokenId}</p>
          <button class="btn btn-sm btn-outline-primary view-details-btn" data-token-id="${tokenId}">View Details</button>
        `;
        
        nftContainerEl.appendChild(nftCard);
      } catch (error) {
        console.error('Error processing NFT:', error);
      }
    }
    
  } catch (error) {
    console.error('Error calling balanceOf:', error);
    nftContainerEl.innerHTML = '<p>Error loading NFTs. Please try again.</p>';
  }
}

// Event listeners
connectBtn.onclick = async () => {
  console.log('Connect button clicked');
  await connectWallet();
};

mintBtn.onclick = async () => {
  console.log('Mint button clicked');
  await mintNFT();
};

refreshBtn.onclick = async () => {
  console.log('Refresh button clicked');
  await refreshNFTs();
};

// Handle View Details button clicks
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('view-details-btn')) {
    const tokenId = event.target.getAttribute('data-token-id');
    console.log('View details clicked for token ID:', tokenId);
    
    // Get token details
    if (contract) {
      contract.tokenURI(tokenId).then(uri => {
        console.log('Token URI:', uri);
        showStatus(`Token URI: ${uri}`, 'info');
      }).catch(error => {
        console.error('Error getting token URI:', error);
        showStatus(`Error getting token details: ${error.message}`, 'danger');
      });
    }
  }
});

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', init);
