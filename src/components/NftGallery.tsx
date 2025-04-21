import React, { useState, useEffect } from 'react';
import { ImageIcon, Loader } from 'lucide-react';
import useWallet from '../hooks/useWallet';
import useContract from '../hooks/useContract';
import { getOwnedTokens } from '../utils/contractUtils';

interface TokenData {
  id: number;
  uri: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
    [key: string]: any;
  };
}

const NftGallery: React.FC = () => {
  const { isConnected, address, signer, provider } = useWallet();
  const { contract } = useContract(signer, provider);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            console.error(`Failed to fetch metadata for token ${token.id}:`, err);
            return token;
          }
        })
      );
      
      setTokens(tokensWithMetadata);
    } catch (err: any) {
      console.error('Failed to fetch owned tokens:', err);
      setError(err.message || 'Failed to fetch owned tokens');
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

  // Display appropriate placeholder if not connected or no tokens
  if (!isConnected) {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="text-xl font-semibold mb-2">Connect your wallet to view your NFTs</h2>
        <p className="text-gray-500">Your CryptoCanvas NFTs will appear here after connecting.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading your NFTs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading NFTs</h2>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={fetchOwnedTokens}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="text-xl font-semibold mb-2">No NFTs Found</h2>
        <p className="text-gray-500">You don't own any CryptoCanvas NFTs yet.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-8 text-center">Your CryptoCanvas Collection</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokens.map((token) => (
          <div 
            key={token.id} 
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-xl"
          >
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              {token.metadata?.image ? (
                <img 
                  src={token.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                  alt={token.metadata.name || `Token #${token.id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon size={48} className="text-gray-400" />
                  <p className="text-gray-500 mt-2">No image available</p>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {token.metadata?.name || `Token #${token.id}`}
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                  #{token.id}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {token.metadata?.description || 'No description available'}
              </p>
              
              {token.metadata?.attributes && token.metadata.attributes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Attributes:</p>
                  <div className="flex flex-wrap gap-2">
                    {token.metadata.attributes.slice(0, 3).map((attr, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                        title={`${attr.trait_type}: ${attr.value}`}
                      >
                        {attr.trait_type}: {attr.value}
                      </span>
                    ))}
                    {token.metadata.attributes.length > 3 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        +{token.metadata.attributes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NftGallery;