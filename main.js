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

            // CORRECTION ICI : Chercher l'argument qui CONTIENT le protocole
            // au lieu de "commence par", pour gérer les guillemets éventuels
            const urlArg = commandLine.find(arg => arg.includes('invoice-app://'));

            if (urlArg) {
                // Nettoyage brut côté Main process aussi
                let deepLink = urlArg.replace(/["']/g, "").trim();

                log.info(`🔗 Deep link détecté (Instance courante): ${deepLink}`);
                mainWindow.webContents.send('deep-link', deepLink);
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
    // 1. Création de la fenêtre
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        backgroundColor: '#f0f2f5', // CORRIGÉ : Même couleur que le CSS pour éviter le flash
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 2. Le HTML Simple & Efficace
    const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
          body { 
              /* Police système robuste pour Mac et Windows */
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex; 
              flex-direction: column; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; /* Reset important */
              background: #f0f2f5; 
              color: #333; 
              user-select: none;
          }
          .container { text-align: center; }
          .spinner {
              border: 4px solid #e5e7eb;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin-bottom: 10px; color: #2c3e50; font-weight: 600; }
          p { color: #7f8c8d; margin-top: 0; }
          .timer { 
              font-size: 12px; 
              color: #95a5a6; 
              margin-top: 20px; 
              font-family: monospace;
          }
      </style>
    </head>
    <body>
      <div class="container">
          <div class="spinner"></div>
          <h2>Démarrage de l'application, veuillez patienter un instant 😎</h2>
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

    // 3. Chargement et affichage
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    mainWindow.show();

    // 4. Lancement Backend
    startBackend();

    // 5. Attente du serveur et redirection
    waitForServer()
        .then(() => {
            log.info('🌍 Serveur prêt, chargement application...');

            // Gestion du Deep Link
            let targetUrl = BACKEND_URL;
            if (deepLinkUrl) {
                // CORRECTION: Adapter pour HashRouter
                // On retire le protocole et les slashes initiaux
                const rawPath = deepLinkUrl.replace(/^invoice-app:\/*/, '');
                // On construit l'URL avec le hash pour que React Router (HashRouter) la comprenne
                const pathStr = `/#/${rawPath}`;

                targetUrl = `${BACKEND_URL}${pathStr}`;
                log.info(`🌍 Redirection vers: ${targetUrl}`);
            }

            mainWindow.loadURL(targetUrl);
        })
        .catch((err) => {
            log.error(err);
            // En cas d'erreur fatale, on le dit à l'utilisateur
            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Erreur Fatale',
                message: "Le serveur n'a pas pu démarrer.",
                detail: err.message + "\nVérifiez que Docker est lancé."
            });
        });

    mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(createMainWindow);
app.on('will-quit', () => stopBackend());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });