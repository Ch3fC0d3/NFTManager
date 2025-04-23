# NFTMan Digital Ocean Deployment

This directory contains the files needed to deploy your NFT application to Digital Ocean.

## Deployment Instructions

1. **Update Contract Address**: Before deploying, update the contract address in `src/constants.ts` with your Sepolia contract address.

2. **Deploy to Digital Ocean**:
   - Log in to your Digital Ocean account
   - Create a new App from GitHub
   - Select your repository and the branch containing this code
   - Choose the `deploy` directory as the source directory
   - Configure build settings (Next.js should be auto-detected)
   - Deploy the application

## Local Development

To run this application locally:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Contract Information

The application is configured to connect to your NFT contract on the Sepolia testnet. Make sure your contract is properly deployed and that the address in `src/constants.ts` is correct.

## Troubleshooting

If you encounter issues with the deployment:

1. Check that your contract address is correct in `src/constants.ts`
2. Ensure your contract is properly deployed to the Sepolia testnet
3. Verify that your MetaMask wallet is connected to the Sepolia network
4. Check the browser console for any errors related to contract interactions
