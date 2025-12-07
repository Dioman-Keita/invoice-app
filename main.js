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

  app.whenReady().then(() => {
    createWindow();

    // Gérer l'URL de démarrage (cas où l'app est fermée et ouverte via le lien)
    const url = process.argv.find(arg => arg.startsWith('invoice-app://'));
    if (url) {
      // Petit délai pour laisser le temps à la fenêtre de charger
      setTimeout(() => handleDeepLink(url), 1000);
    }
  });
}