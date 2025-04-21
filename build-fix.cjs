// build-fix.cjs - A script to fix dynamic imports in the build process
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Hardcoded Sepolia contract data
const SEPOLIA_DATA = {
  contractAddress: "0xd9145CCE52D386f254917e481eB44e9943F39138",
  deploymentBlock: 4270321,
  deploymentTimestamp: "2025-04-21T13:54:00.000Z"
};

console.log('Starting build fix process...');

// Create a fake deployments directory with sepolia.json to prevent dynamic import errors
const deploymentsDir = path.join(__dirname, 'src', 'deployments');
if (!fs.existsSync(deploymentsDir)) {
  fs.mkdirSync(deploymentsDir, { recursive: true });
  console.log('Created deployments directory');
}

// Write the hardcoded Sepolia data to sepolia.json
fs.writeFileSync(
  path.join(deploymentsDir, 'sepolia.json'),
  JSON.stringify(SEPOLIA_DATA, null, 2)
);
console.log('Created sepolia.json with hardcoded data');

// Find all JS/TS files in the src directory
const sourceFiles = glob.sync('src/**/*.{js,jsx,ts,tsx}', { cwd: __dirname });
console.log(`Found ${sourceFiles.length} source files to process`);

// Process each file to replace dynamic imports
let modifiedCount = 0;
sourceFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if the file contains dynamic imports related to deployments
  if (content.includes('import(') && content.includes('deployments')) {
    console.log(`Processing file: ${filePath}`);
    
    // Replace dynamic imports with static data
    const newContent = content.replace(
      /await\s+import\s*\(\s*`[^`]*deployments\/[^`]*`\s*\)/g,
      `Promise.resolve({ default: ${JSON.stringify(SEPOLIA_DATA)} })`
    );
    
    // Replace any other dynamic imports with static references
    const finalContent = newContent.replace(
      /import\s*\(\s*`[^`]*deployments\/[^`]*`\s*\)/g,
      `Promise.resolve({ default: ${JSON.stringify(SEPOLIA_DATA)} })`
    );
    
    if (content !== finalContent) {
      fs.writeFileSync(fullPath, finalContent, 'utf8');
      modifiedCount++;
      console.log(`Modified file: ${filePath}`);
    }
  }
});

console.log(`Modified ${modifiedCount} files to fix dynamic imports`);
console.log('Build fix process completed successfully');
