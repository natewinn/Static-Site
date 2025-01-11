const liveServer = require('live-server');
const { spawn } = require('child_process');

// Start live-server
const params = {
    port: 8080,
    root: "dist",
    open: true,
    file: "index.html",
    wait: 1000
};

// Watch for changes and rebuild
const watcher = spawn('node', ['scripts/build.js'], { stdio: 'inherit' });
liveServer.start(params); 