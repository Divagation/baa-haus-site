/**
 * Simple development server for baa.haus
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/src/index.html' : req.url;

  // Serve files from src directory
  if (!filePath.startsWith('/assets')) {
    filePath = filePath.replace(/^\/src/, '/src');
    if (!filePath.startsWith('/src') && !filePath.startsWith('/assets')) {
      filePath = '/src' + filePath;
    }
  }

  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🏠 baa.haus development server running at:`);
  console.log(`   http://localhost:${PORT}\n`);
});
