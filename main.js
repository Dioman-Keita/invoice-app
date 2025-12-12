const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { fork, exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const log = require('electron-log');

// --- 1. CONFIGURATION LOGS ---
log.transports.file.level = 'info';
log.transports.file.fileName = 'main.log';
Object.assign(console, {
    log: log.log,
    info: log.info,
    error: log.error,
    warn: log.warn
});

// --- 2. CONFIGURATION DEEP LINK ---
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('invoice-app', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('invoice-app');
}

// --- 3. VARIABLES GLOBALES ---
let mainWindow = null;
let backendProcess = null;
let deepLinkUrl = null;

const BACKEND_PORT = 3000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// --- 4. INSTANCE UNIQUE ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            
            const url = commandLine.find(arg => arg.startsWith('invoice-app://'));
            if (url) {
                log.info(`🔗 Deep link (Instance existante): ${url}`);
                mainWindow.webContents.send('deep-link', url);
            }
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    deepLinkUrl = url;
    log.info(`🔗 Deep link (Mac): ${url}`);
    if (mainWindow) {
        mainWindow.webContents.send('deep-link', url);
    }
});

if (process.platform === 'win32') {
    deepLinkUrl = process.argv.find(arg => arg.startsWith('invoice-app://'));
}

// --- 5. CHEMINS ---
function getResourcesPaths() {
  const isProd = app.isPackaged;
  const rootPath = isProd ? process.resourcesPath : __dirname;
  
  const serverPath = path.join(rootPath, 'server');
  const clientDistPath = path.join(rootPath, 'client', 'dist');
  const templatesPath = path.join(serverPath, 'templates');

  let serverEntry = path.join(serverPath, 'dist', 'server', 'server.js');
  if (!fs.existsSync(serverEntry)) serverEntry = path.join(serverPath, 'dist', 'server.js');
  if (!fs.existsSync(serverEntry)) serverEntry = path.join(serverPath, 'server.js');

  return { serverPath, clientDistPath, serverEntry, templatesPath };
}

// --- 6. DOCKER ---
function ensureDockerIsRunning(cwd) {
    return new Promise((resolve) => {
        log.info('🐳 Vérification Docker...');
        exec('docker compose up -d --remove-orphans', { cwd }, (error, stdout, stderr) => {
            if (error) log.warn(`⚠️ Docker warning: ${error.message}`);
            else log.info(`✅ Docker Output: ${stdout}`);
            resolve();
        });
    });
}

// --- 7. BACKEND ---
async function startBackend() {
    const paths = getResourcesPaths();
    log.info('🚀 Démarrage Backend...');
    
    await ensureDockerIsRunning(paths.serverPath);

    if (!fs.existsSync(paths.serverEntry)) {
        log.error('❌ Fichier server.js introuvable !');
        return;
    }

    const env = { 
        ...process.env, 
        PORT: BACKEND_PORT,
        NODE_ENV: app.isPackaged ? 'production' : 'development',
        SERVER_TEMPLATES_PATH: paths.templatesPath, 
        CLIENT_DIST_PATH: paths.clientDistPath,
        ELECTRON_RUN_AS_NODE: '1'
    };

    try {
        backendProcess = fork(paths.serverEntry, [], {
            cwd: paths.serverPath,
            env: env,
            silent: true
        });

        backendProcess.stdout.on('data', (data) => log.info(`[SERVER] ${data}`));
        backendProcess.stderr.on('data', (data) => log.error(`[SERVER ERROR] ${data}`));
        
    } catch (e) {
        log.error("❌ Exception fork:", e);
    }
}

function stopBackend() {
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
}

// --- 8. ATTENTE SERVEUR ---
function waitForServer() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 45; 
        
        const check = () => {
            attempts++;
            http.get(BACKEND_URL + '/api/health', (res) => {
                log.info(`✅ Backend connecté !`);
                resolve();
            }).on('error', (err) => {
                if (attempts >= maxAttempts) {
                    reject(new Error(`Timeout Backend`));
                } else {
                    setTimeout(check, 1000);
                }
            });
        };
        check();
    });
}

// --- 9. UI ---
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false, 
        backgroundColor: '#f5f5f5',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
          body { 
              font-family: 'Segoe UI', sans-serif; 
              display: flex; 
              flex-direction: column; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background: #f0f2f5; 
              color: #333; 
              user-select: none;
          }
          .container { text-align: center; }
          .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin-bottom: 10px; color: #2c3e50; }
          p { color: #7f8c8d; }
          .timer { 
              font-size: 12px; 
              color: #95a5a6; 
              margin-top: 15px; 
              font-family: monospace;
          }
      </style>
    </head>
    <body>
      <div class="container">
          <div class="spinner"></div>
          <h2>Démarrage de Invoice App</h2>
          <p>Initialisation de la base de données et du serveur...</p>
          <div class="timer" id="timer">Temps écoulé : 0s</div>
      </div>
      <script>
          let seconds = 0;
          setInterval(() => {
              seconds++;
              document.getElementById('timer').innerText = 'Temps écoulé : ' + seconds + 's';
          }, 1000);
      </script>
    </body>
    </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    mainWindow.show();

    startBackend();

    waitForServer()
        .then(() => {
            log.info('🌍 Chargement application...');
            
            // Gestion du Deep Link au démarrage à froid
            let targetUrl = BACKEND_URL;
            if (deepLinkUrl) {
                // Transforme "invoice-app://verify?token=..." en "/verify?token=..."
                const pathStr = deepLinkUrl.replace(/^invoice-app:\/*/, '/');
                targetUrl = `${BACKEND_URL}${pathStr}`;
                log.info(`🌍 Redirection initiale vers: ${targetUrl}`);
            }
            
            mainWindow.loadURL(targetUrl);
        })
        .catch((err) => {
            log.error(err);
            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Erreur',
                message: "Le serveur ne répond pas.",
                detail: err.message
            });
        });
        
    mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(createMainWindow);
app.on('will-quit', () => stopBackend());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });