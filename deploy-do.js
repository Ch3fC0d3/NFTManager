// Digital Ocean Deployment Helper
// This script modifies the project for successful Digital Ocean deployment

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix postcss.config.js
console.log('Fixing PostCSS configuration...');
const postcssConfig = `export default {
  plugins: {
    autoprefixer: {}
  }
};`;
fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), postcssConfig);

// Install tailwindcss temporarily for the build
console.log('Installing tailwindcss for build compatibility...');
execSync('npm install tailwindcss@latest --no-save', { stdio: 'inherit' });

// Run the build
console.log('Building the application...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Deployment preparation completed successfully!');
