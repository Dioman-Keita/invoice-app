const { app, BrowserWindow } = require('electron');
const path = require('path');


// Protokoll registrieren
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('invoice-app', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('invoice-app');
}

const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Simplifié pour ce projet, idéalement true avec preload
    }
  });

  mainWindow = win; // Garder une référence

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'client/dist/index.html'));
  }
}

// Gestion Single Instance & Deep Linking
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Quelqu'un a essayé de lancer une seconde instance, on focus la fenêtre principale
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Gestion de l'URL custom protocol sous Windows/Linux
      const url = commandLine.find(arg => arg.startsWith('invoice-app://'));
      if (url) {
        handleDeepLink(url);
      }
    }
  });


  // Server Management
  const { spawn, exec } = require('child_process');

  let serverProcess;

  function startServer() {
    const isDev = !app.isPackaged;
    let serverPath;

    if (isDev) {
      serverPath = path.join(__dirname, 'server');
    } else {
      // In production, server is in resources/server
      serverPath = path.join(process.resourcesPath, 'server');
    }

    console.log(`[Electron] Starting server from: ${serverPath}`);

    // 1. Start Docker (Database)
    // Note: This requires Docker Desktop to be running on the user's machine
    console.log('[Electron] Starting Docker services...');
    exec('docker compose up -d', { cwd: serverPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Electron] Docker Error: ${error.message}`);
        return;
      }
      if (stderr) console.error(`[Electron] Docker Stderr: ${stderr}`);
      console.log(`[Electron] Docker Output: ${stdout}`);

      // 2. Start Node Server
      // In prod we run the compiled JS, in dev we can run tsx or similar, but simplify by assuming dev uses separate terminal
      if (!isDev) {
        console.log('[Electron] Spawning Node server...');
        serverProcess = spawn('node', ['dist/server/server.js'], {
          cwd: serverPath,
          // Force NODE_ENV to development to allow cookies without HTTPS
          env: { ...process.env, NODE_ENV: 'development', PORT: 3000 }
        });

        serverProcess.stdout.on('data', (data) => {
          console.log(`[Server] ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
          console.error(`[Server Error] ${data}`);
        });

        serverProcess.on('close', (code) => {
          console.log(`[Server] Exited with code ${code}`);
        });
      }
    });
  }

  function stopServer() {
    if (serverProcess) {
      console.log('[Electron] Killing server process...');
      serverProcess.kill();
    }
  }

  app.on('will-quit', stopServer);

  app.whenReady().then(() => {
    startServer();
    createWindow();

    // Gérer l'URL de démarrage (cas où l'app est fermée et ouverte via le lien)
    const url = process.argv.find(arg => arg.startsWith('invoice-app://'));
    if (url) {
      // Petit délai pour laisser le temps à la fenêtre de charger
      setTimeout(() => handleDeepLink(url), 1000);
    }
  });
}
