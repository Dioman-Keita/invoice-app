const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173'); // Vite dev server
  } else {
    win.loadFile(path.join(__dirname, 'client/dist/index.html'));
  }
}

app.whenReady().then(createWindow);
