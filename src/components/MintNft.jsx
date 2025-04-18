import React, { useState, useEffect } from 'react';
import { PlusCircle, Sparkles, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card, Row, Col, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';
import useWallet from '../hooks/useWallet';
import useContract from '../hooks/useContract';
import { mintNFT, getNetworkConfig } from '../utils/contract';

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

function MintNft() {
  const { isConnected, signer, address, chainId, changeNetwork } = useWallet();
  const { contract, mintPrice, currentSupply, maxSupply, refreshContractData, error: contractError } = useContract(signer, null);
  
  // Force component to check wallet status
  const [walletConnected, setWalletConnected] = useState(isConnected);
  const [networkError, setNetworkError] = useState(null);
  const [correctNetwork, setCorrectNetwork] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Helper function to switch networks
  const switchToLocalhostNetwork = async () => {
    try {
      setLoading(true);
      // This is localhost chainId
      await changeNetwork(31337);
      setNetworkError(null);
      window.location.reload();
    } catch (error) {
      setNetworkError("Failed to switch network. Please try manually.");
      console.error("Network switch error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Check if MetaMask is connected on component mount and when isConnected changes
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setWalletConnected(accounts && accounts.length > 0);
          console.log("MintNft - Wallet connected:", accounts && accounts.length > 0);
          
          // Check network
          if (accounts && accounts.length > 0) {
            const network = await window.ethereum.request({ method: 'eth_chainId' });
            console.log("Current chain ID:", network);
            // Localhost is usually 31337 (0x7a69) or 1337 (0x539)
            const isLocalhost = network === '0x7a69' || network === '0x539';
            const isGoerli = network === '0x5';
            setCorrectNetwork(isLocalhost || isGoerli);
            
            if (!isLocalhost && !isGoerli) {
              setNetworkError("Please connect to Localhost or Goerli network to use this app");
            } else {
              setNetworkError(null);
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setWalletConnected(false);
        }
      }
    };
    
    checkWalletConnection();
    
    // Also update when isConnected changes
    setWalletConnected(isConnected);
  }, [isConnected, chainId]);
  
  const [selectedNft, setSelectedNft] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [transaction, setTransaction] = useState(null);

  const handleMint = async () => {
    if (!contract || !isConnected) return;
    
    setIsMinting(true);
    
    try {
      // In a real app, you would upload metadata to IPFS
      // For demo purposes, we're using a fake IPFS URI
      const tokenURI = `ipfs://QmSampleHash${selectedNft}`;
      
      console.log('Attempting to mint NFT with URI:', tokenURI);
      console.log('Contract instance:', contract);
      
      // Call mint function with proper error handling
      const tx = await mintNFT(contract, tokenURI);
      console.log('Transaction initiated:', tx);
      
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
      } else if (error.message && error.message.includes('user rejected transaction')) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(`Failed to mint NFT: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsMinting(false);
    }
  };

  // No wallet connected
  if (!walletConnected && !isConnected) {
    return (
      <div>
        <Alert variant="warning" className="d-flex align-items-center">
          <AlertTriangle size={20} className="me-2" />
          Please connect your wallet to mint NFTs
        </Alert>
        <Button 
          variant="primary" 
          className="w-100 mt-3"
          onClick={() => {
            if (typeof window.ethereum !== 'undefined') {
              window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(accounts => {
                  console.log("Wallet connected through direct request:", accounts);
                  setWalletConnected(accounts && accounts.length > 0);
                  window.location.reload(); // Force a full refresh to update all components
                })
                .catch(err => console.error("Error connecting wallet:", err));
            }
          }}
        >
          Connect Wallet Now
        </Button>
      </div>
    );
  }
  
  // Wrong network error
  if (networkError) {
    return (
      <div>
        <Alert variant="danger" className="d-flex align-items-center">
          <AlertTriangle size={20} className="me-2" />
          {networkError}
        </Alert>
        <Button 
          variant="primary" 
          className="w-100 mt-3"
          disabled={loading}
          onClick={switchToLocalhostNetwork}
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Switching...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="me-2" />
              Switch to Localhost Network
            </>
          )}
        </Button>
      </div>
    );
  }
  
  // Contract error (likely not deployed on this network)
  if (contractError || !contract) {
    return (
      <div>
        <Alert variant="danger" className="d-flex align-items-center">
          <AlertTriangle size={20} className="me-2" />
          Contract not found on this network. Please make sure your local blockchain is running or switch to Goerli testnet.
        </Alert>
        <Button 
          variant="primary" 
          className="w-100 mt-3"
          disabled={loading}
          onClick={switchToLocalhostNetwork}
        >
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Switching...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="me-2" />
              Switch to Localhost Network
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {currentSupply !== null && maxSupply !== null && (
        <div className="mb-4 text-center">
          <h5 className="mb-2">Collection Status</h5>
          <div className="d-flex justify-content-center align-items-center gap-2">
            <Badge bg="primary" className="px-3 py-2">
              {currentSupply} / {maxSupply} Minted
            </Badge>
            {mintPrice && (
              <Badge bg="info" className="px-3 py-2">
                Price: {mintPrice} ETH
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <h5 className="mb-3">Select Artwork to Mint</h5>
      
      <Row className="g-3 mb-4">
        {SAMPLE_NFTS.map((nft, index) => (
          <Col md={4} key={index}>
            <Card 
              className={`h-100 cursor-pointer ${selectedNft === index ? 'border-primary' : 'border'}`}
              onClick={() => setSelectedNft(index)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Img 
                variant="top" 
                src={nft.image} 
                alt={nft.name}
                style={{ height: '140px', objectFit: 'cover' }}
              />
              <Card.Body className="p-3">
                <Card.Title className="h6">{nft.name}</Card.Title>
                <Card.Text className="small text-muted">
                  {nft.description.substring(0, 60)}...
                </Card.Text>
              </Card.Body>
              {selectedNft === index && (
                <div className="position-absolute top-0 end-0 p-2">
                  <Badge bg="success" className="rounded-circle p-2">
                    <Check size={16} />
                  </Badge>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      
      <div className="d-grid">
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleMint}
          disabled={isMinting || !contract}
          className="d-flex align-items-center justify-content-center gap-2"
        >
          {isMinting ? (
            <>
              <Spinner size="sm" animation="border" />
              <span>Minting...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Mint NFT</span>
            </>
          )}
        </Button>
      </div>
      
      {transaction && (
        <Alert variant="success" className="mt-4">
          <Alert.Heading className="h6">Transaction Submitted</Alert.Heading>
          <p className="mb-0 small">
            Transaction Hash: <code className="text-break">{transaction}</code>
          </p>
        </Alert>
      )}
    </div>
  );
}

export default MintNft;
