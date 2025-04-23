# NFT Manager Static Deployment

This is a simplified static version of the NFT Manager application that connects to your Sepolia contract.

## Features

- Connect to MetaMask wallet
- View your NFTs on the Sepolia network
- Mint new NFTs
- Compatible with Digital Ocean App Platform

## Deployment Instructions

This application is designed to be easily deployed to Digital Ocean App Platform:

1. Log in to your Digital Ocean account
2. Create a new App
3. Select GitHub as the source
4. Choose this repository and branch
5. Digital Ocean will automatically detect the Express.js application
6. Deploy the application

## Local Development

To run this application locally:

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open http://localhost:8080 in your browser.

## Contract Information

The application is configured to connect to your NFT contract on the Sepolia testnet at address: `0xDDD3e036664e7A06244E4892Fcefb7b9f70BfFd8`

If you need to change the contract address, update it in the `config.js` file.
