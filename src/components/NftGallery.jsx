import React, { useState, useEffect } from 'react';
import { ImageIcon, Loader } from 'lucide-react';
import { Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import useWallet from '../hooks/useWallet.js';
import useContract from '../hooks/useContract.js';
import { getOwnedTokens } from '../utils/sepoliaContract.js';

function NftGallery() {
  const { isConnected, address, signer, provider } = useWallet();
  const { contract } = useContract(signer, provider);
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOwnedTokens = async () => {
    if (!contract || !address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ownedTokens = await getOwnedTokens(contract, address);
      
      // Fetch and parse metadata for each token
      const tokensWithMetadata = await Promise.all(
        ownedTokens.map(async (token) => {
          try {
            // Handle IPFS URIs
            let uri = token.uri;
            if (uri.startsWith('ipfs://')) {
              uri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            const response = await fetch(uri);
            const metadata = await response.json();
            
            return {
              ...token,
              metadata
            };
          } catch (err) {
            console.error(`Error fetching metadata for token ${token.id}:`, err);
            return {
              ...token,
              metadata: {
                name: `Token #${token.id}`,
                description: 'Metadata could not be loaded',
                image: null
              }
            };
          }
        })
      );
      
      setTokens(tokensWithMetadata);
    } catch (err) {
      console.error('Error fetching owned tokens:', err);
      setError('Failed to load your NFTs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && contract && address) {
      fetchOwnedTokens();
    } else {
      setTokens([]);
    }
  }, [isConnected, contract, address]);

  if (!isConnected) {
    return (
      <Alert variant="warning" className="d-flex align-items-center">
        <p className="mb-0">Connect your wallet to view your NFT collection.</p>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="text-muted">Loading your NFT collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <p className="mb-0">{error}</p>
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="mt-2"
          onClick={fetchOwnedTokens}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-5 border rounded bg-light">
        <ImageIcon size={48} className="text-muted mb-3" />
        <h4>No NFTs Found</h4>
        <p className="text-muted">
          You don't own any CryptoCanvas NFTs yet. Mint your first NFT to get started!
        </p>
        <Button 
          variant="primary" 
          href="/#mint"
        >
          Mint Your First NFT
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Your Collection ({tokens.length})</h4>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={fetchOwnedTokens}
        >
          Refresh
        </Button>
      </div>
      
      <Row className="g-4">
        {tokens.map((token) => (
          <Col md={4} lg={3} key={token.id}>
            <Card className="h-100 shadow-sm">
              {token.metadata?.image ? (
                <Card.Img 
                  variant="top" 
                  src={token.metadata.image} 
                  alt={token.metadata.name || `Token #${token.id}`}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              ) : (
                <div className="bg-light d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                  <ImageIcon size={48} className="text-muted" />
                </div>
              )}
              
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="h5 mb-0">
                    {token.metadata?.name || `Token #${token.id}`}
                  </Card.Title>
                  <Badge bg="primary">#{token.id}</Badge>
                </div>
                
                <Card.Text className="text-muted small">
                  {token.metadata?.description?.substring(0, 100)}
                  {token.metadata?.description?.length > 100 ? '...' : ''}
                </Card.Text>
                
                {token.metadata?.attributes && token.metadata.attributes.length > 0 && (
                  <div className="mt-3">
                    <h6 className="small fw-bold">Attributes</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {token.metadata.attributes.map((attr, index) => (
                        <Badge 
                          bg="light" 
                          text="dark" 
                          className="border" 
                          key={index}
                        >
                          {attr.trait_type}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
              
              <Card.Footer className="bg-white border-top">
                <a 
                  href={`https://opensea.io/assets/ethereum/${contract?.address}/${token.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-secondary w-100"
                >
                  View on OpenSea
                </a>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default NftGallery;
