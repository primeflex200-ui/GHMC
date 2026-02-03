const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8000;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Default to auth-system.html for root
    if (filePath === './') {
        filePath = './auth-system.html';
    }
    
    // Handle industrial map route
    if (filePath === './industrial-map' || filePath === './industrial-map/') {
        filePath = './industrial-map-google.html';
    }
    
    // Add .html extension if no extension
    if (!path.extname(filePath)) {
        filePath += '.html';
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 - File Not Found</title></head>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1>404 - File Not Found</h1>
                            <p>The requested file was not found.</p>
                            <p><a href="/auth-system.html">Go to Login</a></p>
                            <p><a href="/index.html?access=guest">Guest Access</a></p>
                            <p><a href="/industrial-map-google.html">Industrial Map (Google)</a></p>
                        </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`GHMC Civic Services Server running at http://localhost:${port}/`);
    console.log(`Direct Login: http://localhost:${port}/auth-system.html`);
    console.log(`Guest Access: http://localhost:${port}/index.html?access=guest`);
    console.log(`Industrial Map (Google): http://localhost:${port}/industrial-map-google.html`);
    console.log(`Preview with Google Maps: http://localhost:${port}/preview-with-google-maps.html`);
});