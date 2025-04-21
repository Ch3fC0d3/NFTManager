// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Custom plugin to replace dynamic imports with static data
function replaceDynamicImports() {
  const SEPOLIA_DATA = {
    contractAddress: "0xd9145CCE52D386f254917e481eB44e9943F39138",
    deploymentBlock: 4270321,
    deploymentTimestamp: "2025-04-21T13:54:00.000Z"
  };

  return {
    name: 'replace-dynamic-imports',
    transform(code, id) {
      // Replace any dynamic imports of deployment data
      if (code.includes('import(') && code.includes('deployments')) {
        console.log('Found dynamic import in:', id);
        
        // Replace dynamic import with static data
        const newCode = code.replace(
          /await\s+import\s*\(\s*`[^`]*deployments\/[^`]*`\s*\)/g,
          `Promise.resolve({ default: ${JSON.stringify(SEPOLIA_DATA)} })`
        );
        
        return {
          code: newCode,
          map: null
        };
      }
      return null;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    replaceDynamicImports() // Add our custom plugin
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure all dynamic imports are properly handled
    rollupOptions: {
      output: {
        manualChunks: {}
      }
    }
  }
});
