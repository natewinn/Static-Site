const liveServer = require('live-server');
const { spawn } = require('child_process');
const fs = require('fs-extra');

let server = null;
let watcher = null;

async function startServer() {
    console.log('Building site...');
    
    // Run initial build
    try {
        require('./build.js');
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }

    // Start live-server
    const params = {
        port: 8080,
        root: "dist",
        open: true,
        file: "index.html",
        wait: 1000
    };

    console.log('Starting development server at http://localhost:8080');

    // Watch for changes and rebuild
    watcher = spawn('node', ['scripts/build.js'], { stdio: 'inherit' });

    watcher.on('error', (err) => {
        console.error('Failed to start watcher:', err);
    });

    // Handle shutdown gracefully
    const shutdown = () => {
        console.log('\nShutting down server...');
        if (watcher) {
            watcher.kill();
        }
        if (server) {
            server.close();
        }
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('exit', shutdown);

    server = liveServer.start(params);
}

startServer().catch(console.error); 