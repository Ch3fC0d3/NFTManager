#!/bin/bash
# Custom build script for Digital Ocean deployment

# Install dependencies (including tailwindcss since it's referenced in config)
echo "Installing dependencies..."
npm install
npm install tailwindcss@latest

# Build the project
echo "Building the project..."
npm run build

echo "Build completed successfully!"
