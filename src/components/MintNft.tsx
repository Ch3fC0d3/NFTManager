import React, { useState } from 'react';
import { PlusCircle, Sparkles, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import useWallet from '../hooks/useWallet';
import useContract from '../hooks/useContract';
import { mintNFT } from '../utils/sepoliaContract';

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

const MintNft: React.FC = () => {
  const { isConnected, signer } = useWallet();
  const { contract, mintPrice, currentSupply, maxSupply, refreshContractData } = useContract(signer, null);
  
  const [selectedNft, setSelectedNft] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [transaction, setTransaction] = useState<string | null>(null);

  const handleMint = async () => {
    if (!contract || !isConnected) return;
    
    setIsMinting(true);
    
    try {
      // In a real app, you would upload metadata to IPFS
      // For demo purposes, we're using a fake IPFS URI
      const tokenURI = `ipfs://QmSampleHash${selectedNft}`;
      
      // Call mint function
      const tx = await mintNFT(contract, tokenURI);
      setTransaction(tx.hash);
      
      // Show toast notification
      toast.loading("Minting your NFT...", { id: tx.hash });
      
      // Wait for transaction to complete
      await tx.wait();
      
      // Success notification
      toast.success("NFT successfully minted!", { id: tx.hash });
      
      // Refresh contract data
      await refreshContractData();
    } catch (err: any) {
      console.error("Failed to mint NFT:", err);
      toast.error(err.message || "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-2xl text-center">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet to mint</h2>
        <p className="text-gray-600 mb-4">You need to connect your wallet before you can mint NFTs from the collection.</p>
      </div>
    );
  }

  const soldOut = currentSupply >= maxSupply;

  return (
    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">Mint a CryptoCanvas NFT</h2>
        <p className="text-gray-600 mt-2">
          {soldOut 
            ? "Collection is sold out!" 
            : `${currentSupply} of ${maxSupply} minted • Price: ${mintPrice} ETH`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {SAMPLE_NFTS.map((nft, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all ${
              selectedNft === index ? 'ring-4 ring-indigo-500 scale-105' : 'hover:scale-105'
            }`}
            onClick={() => setSelectedNft(index)}
          >
            <div className="h-48 overflow-hidden">
              <img 
                src={nft.image} 
                alt={nft.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{nft.name}</h3>
                {selectedNft === index && (
                  <Check className="text-indigo-500" size={18} />
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{nft.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleMint}
          disabled={isMinting || soldOut}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all ${
            soldOut 
              ? 'bg-gray-400 cursor-not-allowed' 
              : isMinting 
                ? 'bg-indigo-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
          }`}
        >
          {isMinting ? (
            <>
              <Sparkles className="animate-pulse" size={20} />
              <span>Minting...</span>
            </>
          ) : soldOut ? (
            <>
              <AlertTriangle size={20} />
              <span>Sold Out</span>
            </>
          ) : (
            <>
              <PlusCircle size={20} />
              <span>Mint NFT ({mintPrice} ETH)</span>
            </>
          )}
        </button>
      </div>

      {transaction && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Transaction: <a 
              href={`https://etherscan.io/tx/${transaction}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              View on Etherscan
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default MintNft;