#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root requests
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Get the full file path
    const filePath = path.join(__dirname, pathname);
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        // Get file stats for range requests
        fs.stat(filePath, (statErr, stats) => {
            if (statErr) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
                return;
            }
            
            // Determine content type
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const fileSize = stats.size;
            
            // Set CORS headers for development
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
            
            // CRUCIAL: Add Accept-Ranges header for video files
            if (ext === '.mp4' || ext === '.webm' || ext === '.mov' || ext === '.avi') {
                res.setHeader('Accept-Ranges', 'bytes');
            }
            
            // Handle OPTIONS requests (CORS preflight)
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Handle Range requests for video files
            const range = req.headers.range;
            if (range && (ext === '.mp4' || ext === '.webm' || ext === '.mov' || ext === '.avi')) {
                // Parse range header
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                
                // Create file stream with range
                const file = fs.createReadStream(filePath, { start, end });
                
                // Set partial content headers
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                });
                
                file.pipe(res);
            } else {
                // Regular file serving (non-range request)
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.end('<h1>500 Internal Server Error</h1>');
                        return;
                    }
                    
                    res.writeHead(200, { 
                        'Content-Type': contentType,
                        'Content-Length': fileSize
                    });
                    res.end(data);
                });
            }
        });
    });
});

server.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', 'Starting Memory Maker Shot Breakdown server...');
    console.log('');
    console.log('\x1b[33m%s\x1b[0m', 'The server is running at:');
    console.log('\x1b[36m%s\x1b[0m', `  http://localhost:${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `  http://127.0.0.1:${PORT}`);
    console.log('');
    console.log('\x1b[33m%s\x1b[0m', 'Press Ctrl+C to stop the server');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('\x1b[31m%s\x1b[0m', `Error: Port ${PORT} is already in use`);
        console.log('Try stopping other servers or use a different port');
    } else {
        console.error('\x1b[31m%s\x1b[0m', 'Server error:', err.message);
    }
    process.exit(1);
}); 