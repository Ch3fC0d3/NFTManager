// Enhanced Express server for serving the static build with network guidance
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Set cache-busting headers for all responses to prevent stale content issues
app.use((req, res, next) => {
  // Set headers to prevent caching at all levels (browser, CDN, proxies)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Serve static files from the dist directory with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    // Set correct content type for JavaScript files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
    // Set correct content type for JSON files
    else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    }
  }
}));

// Special handling for deployment JSON files to ensure they're properly served
app.get('/src/deployments/:file', (req, res) => {
  const filePath = path.join(__dirname, 'src', 'deployments', req.params.file);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.sendFile(filePath);
  } else {
    // If file doesn't exist, send a default response
    const defaultResponse = {
      "contractAddress": "0xd9145CCE52D386f254917e481eB44e9943F39138",
      "deploymentBlock": 4573221,
      "deploymentTimestamp": "2025-04-18T16:42:00.000Z"
    };
    res.json(defaultResponse);
  }
});

// For any request that doesn't match a static file, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something broke on the server! Please try again.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Application available at http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});
