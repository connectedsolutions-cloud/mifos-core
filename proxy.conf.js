'use strict';

const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');

/*
 * API proxy configuration for Angular 19 dev server
 */

// Read .env file to get the backend URL
let backendUrl = 'http://localhost:8443';
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.startsWith('FINERACT_API_URL=')) {
      const value = line
        .split('=')[1]
        .trim()
        .replace(/^["']|["']$/g, '');
      if (value) {
        backendUrl = value;
      }
    }
  });
}

// Angular 19 - Proxy configuration (not currently supported by new dev server)
// Note: Currently using direct backend requests instead of proxy
const PROXY_CONFIG = {
  '/fineract-provider': {
    target: backendUrl,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
};

// Handle corporate proxy if needed
const proxyServer = process.env.http_proxy || process.env.HTTP_PROXY;
if (proxyServer) {
  const agent = new HttpsProxyAgent(proxyServer);
  Object.keys(PROXY_CONFIG).forEach((path) => {
    PROXY_CONFIG[path].agent = agent;
  });
}

module.exports = PROXY_CONFIG;
