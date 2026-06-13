const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let serverProcess;
let mainWindow;

// Simple replacement for wait-on to avoid production dependency issues
function waitForUrl(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for server'));
        return;
      }

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {
        // Ignore errors and keep trying
      });
    }, 500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "ScholarGuard",
    icon: path.join(__dirname, '../public/favicon.ico'), // Adjust if you have an icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In production, we load the local server URL
  // The server will be running on port 3000
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  // Start the express server
  const isDev = !app.isPackaged;
  const command = isDev ? 'npm' : 'node';
  const args = isDev 
    ? ['run', 'dev'] 
    : [path.join(__dirname, '../dist-server/server.js')];

  console.log(`Starting server with command: ${command} ${args.join(' ')}`);

  serverProcess = spawn(command, args, {
    shell: true,
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: '3000' // Ensure it always uses 3000
    }
  });

  // Wait for the server to be ready before opening the window
  waitForUrl('http://localhost:3000', 30000).then(() => {
    createWindow();
  }).catch((err) => {
    console.error('Server failed to start:', err);
    app.quit();
  });
}

app.on('ready', startServer);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
