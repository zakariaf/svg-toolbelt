#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Serve from project root, default to demo/index.html
  const projectRoot = path.dirname(__dirname);
  let filePath;

  if (req.url === '/') {
    filePath = path.join(__dirname, 'index.html');
  } else if (req.url.startsWith('/demo/')) {
    filePath = path.join(projectRoot, req.url);
  } else {
    filePath = path.join(projectRoot, req.url);
  }

  // If it's a directory, try to serve index.html
  if (req.url.endsWith('/') && req.url !== '/') {
    filePath = path.join(filePath, 'index.html');
  }

  // Security: prevent directory traversal
  if (!filePath.startsWith(projectRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else if (err.code === 'EISDIR') {
        // If it's a directory, try to serve index.html
        const indexPath = path.join(filePath, 'index.html');
        fs.readFile(indexPath, (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404);
            res.end('Directory index not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Demo server running at http://localhost:${PORT}`);
  console.log(`📝 Open http://localhost:${PORT} to view the demo`);
  console.log(`📁 Demo files are in ./demo/ directory`);
  console.log(`⏹️  Press Ctrl+C to stop the server`);

  // Force output to flush
  if (process.stdout.isTTY) {
    process.stdout.write('');
  }
});
