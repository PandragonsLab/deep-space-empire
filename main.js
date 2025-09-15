const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // Add icon later
        title: 'Dimensional Explorer',
        show: false // Don't show until ready
    });

    // Start the Node.js server
    startServer();

    // Load the app
    mainWindow.loadURL('http://localhost:3000');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        if (serverProcess) {
            serverProcess.kill();
            serverProcess = null;
        }
    });

    // Remove menu bar (optional)
    mainWindow.setMenuBarVisibility(false);
}

function startServer() {
    // Start the Express server
    serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });

    serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
}

// App event handlers
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
});

// Steam integration preparation (when Steamworks SDK is added)
/*
const steamworks = require('steamworks.js');

app.on('ready', () => {
    if (steamworks.init(YOUR_APP_ID)) {
        console.log('Steam initialized successfully');

        // Steam achievement unlock example
        // steamworks.achievement.activate('FIRST_DISCOVERY');

        // Steam stats example
        // steamworks.stats.setStat('locations_discovered', gameState.exploration.locationsDiscovered);
    }
});
*/