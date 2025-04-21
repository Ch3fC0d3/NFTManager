import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert, Card, Spinner, Badge } from 'react-bootstrap';
import { Toaster, toast } from 'react-hot-toast';
import { ethers } from 'ethers';

// Hardcoded Sepolia contract data
const SEPOLIA_CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

// Simplified ABI with just the functions we need
const CONTRACT_ABI = [
  // Read functions
  "function getMintPrice() view returns (uint256)",
  "function getCurrentSupply() view returns (uint256)",
  "function getMaxSupply() view returns (uint256)",
  // Write functions
  "function publicMint(string memory tokenURI) payable",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Sample NFT metadata options
const SAMPLE_NFTS = [
  {
    name: "Abstract Waves",
    description: "A beautiful abstract digital painting with flowing waves in blue and purple.",
    image: "https://images.pexels.com/photos/3109807/pexels-photo-3109807.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    name: "Geometric Bloom",
    description: "Geometric patterns forming a blooming flower design.",
    image: "https://images.pexels.com/photos/2693212/pexels-photo-2693212.png?auto=compress&cs=tinysrgb&w=600"
  },
  {
    name: "Cyberpunk City",
    description: "A futuristic cityscape with neon lights and cyberpunk aesthetics.",
    image: "https://images.pexels.com/photos/1629236/pexels-photo-1629236.jpeg?auto=compress&cs=tinysrgb&w=600"
  }
];

function HomeNew() {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mintPrice, setMintPrice] = useState('0');
  const [currentSupply, setCurrentSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  const [selectedNft, setSelectedNft] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [transaction, setTransaction] = useState(null);

  // Initialize wallet and contract
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            console.log("Found existing connection:", accounts);
            await connectWallet(false); // Connect without prompting
          }

          // Setup event listeners
          window.ethereum.on('accountsChanged', (accounts) => {
            const isSepolia = chainId === SEPOLIA_CHAIN_ID;
            if (isSepolia) {
              setCorrectNetwork(true);
              setNetworkError(null);
            } else {
              setCorrectNetwork(false);
              setNetworkError("Please connect to Sepolia network to use this app");
            }
          });

          window.ethereum.on('chainChanged', () => {
            window.location.reload(); // Reload on chain change
          });
        } catch (error) {
          console.error("Initialization error:", error);
        }
      }
    };

    init();
    return () => {
      // Cleanup listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Connect wallet function
  const connectWallet = async (prompt = true) => {
    if (typeof window.ethereum === 'undefined') {
      toast.error("MetaMask not installed! Please install MetaMask to use this app.");
      return;
    }

    try {
      setLoading(true);
      
      // Request accounts
      const method = prompt ? 'eth_requestAccounts' : 'eth_accounts';
      const accounts = await window.ethereum.request({ method });
      
      if (accounts.length === 0) {
        if (prompt) toast.error("No accounts found or user rejected request");
        return;
      }

      // Get network info
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(chainIdHex, 16);
      setChainId(chainIdNum);

      // Create provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethersSigner = ethersProvider.getSigner();
      
      // Update state
      setIsConnected(true);
      setAddress(accounts[0]);
      setProvider(ethersProvider);
      setSigner(ethersSigner);

      // Check if on Sepolia
      if (chainIdHex !== SEPOLIA_CHAIN_ID_HEX) {
        setNetworkError("Please switch to Sepolia network to use this application");
      } else {
        setNetworkError(null);
        setCorrectNetwork(true);
        // Initialize contract
        initializeContract(ethersSigner);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    
    try {
      setLoading(true);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
      });
      
      // Wait a moment for the network to update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // If the network is not added, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
        } catch (addError) {
          console.error("Error adding Sepolia network:", addError);
          toast.error("Failed to add Sepolia network");
        }
      } else {
        console.error("Error switching to Sepolia:", error);
        toast.error("Failed to switch network");
      }
      setLoading(false);
    }
  };

  // Initialize contract
  const initializeContract = async (signerOrProvider) => {
    try {
      // Create contract instance
      const contractInstance = new ethers.Contract(
        SEPOLIA_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signerOrProvider
      );
      setContract(contractInstance);

      // Get contract data
      await refreshContractData(contractInstance);
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      toast.error("Failed to initialize contract");
    }
  };

  // Refresh contract data
  const refreshContractData = async (contractInstance) => {
    try {
      const contract = contractInstance || (signer ? new ethers.Contract(SEPOLIA_CONTRACT_ADDRESS, CONTRACT_ABI, signer) : null);
      if (!contract) return;

      // Get mint price
      const price = await contract.getMintPrice();
      setMintPrice(ethers.utils.formatEther(price));

      // Get current supply
      const supply = await contract.getCurrentSupply();
      setCurrentSupply(supply.toString());

      // Get max supply
      const max = await contract.getMaxSupply();
      setMaxSupply(max.toString());
    } catch (error) {
      console.error("Failed to refresh contract data:", error);
    }
  };

  // Mint NFT function
  const handleMint = async () => {
    if (!signer || !contract || !isConnected || !correctNetwork) return;
    
    setIsMinting(true);
    
    try {
      // Get the selected NFT metadata
      const selectedMetadata = SAMPLE_NFTS[selectedNft];
      console.log('Attempting to mint NFT with metadata:', selectedMetadata);
      
      // Get mint price
      const mintPriceWei = await contract.getMintPrice();
      console.log('Mint price:', ethers.utils.formatEther(mintPriceWei), 'ETH');
      
      // Mint NFT with value equal to mint price
      const tx = await contract.publicMint(JSON.stringify(selectedMetadata), { 
        value: mintPriceWei,
        gasLimit: 500000 // Explicit gas limit to avoid estimation issues
      });
      
      console.log('Mint transaction sent:', tx.hash);
      setTransaction(tx.hash);
      
      // Show toast notification
      toast.loading("Minting your NFT...", { id: tx.hash });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      // Update toast notification
      toast.success("NFT minted successfully!", { id: tx.hash });
      
      // Refresh contract data
      refreshContractData();
    } catch (error) {
      console.error("Mint error:", error);
      
      // Provide more specific error messages based on common issues
      if (error.code === 'ACTION_REJECTED') {
        toast.error("Transaction rejected by user");
      } else if (error.message && error.message.includes('insufficient funds')) {
        toast.error("Insufficient funds to complete transaction");
      } else if (error.message && error.message.includes('user rejected')) {
        toast.error("Transaction rejected by user");
      } else if (error.message && error.message.includes('chain ID')) {
        toast.error("Please switch to Sepolia network");
        setNetworkError("This application requires the Sepolia network (Chain ID: 11155111)");
      } else {
        toast.error(`Failed to mint NFT: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Container className="py-5">
      <Toaster position="top-center" />
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 mb-4">NFT Manager <Badge bg="info">Sepolia Network</Badge></h1>
          <p className="lead">
            Welcome to the NFT Manager! This application allows you to mint and manage your NFTs on the Sepolia testnet.
          </p>
        </Col>
      </Row>
      
      {/* Network Error Alert */}
      {networkError && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex align-items-center">
              <div className="me-3">⚠️</div>
              <div>
                <strong>{networkError}</strong>
                <div className="mt-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    disabled={loading}
                    onClick={switchToSepolia}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Switching...
                      </>
                    ) : (
                      "Switch to Sepolia Network"
                    )}
                  </Button>
                </div>
              </div>
            </Alert>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        {/* Wallet Connect Section */}
        <Col md={6} className="mb-4 mb-md-0">
          <Card>
            <Card.Header as="h2">Wallet Connection</Card.Header>
            <Card.Body>
              {!isConnected ? (
                <div className="text-center">
                  <p>Connect your wallet to mint NFTs</p>
                  <Button 
                    variant="primary" 
                    onClick={() => connectWallet(true)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Wallet"
                    )}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success rounded-circle me-2" style={{ width: '10px', height: '10px' }}></div>
                    <span><strong>Connected</strong></span>
                  </div>
                  <p className="mb-1"><strong>Address:</strong></p>
                  <p className="text-break mb-3">{address}</p>
                  <p className="mb-1"><strong>Network:</strong></p>
                  <p>{chainId === SEPOLIA_CHAIN_ID ? "Sepolia Test Network" : `Chain ID: ${chainId}`}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Mint NFT Section */}
        <Col md={6}>
          <Card>
            <Card.Header as="h2">Mint NFT</Card.Header>
            <Card.Body>
              {!isConnected ? (
                <Alert variant="warning">Please connect your wallet to mint NFTs</Alert>
              ) : networkError ? (
                <Alert variant="warning">Please switch to Sepolia network to mint NFTs</Alert>
              ) : (
                <div>
                  <div className="mb-3">
                    <p><strong>Contract Info:</strong></p>
                    <p className="mb-1">Mint Price: {mintPrice} ETH</p>
                    <p className="mb-1">Current Supply: {currentSupply} / {maxSupply}</p>
                  </div>
                  
                  <div className="mb-3">
                    <p><strong>Select NFT Design:</strong></p>
                    <Row>
                      {SAMPLE_NFTS.map((nft, index) => (
                        <Col key={index} xs={12} md={4} className="mb-3">
                          <Card 
                            onClick={() => setSelectedNft(index)}
                            className={`h-100 ${selectedNft === index ? 'border-primary' : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <Card.Img variant="top" src={nft.image} style={{ height: '100px', objectFit: 'cover' }} />
                            <Card.Body className="p-2">
                              <Card.Title className="fs-6">{nft.name}</Card.Title>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                  
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={handleMint}
                    disabled={isMinting}
                  >
                    {isMinting ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Minting...
                      </>
                    ) : (
                      "Mint NFT"
                    )}
                  </Button>
                </div>
              )}
              
              {transaction && (
                <Alert variant="success" className="mt-3">
                  <p className="mb-1"><strong>NFT Minted Successfully!</strong></p>
                  <p className="mb-0 small">
                    Transaction Hash: <code className="text-break">{transaction}</code>
                  </p>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default HomeNew;
